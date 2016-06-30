const gulp = require('gulp');
const babel = require('gulp-babel');
const plumber = require('gulp-plumber');

gulp.task('compile', function () {
    gulp.src('src/**/*')
        .pipe(plumber())
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest('lib'));
});

gulp.task('watch', function () {
    gulp.watch('src/**/*', ['compile']);
});

gulp.task('default', ['compile']);
