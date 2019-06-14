"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var virtual_stats_1 = __importDefault(require("./virtual_stats"));
var path_1 = require("path");
var inode = 45000000;
function check_activation(instance) {
    if (!instance.compiler) {
        throw new Error('You must use this plugin only after creating webpack instance!');
    }
}
var get_module_path = function (file_path, compiler) {
    return path_1.isAbsolute(file_path) ? file_path : path_1.join(compiler.context, file_path);
};
function set_data(storage, key, value) {
    if (storage.data instanceof Map) {
        storage.data.set(key, value);
    }
    else {
        storage.data[key] = value;
    }
}
var VirtualModulesPlugin = /** @class */ (function () {
    function VirtualModulesPlugin(modules) {
        this.static_modules = modules;
    }
    VirtualModulesPlugin.prototype.writeModule = function (file_path, contents) {
        var self = this;
        check_activation(self);
        var len = contents ? contents.length : 0;
        var time = Date.now();
        var stats = new virtual_stats_1.default({
            dev: 8675309,
            nlink: 0,
            uid: 1000,
            gid: 1000,
            rdev: 0,
            blksize: 4096,
            ino: inode++,
            mode: 33188,
            size: len,
            blocks: Math.floor(len / 4096),
            atime: time,
            mtime: time,
            ctime: time,
            birthtime: time
        });
        var modulePath = get_module_path(file_path, self.compiler);
        // @ts-ignore
        self.compiler.inputFileSystem._writeVirtualFile(modulePath, stats, contents);
        if (self.watcher &&
            self.watcher.watchFileSystem.watcher.fileWatchers.length) {
            self.watcher.watchFileSystem.watcher.fileWatchers.forEach(function (file_watcher) {
                if (file_watcher.path === modulePath) {
                    file_watcher.emit('change', time, null);
                }
            });
        }
    };
    VirtualModulesPlugin.prototype.apply = function (compiler) {
        var self = this;
        self.compiler = compiler;
        var after_environment_hook = function () {
            // @ts-ignore
            if (!compiler.inputFileSystem._writeVirtualFile) {
                var originalPurge = compiler.inputFileSystem.purge;
                compiler.inputFileSystem.purge = function () {
                    originalPurge.call(this, arguments);
                    if (this._virtualFiles) {
                        Object.keys(this._virtualFiles).forEach(function (file) {
                            var data = this._virtualFiles[file];
                            set_data(this._statStorage, file, [null, data.stats]);
                            set_data(this._readFileStorage, file, [null, data.contents]);
                        }.bind(this));
                    }
                };
                // @ts-ignore
                compiler.inputFileSystem._writeVirtualFile = function (file, stats, contents) {
                    this._virtualFiles = this._virtualFiles || {};
                    this._virtualFiles[file] = { stats: stats, contents: contents };
                    set_data(this._statStorage, file, [null, stats]);
                    set_data(this._readFileStorage, file, [null, contents]);
                };
            }
        };
        var after_resolvers_hook = function () {
            if (self.static_modules) {
                Object.keys(self.static_modules).forEach(function (path) {
                    self.writeModule(path, self.static_modules[path]);
                });
                delete self.static_modules;
            }
        };
        var watch_run_hook = function (watcher, callback) {
            self.watcher = watcher.compiler || watcher;
            callback();
        };
        if (compiler.hooks) {
            compiler.hooks.afterEnvironment.tap('VirtualModulesPlugin', after_environment_hook);
            compiler.hooks.afterResolvers.tap('VirtualModulesPlugin', after_resolvers_hook);
            compiler.hooks.watchRun.tapAsync('VirtualModulesPlugin', watch_run_hook);
        }
        else {
            compiler.plugin('after-environment', after_environment_hook);
            compiler.plugin('after-resolvers', after_resolvers_hook);
            compiler.plugin('watch-run', watch_run_hook);
        }
    };
    return VirtualModulesPlugin;
}());
exports.default = VirtualModulesPlugin;
