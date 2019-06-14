# Gulp Webpack Bundler
This is a Gulp plugin that allows you to seamlessly integrate webpack within your build process, bundling your files whenever you want in your build process and applying any kind of transformation *before or after* running webpack.

The plugin is also compatible with `gulp-sourcemaps` and has support for dynamic imports and code-splitting.

## Installation
```shell
npm install --save-dev gulp-webpack-bundler
```
or
```shell
npm i -D gulp-webpack-bundler
```

## Using the plugin
You can use this plugin just as you would for any other plugin, for example:
```javascript
gulp.task('default', () => {
  return gulp
    .src(['src/**/*.js'])
    .pipe(
      webpack_gulp({
        entry: './src/index.js',
        mode: 'production'
      })
    )
    .pipe(gulp.dest('dist'));
});
```
The only argument it takes in is an instance of webpack's [Configuration](https://webpack.js.org/configuration/). You can see a similar example in the `example` folder.

## Caveats
While I've tried to make this plugin as compatible as possible with all webpack APIs, it comes with two caveats (or, at least, two caveats that I know of):

1. It is not compatible with `webpack-dev-server`. For a live development environment configuration, see the `example` folder.
2. If you transformed your files with a plugin that changed their extension (for example, TypeScript changes the extension from `.ts(x)` to `.js`), you will need to specify the files with their new extensions as entries. For instance, this would not be valid:
  ```javascript
  gulp.task('default', () => {
    return gulp
      .src(['src/**/*.ts'])
      .pipe(ts())
      .pipe(
        webpack_gulp({
          entry: './src/index.ts',
          mode: 'production'
        })
      )
      .pipe(gulp.dest('dist'));
  });
  ```
  but this would:
  ```javascript
  gulp.task('default', () => {
    return gulp
      .src(['src/**/*.ts'])
      .pipe(ts())
      .pipe(
        webpack_gulp({
          entry: './src/index.js',
          mode: 'production'
        })
      )
      .pipe(gulp.dest('dist'));
  });
  ```
  Note that, as a workaround, you can specify the file without extension, and add the transformed extension to webpack's `configuration.resolve.extensions`. For example:
  ```javascript
  gulp.task('default', () => {
    return gulp
      .src(['src/**/*.ts'])
      .pipe(ts())
      .pipe(
        webpack_gulp({
          entry: './src/index',
          mode: 'production',
          resolve: {
            extensions: ['.js']
          }
        })
      )
      .pipe(gulp.dest('dist'));
  });
  ```

## License
[![Creative Commons License](https://i.creativecommons.org/l/by-sa/4.0/88x31.png)](http://creativecommons.org/licenses/by-sa/4.0/)

This work is licensed under a [Creative Commons Attribution-ShareAlike 4.0 International License](http://creativecommons.org/licenses/by-sa/4.0/).
