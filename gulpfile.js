var gulp = require("gulp");
var del = require("del");
var ts = require("gulp-typescript");
var tsProject = ts.createProject("tsconfig.json");

gulp.task('clean', () => del('dist/**', {force:true}));

gulp.task('ts', () => tsProject
    .src()
    .pipe(tsProject())
    .js.pipe(gulp.dest('dist')));

gulp.task('copy', () => gulp
  .src([
    './src/**/*.*',
    '!./src/**/*.ts'
  ], { 
    // the base option sets the relative root for the set of files,
    // preserving the folder structure
    base: './src/' 
  })
  .pipe(gulp.dest('dist')));

gulp.task('default', gulp.series('clean', gulp.parallel('ts', 'copy')));
