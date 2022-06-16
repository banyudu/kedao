const gulp = require("gulp");
const replace = require("gulp-replace");
const sass = require("gulp-sass")(require("sass"));

function compileSass() {
  return gulp
    .src("src/**/*.scss")
    .pipe(sass().on("error", sass.logError))
    .pipe(gulp.dest("lib"));
}

gulp.task("css:compile", compileSass);

function replaceSassImport() {
  return gulp
    .src(["lib/**/*.js"])
    .pipe(
      replace(/^import\s+(?:'|")(.+?)(?:'|")/gm, (match, p1) => {
        return match.replace(p1, p1.replace(".scss", ".css"));
      })
    )
    .pipe(gulp.dest("lib"));
}

gulp.task("css:replace", replaceSassImport);

exports.css = gulp.series("css:compile", "css:replace");
