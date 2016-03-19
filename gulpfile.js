/* File: gulpfile.js */
// Some from https://gist.github.com/danharper/3ca2273125f500429945

var gulp  = require('gulp'),
    gutil = require('gulp-util'),
    sourcemaps = require('gulp-sourcemaps'),
    source = require('vinyl-source-stream'),
	buffer = require('vinyl-buffer'),
    browserify = require('browserify'),
    watchify = require('watchify'),
    babel = require('babelify');

function compile(watch) {
  var bundler = watchify(browserify('./public/src/javascripts/main.js', { debug: true }).transform(babel));

  function rebundle() {
    bundler.bundle()
      .on('error', function(err) { console.error(err); this.emit('end'); })
      .pipe(source('main.js'))
      .pipe(buffer())
      .pipe(sourcemaps.init({ loadMaps: true }))
      .pipe(sourcemaps.write('./'))
      .pipe(gulp.dest('./public/build/javascripts'));
  }

  if (watch) {
    bundler.on('update', function() {
      console.log('-> bundling...');
      rebundle();
    });
  }

  rebundle();
}

function jswatch() {
  return compile(true);
}

gulp.task('build', function() { return compile(); });
gulp.task('css', function() {
	gulp.src('./public/src/stylesheets/*.css')
    .pipe(gulp.dest('./public/build/stylesheets'));
});

gulp.task('jswatch', function() { return jswatch(); });
gulp.task('csswatch', function() { gulp.watch('./public/src/stylesheets/*.css', ['css']); });

gulp.task('default', ['jswatch', 'csswatch']);
