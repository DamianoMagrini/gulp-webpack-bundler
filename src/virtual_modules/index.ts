import VirtualStats from './virtual_stats';
import { isAbsolute, join } from 'path';

import { Compiler, Stats } from 'webpack';

var inode = 45000000;

function check_activation(instance: any) {
  if (!instance.compiler) {
    throw new Error(
      'You must use this plugin only after creating webpack instance!'
    );
  }
}

const get_module_path = (file_path: string, compiler: Compiler) =>
  isAbsolute(file_path) ? file_path : join(compiler.context, file_path);

function set_data(
  storage: { data: { [path: string]: string } },
  key: string,
  value: any
) {
  if (storage.data instanceof Map) {
    storage.data.set(key, value);
  } else {
    storage.data[key] = value;
  }
}

class VirtualModulesPlugin {
  static_modules: { [path: string]: string };
  compiler: Compiler;
  watcher: any;
  constructor(modules: { [path: string]: string }) {
    this.static_modules = modules;
  }
  writeModule(file_path: string, contents: string) {
    var self = this;
    check_activation(self);
    var len = contents ? contents.length : 0;
    var time = Date.now();
    var stats = new VirtualStats({
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
    self.compiler.inputFileSystem._writeVirtualFile(
      modulePath,
      stats,
      contents
    );
    if (
      self.watcher &&
      self.watcher.watchFileSystem.watcher.fileWatchers.length
    ) {
      self.watcher.watchFileSystem.watcher.fileWatchers.forEach(function(
        file_watcher: any
      ) {
        if (file_watcher.path === modulePath) {
          file_watcher.emit('change', time, null);
        }
      });
    }
  }
  apply(compiler: Compiler) {
    var self = this;
    self.compiler = compiler;

    var after_environment_hook = function() {
      // @ts-ignore
      if (!compiler.inputFileSystem._writeVirtualFile) {
        var originalPurge = compiler.inputFileSystem.purge;
        compiler.inputFileSystem.purge = function() {
          originalPurge.call(this, arguments);
          if (this._virtualFiles) {
            Object.keys(this._virtualFiles).forEach(
              function(file: any) {
                var data = this._virtualFiles[file];
                set_data(this._statStorage, file, [null, data.stats]);
                set_data(this._readFileStorage, file, [null, data.contents]);
              }.bind(this)
            );
          }
        };
        // @ts-ignore
        compiler.inputFileSystem._writeVirtualFile = function(
          file: any,
          stats: Stats,
          contents: string
        ) {
          this._virtualFiles = this._virtualFiles || {};
          this._virtualFiles[file] = { stats: stats, contents: contents };
          set_data(this._statStorage, file, [null, stats]);
          set_data(this._readFileStorage, file, [null, contents]);
        };
      }
    };

    var after_resolvers_hook = function() {
      if (self.static_modules) {
        Object.keys(self.static_modules).forEach(function(path) {
          self.writeModule(path, self.static_modules[path]);
        });
        delete self.static_modules;
      }
    };

    var watch_run_hook = function(watcher: any, callback: () => void) {
      self.watcher = watcher.compiler || watcher;
      callback();
    };

    if (compiler.hooks) {
      compiler.hooks.afterEnvironment.tap(
        'VirtualModulesPlugin',
        after_environment_hook
      );
      compiler.hooks.afterResolvers.tap(
        'VirtualModulesPlugin',
        after_resolvers_hook
      );
      compiler.hooks.watchRun.tapAsync('VirtualModulesPlugin', watch_run_hook);
    } else {
      compiler.plugin('after-environment', after_environment_hook);
      compiler.plugin('after-resolvers', after_resolvers_hook);
      compiler.plugin('watch-run', watch_run_hook);
    }
  }
}

export default VirtualModulesPlugin;
