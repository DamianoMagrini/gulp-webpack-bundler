const PLUGIN_NAME = 'gulp-webpack-bundler';

import path from 'path';

import through2, {
  TransformFunction,
  TransformCallback,
  FlushCallback
} from 'through2';
import Vinyl from 'vinyl';
import PluginError from 'plugin-error';
import apply_sourcemap from './apply_sourcemap';

import webpack, { Configuration } from 'webpack';
import VirtualModulesPlugin from './virtual_modules';

/*
  Create a `FileSystem` object, where:
  - keys (strings) are the files' paths
  - values (strings) are the files' contents
  This will be used for creating virtual input and output file systems.
*/
interface FileSystem {
  [path: string]: string;
}

export = (configuration: Configuration) => {
  /*
    Create a virtual input file system, where files that pass through the
    `transform` function will be added.
  */
  let input_file_system: FileSystem = {};

  const transform: TransformFunction = function(
    file: Vinyl,
    encoding: string,
    callback: TransformCallback
  ) {
    // Emit an error if the file's contents are not a buffer
    if (!file.isBuffer())
      this.emit(
        'error',
        new PluginError(
          PLUGIN_NAME,
          'Only files whose contents are a buffer are supported!'
        )
      );

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

  const flush: FlushCallback = function(
    callback: (error?: any, data?: any) => void
  ) {
    const compiler = webpack({
      ...configuration,
      devtool: configuration.mode === 'development' ? 'source-map' : undefined,
      module: {
        ...configuration.module,
        rules: [
          ...(configuration.module || { rules: [] }).rules,
          {
            test: /\.js$/,
            use: ['source-map-loader'],
            enforce: 'pre'
          }
        ]
      },
      plugins: [
        new VirtualModulesPlugin(input_file_system),
        ...(configuration.plugins || [])
      ],
      output: {
        ...configuration.output,
        path: process.cwd()
      }
    });

    /*
      Create a virtual output file system, where webpack's output file(s) will
      be written.
    */
    let output_file_system: FileSystem = {};

    /*
      Provide the compiler with a puppet `outputFileSystem`, where all methods
      do nothing except for `writeFile` which adds the bundled file to the
      'actual' (albeit virtual) output file system.
    */
    compiler.outputFileSystem = {
      join: (...paths) => path.join(...paths),
      mkdir: (_path, callback) => callback(null),
      mkdirp: (_path, callback) => callback(null),
      rmdir: (_path, callback) => callback(null),
      unlink: (_path, callback) => callback(null),
      writeFile: (_path, data: Buffer, callback) => {
        output_file_system[_path] = data.toString();
        callback(null);
      }
    };

    compiler.run((error) => {
      // If the callback was passed an error, emit it.
      if (error) this.emit('error', new PluginError(PLUGIN_NAME, error));

      Object.keys(output_file_system).forEach((file_path) => {
        /*
          If the file is a source map (that is, it ends with '.something.map'),
          ignore it, as source maps are processed together with the files they
          are relative to.
        */
        if (path.extname(file_path) === '.map') return;

        // Pass the bundled files to the callback as output.
        const file = new Vinyl({
          path: path.resolve(file_path),
          contents: Buffer.from(output_file_system[file_path])
        });

        const source_map = output_file_system[file_path + '.map'];
        if (source_map) apply_sourcemap(file, JSON.parse(source_map));

        this.push(file);
      });

      // Data has already been sent via `this.push`.
      return callback(null);
    });
  };

  // Return a stream with the above defined `transform` and `flush` functions.
  return through2.obj(transform, flush);
};
