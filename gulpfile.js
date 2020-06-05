var gulp = require("gulp");
var ts = require("gulp-typescript");
var tsProject = ts.createProject("tsconfig.json");

gulp.task('ts', () => tsProject
    .src()
    .pipe(tsProject())
    .js.pipe(gulp.dest('dist')));

gulp.task('move', () => gulp
  .src([
    './src/html/**/*.*',
  ], { 
    // the base option sets the relative root for the set of files,
    // preserving the folder structure
    base: './src/' 
  })
  .pipe(gulp.dest('dist')));

gulp.task('default', gulp.series('ts', 'move'));
