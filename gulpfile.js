const gulp = require('gulp');
const ts = require( 'gulp-typescript');

// pull in the project TypeScript config
const tsProject = ts.createProject('tsconfig.json');

gulp.task('compile', () => {
  const tsResult = tsProject.src()
  .pipe(tsProject());
  return tsResult.js.pipe(gulp.dest('lib'));
});

gulp.task('watch', ['compile'], () => {
  gulp.watch(['*.ts'], ['compile']);
});

gulp.task('default', ['watch']);
