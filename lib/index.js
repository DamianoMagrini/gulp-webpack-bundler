"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var PLUGIN_NAME = 'gulp-webpack-bundler';
var path_1 = __importDefault(require("path"));
var through2_1 = __importDefault(require("through2"));
var vinyl_1 = __importDefault(require("vinyl"));
var plugin_error_1 = __importDefault(require("plugin-error"));
var apply_sourcemap_1 = __importDefault(require("./apply_sourcemap"));
var webpack_1 = __importDefault(require("webpack"));
var virtual_modules_1 = __importDefault(require("./virtual_modules"));
module.exports = function (configuration) {
    /*
      Create a virtual input file system, where files that pass through the
      `transform` function will be added.
    */
    var input_file_system = {};
    var transform = function (file, encoding, callback) {
        // Emit an error if the file's contents are not a buffer
        if (!file.isBuffer())
            this.emit('error', new plugin_error_1.default(PLUGIN_NAME, 'Only files whose contents are a buffer are supported!'));
        // If the file is actually a directory (😱😱😱), ignore it.
        if (!file.isDirectory())
            /*
              Otherwise, convert it to the appropriate format and add it to the list
              of files, using a path relative to the project root (`src/...`).
            */
            input_file_system[file.path] = file.contents.toString();
        /*
          If the file contains a source map, add it to the file's contents, for
          it to be processed by `source-map-loader`.
        */
        if (file.sourceMap)
            input_file_system[file.path] +=
                '\n//# sourceMappingURL=data:application/json;charset=utf8;base64,' +
                    Buffer.from(JSON.stringify(file.sourceMap)).toString('base64');
        /*
          Don't send data after `transform` has run, as the bundle(s) will be
          created and sent in `flush`, where webpack actually runs.
        */
        return callback(null);
    };
    var flush = function (callback) {
        var _this = this;
        var compiler = webpack_1.default(__assign({}, configuration, { devtool: configuration.mode === 'development' ? 'source-map' : undefined, module: __assign({}, configuration.module, { rules: (configuration.module || { rules: [] }).rules.concat([
                    {
                        test: /\.js$/,
                        use: ['source-map-loader'],
                        enforce: 'pre'
                    }
                ]) }), plugins: [
                new virtual_modules_1.default(input_file_system)
            ].concat((configuration.plugins || [])), output: __assign({}, configuration.output, { path: process.cwd() }) }));
        /*
          Create a virtual output file system, where webpack's output file(s) will
          be written.
        */
        var output_file_system = {};
        /*
          Provide the compiler with a puppet `outputFileSystem`, where all methods
          do nothing except for `writeFile` which adds the bundled file to the
          'actual' (albeit virtual) output file system.
        */
        compiler.outputFileSystem = {
            join: function () {
                var paths = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    paths[_i] = arguments[_i];
                }
                return path_1.default.join.apply(path_1.default, paths);
            },
            mkdir: function (_path, callback) { return callback(null); },
            mkdirp: function (_path, callback) { return callback(null); },
            rmdir: function (_path, callback) { return callback(null); },
            unlink: function (_path, callback) { return callback(null); },
            writeFile: function (_path, data, callback) {
                output_file_system[_path] = data.toString();
                callback(null);
            }
        };
        compiler.run(function (error) {
            // If the callback was passed an error, emit it.
            if (error)
                _this.emit('error', new plugin_error_1.default(PLUGIN_NAME, error));
            Object.keys(output_file_system).forEach(function (file_path) {
                /*
                  If the file is a source map (that is, it ends with '.something.map'),
                  ignore it, as source maps are processed together with the files they
                  are relative to.
                */
                if (path_1.default.extname(file_path) === '.map')
                    return;
                // Pass the bundled files to the callback as output.
                var file = new vinyl_1.default({
                    path: path_1.default.resolve(file_path),
                    contents: Buffer.from(output_file_system[file_path])
                });
                var source_map = output_file_system[file_path + '.map'];
                if (source_map)
                    apply_sourcemap_1.default(file, JSON.parse(source_map));
                _this.push(file);
            });
            // Data has already been sent via `this.push`.
            return callback(null);
        });
    };
    // Return a stream with the above defined `transform` and `flush` functions.
    return through2_1.default.obj(transform, flush);
};
