'use strict';

/*
 * Fellowary CHAT AND FILE MANAGEMENT GULP FILE
 */

/////////////////////////////////////////////////////////////////////////////
// CONFIGURATION

var settings = {
  "templateName": "Fellowary Chat and File Management",
  "title": "Fellowary Chat and File Management",
  "version": "1.0.0",
  "description": "",
};

/////////////////////////////////////////////////////////////////////////////
// GULP PLUGINS

var gulp = require('gulp'),
  watch = require('gulp-watch'),
  autoprefix = require('gulp-autoprefixer'),
  sass = require('gulp-sass'),
  rename = require('gulp-rename'),
  rigger = require('gulp-rigger'),
  ignore = require('gulp-ignore'),
  rimraf = require('gulp-rimraf'),
  browserSync = require("browser-sync"),
  wrap = require('gulp-wrap'),
  template = require('gulp-template'),
  data = require('gulp-data'),
  fs = require('fs'),
  runSequence = require('run-sequence').use(gulp),
  flatten = require('gulp-flatten');

/////////////////////////////////////////////////////////////////////////////
// GULP PATHS

var path = {
  src: {
    versions: 'src/versions/',
    versionsFiles: 'src/versions/**/*.html',
    pages: 'src/pages/**/*.html',
    components: 'src/components/',

    templates: 'src/components/**/**/*.html',
    img: 'src/components/**/img/**/*.*',
    css: 'src/components/**/**/*.scss',
    js: 'src/components/**/**/*.js',
    favicon: 'src/components/dummy-assets/img/favicon.ico',

    tmpPages: './dist/versions/tmp/pages/',
    tmpPagesFiles: './dist/versions/tmp/pages/**/*.html',
    tmpVersions: './dist/versions/tmp/versions/',
    tmpVersionsFiles: './dist/versions/tmp/versions/*.html',

    vendors_by_bower: 'src/vendors/by_bower/**/*.*',
    vendors_by_hands: 'src/vendors/by_hands/**/*.*'
  },
  build: {
    versions: './dist/versions/',
    components: 'dist/components/',
    vendors: 'dist/vendors/',
  },
  clean: ['dist/*']
};

/////////////////////////////////////////////////////////////////////////////
// PRINT ERRORS

function printError(error) {
  console.log(error.toString()); // print error
  this.emit('end'); // end task
}

/////////////////////////////////////////////////////////////////////////////
// BROWSERSYNC SERVE

gulp.task('serve', function () {
  browserSync({
    server: {
      baseDir: "./dist/", // base dir path
      directory: true // show as directory
    },
    tunnel: false, // tunnel
    host: 'localhost', // host
    port: 9000, // port
    logPrefix: "frontend", // console log prefix
  }); // run BrowserSync
});

/////////////////////////////////////////////////////////////////////////////
// BUILD PAGES

gulp.task('build:versions', function () {

  const arrayHtml = fs.readdirSync(path.src.versions).filter(function (e) { return e !== 'head.html' }); //  get template versions path excluding head.html

  for (const i in arrayHtml) {
    gulp.task(arrayHtml[i], function () {
      return gulp.src(path.src.tmpPagesFiles, { base: './' }) // get pages templates
        .pipe(rename(function (path) {
          const prefix = path.dirname;
          path.dirname = "/";
          path.basename = prefix + '-' + path.basename;
        }))
        .pipe(data({
          templateName: settings.templateName,
          title: settings.title,
          productVersion: settings.version
        })) // set variables
        .pipe(wrap({ src: path.src.tmpVersions + arrayHtml[i] })) // insert all pages to layout
        .pipe(template())
        .pipe(flatten())
        .pipe(gulp.dest(path.build.versions + arrayHtml[i].replace('.html', ''))) // copy generated pages to build folder
    })
  }

  gulp.task('build:tmp-pages', function () {
    return gulp.src(path.src.pages) // get pages templates
      .pipe(rigger()) // include component templates to generated pages
      .pipe(gulp.dest(path.src.tmpPages)) // copy generated pages to build folder
  })

  gulp.task('build:tmp-versions', function () {
    return gulp.src(path.src.versionsFiles) // get pages templates
      .pipe(ignore.exclude('**/head.html')) // exclude mixins.scss file
      .pipe(rigger()) // include component templates to generated pages
      .pipe(gulp.dest(path.src.tmpVersions)) // copy generated pages to build folder
  })

  gulp.task('build:del-tmp-files', function () {
    return gulp.src('./dist/versions/tmp') // get build folder
      .pipe(rimraf()); // erase all
  })

  runSequence('build:tmp-pages', 'build:tmp-versions', ...arrayHtml, 'reload', 'build:del-tmp-files');
});

/////////////////////////////////////////////////////////////////////////////
// VENDORS BUILD

gulp.task('build:vendors', function () {
  gulp.src([path.src.vendors_by_bower, path.src.vendors_by_hands]) // get folders with vendors components
    .pipe(gulp.dest(path.build.vendors)); // copy to destination folder
});

/////////////////////////////////////////////////////////////////////////////
// JAVASCRIPT BUILD

gulp.task('build:js', function () {
  gulp.src(path.src.js, { base: path.src.components }) // get folder with js
    .pipe(gulp.dest(path.build.components)) // copy to destination folder
    .on('end', function () { browserSync.reload(); }) // reload BrowserSync
});

/////////////////////////////////////////////////////////////////////////////
// STYLES BUILD

gulp.task('build:css', function () {
  gulp.src(path.src.css, { base: path.src.components }) // get folder with css
    .pipe(ignore.exclude('**/mixins.scss')) // exclude mixins.scss file
    .pipe(sass({ outputStyle: 'expanded', indentWidth: 4 })) // css formatting
    .on('error', printError) // print error if found
    .pipe(autoprefix({
      cascade: true
    })) // add cross-browser prefixes
    .pipe(gulp.dest(path.build.components))  // copy sources
    .on('end', function () { browserSync.reload(); }) // reload BrowserSync
});

/////////////////////////////////////////////////////////////////////////////
// IMAGES BUILD

gulp.task('build:img', function () {
  gulp.src(path.src.img, { base: path.src.components }) // get folder with images
    .pipe(ignore.exclude('**/favicon.ico')) // exclude favicon.css file
    .on('error', printError) // print error if found
    .pipe(gulp.dest(path.build.components)); // copy to destination folder

  gulp.src(path.src.favicon, { base: path.src.components }) // get favicon
    .pipe(gulp.dest(path.build.components)); // copy to destination folder
});

/////////////////////////////////////////////////////////////////////////////
// GLOBAL BUILD

gulp.task('build', function () {
  runSequence(
    'build:versions', // run build:html task
    'build:css', // run build:css task
    'build:js', // run build:js task
    'build:img', // run build:img task
    'build:vendors' // run build:vendors task
  );
});

/////////////////////////////////////////////////////////////////////////////
// FILES CHANGE WATCHER

gulp.task('watch', function () {
  watch([path.src.versions, path.src.pages, path.src.templates], function () { // watch components, components, versions and templates folders
    gulp.start('build:versions'); // run build:versions task
  });
  watch([path.src.css], function () { // watch css folder
    gulp.start('build:css'); // run build:css task
  });
  watch([path.src.js], function () { // watch js folder
    gulp.start('build:js'); // run build:js task
  });
  watch([path.src.img], function () { // watch img folder
    gulp.start('build:img'); // run build:img task
  });
  watch([path.src.vendors_by_bower, path.src.vendors_by_hands], function () { // watch folder with vendors components
    gulp.start('build:vendors'); // run build:vendors task
  });
});

/////////////////////////////////////////////////////////////////////////////
// CLEAN PRODUCTION

gulp.task('clean', function () {
  return gulp.src(path.clean) // get build folder
    .pipe(rimraf()); // erase all
});

/////////////////////////////////////////////////////////////////////////////
// RELOAD BROWSER

gulp.task('reload', function () {
  browserSync.reload()
})

/////////////////////////////////////////////////////////////////////////////
// DEFAULT TASK
gulp.task('default', function () {
  runSequence('build', 'watch', 'serve')
});
