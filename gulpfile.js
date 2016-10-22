var gulp          = require('gulp'),
    less          = require('gulp-less'),
    concat        = require('gulp-concat'),
    minCss        = require('gulp-minify-css'),
    rename        = require('gulp-rename'),
    size          = require('gulp-size'),
    autoprefixer  = require('gulp-autoprefixer'),
    ngAnnotate    = require('gulp-ng-annotate'),
    del           = require('del'),
    plumber       = require('gulp-plumber'),
    merge         = require('merge-stream'),
    templateCache = require('gulp-angular-templatecache'),
    uglify        = require('gulp-uglify'),
    notify        = require("gulp-notify"),
		fs = require("fs");

var src  = {
	    'js'  : ['src/*.js', 'src/directives/**/*.js'],
	    'less': 'less/styles.less',
	    'tmpl': 'src/templates/**/*.tpl.html',
	    'i18n': 'src/i18n'
    },
    dest = {
	    'js'  : 'dist/js',
	    'css': 'dist/css',
	    'i18n': 'dist/js'
    };

/**
 * Clear build files
 */
gulp.task('clean', function (cb) {
	del([dest.css, dest.js], cb);
});

/**
 * Compile less files
 */
gulp.task('less', function () {
	return gulp
		.src(src.less)
		.pipe(plumber())
		.pipe(less({
			paths: ['.']
		}))
		.pipe(autoprefixer())
		.pipe(size({
			showFiles: true
		}))
		.pipe(rename("angular-grid-view.css"))
		.pipe(gulp.dest(dest.css))
		.pipe(minCss())
		.pipe(rename({
			suffix: ".min"
		}))
		.pipe(size({
			showFiles: true
		}))
		.pipe(gulp.dest(dest.css))
		.pipe(notify("Less compiled."));
});

/**
 * Build from sourse
 */
gulp.task('js', function () {

	return merge(
		// scripts
		gulp
			.src(src.js)
			.pipe(plumber()),

		// templates
		gulp
			.src(src.tmpl)
			.pipe(plumber())
			.pipe(templateCache({
				standalone: true,
				module    : 'grid-view-templates',
				root      : 'templates/grid-view'
			}))
	)
		.pipe(concat('angular-grid-view.js'))
		.pipe(ngAnnotate())
		.pipe(gulp.dest(dest.js))
		.pipe(uglify())
		.pipe(rename({
			suffix: ".min"
		}))
		.pipe(size({
			showFiles: true
		}))
		.pipe(gulp.dest(dest.js))
		.pipe(notify('Scripts compiled.'));
});


gulp.task('i18n', function () {
	function i18n(lang) {
		return merge(
			gulp
				.src(src.i18n + "/" + lang + "/*.js"),
			gulp
				.src(src.i18n + "/" + lang + "/templates/**/*.tpl.html")
				.pipe(templateCache({
					module    : 'angular-grid-view',
					root      : 'templates/grid-view/ru'
				}))
		)
		.pipe(concat('angular-grid-view-' + lang + '.js'))
		.pipe(gulp.dest(dest.js))
		.pipe(uglify())
		.pipe(rename({
			suffix: ".min"
		}))
		.pipe(ngAnnotate())
		.pipe(size({
			showFiles: true
		}))
		.pipe(gulp.dest(dest.i18n))
		.pipe(notify('I18n for "' + lang + '" compiled.'));
	}

	var langs = fs.readdirSync(src.i18n);
	var streams = langs.map(function(lang){
		return i18n(lang);
	});

	return merge.apply(null, streams);
});

/**
 * build command
 */
gulp.task('build', ['clean'], function () {
	gulp.start('less', 'js', 'i18n');
});

/**
 * Create gulp watcher
 */
gulp.task('watch', ['build'], function () {

	// Watch .less files
	gulp.watch(src.less, ['less']);

	// Watch .js files
	gulp.watch([src.js, src.tmpl], ['js']);

	// Watch i18n files
	gulp.watch([src.i18n + "/**/*.js", src.i18n + "/**/*.tpl.html"], ['i18n']);

});
