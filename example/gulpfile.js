const gulp = require('gulp');

const connect = require('gulp-connect');
const webpack_gulp = require('..');

const files = ['src/**/*.js'];

gulp.task('bundle', () => {
  return gulp
    .src(files)
    .pipe(
      webpack_gulp({
        entry: './src/index.js',
        mode: 'production'
      })
    )
    .pipe(gulp.dest('dist'));
});

gulp.task('rebundle', () => {
  return gulp
    .src(files)
    .pipe(
      webpack_gulp({
        entry: './src/index.js',
        mode: 'production'
      })
    )
    .pipe(gulp.dest('dist'))
    .pipe(connect.reload());
});

gulp.task('connect', function() {
  connect.server({
    root: 'app',
    livereload: true
  });
});

gulp.task('watch', function() {
  gulp.watch(['src/**/*.js'], gulp.task('rebundle'));
});

gulp.task('serve', gulp.parallel('connect', 'watch'));
gulp.task('default', gulp.task('bundle'));
