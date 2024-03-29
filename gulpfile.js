const gulp = require("gulp");
// const replace = require("gulp-replace");
const sass = require("gulp-sass")(require("sass"));

function compileSass() {
  return gulp
    .src("src/**/*.scss")
    // Don't catch errors, since we don't want a fixed 0 exitcode
    // .pipe(sass().on("error", sass.logError))
    .pipe(sass())
    .pipe(gulp.dest("lib"));
}

gulp.task("css:compile", compileSass);
gulp.task("css:watch", function () {
  gulp.watch("src/**/*.scss", gulp.series("css:compile"));
});

// use ts-rename-import-plugin instead of gulp
// function replaceSassImport() {
//   return gulp
//     .src(["lib/**/*.js"])
//     .pipe(
//       replace(/^import\s+(?:'|")(.+?)(?:'|")/gm, (match, p1) => {
//         return match.replace(p1, p1.replace(".scss", ".css"));
//       })
//     )
//     .pipe(gulp.dest("lib"));
// }

// gulp.task("css:replace", replaceSassImport);

// exports.css = gulp.series("css:compile", "css:replace");
exports.css = gulp.series("css:compile");
exports.watch = gulp.series("css:watch");
