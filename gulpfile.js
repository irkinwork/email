var gulp = require('gulp'), // Подключаем Gulp
	jade = require('gulp-jade'), //Подключаем styl пакет,
	styl = require('gulp-stylus'), //Подключаем styl пакет,
	browserSync = require('browser-sync'), // Подключаем Browser Sync
	concat = require('gulp-concat'), // Подключаем gulp-concat (для конкатенации файлов)
	uglify = require('gulp-uglify-es').default, // Подключаем gulp-uglifyjs (для сжатия JS)
	cssnano = require('gulp-cssnano'), // Подключаем пакет для минификации CSS
	rename = require('gulp-rename'), // Подключаем библиотеку для переименования файлов
	del = require('del'), // Подключаем библиотеку для удаления файлов и папок
	imagemin = require('gulp-imagemin'), // Подключаем библиотеку для работы с изображениями
	pngquant = require('imagemin-pngquant'), // Подключаем библиотеку для работы с png
	cache = require('gulp-cache'), // Подключаем библиотеку кеширования
	concatJS = require('gulp-concat'),
	concatCSS = require('gulp-concat-css'),
	errorHandler = require('gulp-error-handle'),
	gutil = require('gulp-util'),
	autoprefixer = require('gulp-autoprefixer');// Подключаем библиотеку для автоматического добавления префиксов

const logError = function(err) {
	gutil.log(err);
	this.emit('end');
	};

gulp.task('styl', function(){ // Создаем таск styl
	return gulp.src('./app/styl/**/*.styl') // Берем источник
		.pipe(errorHandler(logError))
		.pipe(styl()) // Преобразуем styl в CSS посредством gulp-styl
		.pipe(autoprefixer(['last 15 versions', '> 1%', 'ie 8', 'ie 7'], { cascade: true })) // Создаем префиксы
		.pipe(gulp.dest('./app/css')); // Выгружаем результата в папку app/css
});
gulp.task('jade', function(){ // Создаем таск jade
	return gulp.src('./app/jade/**/*.jade') // Берем источник
		.pipe(errorHandler(logError))
		.pipe(jade()) // Преобразуем styl в CSS посредством gulp-styl
		.pipe(gulp.dest('./app')) // Выгружаем результата в папку app/css
		.pipe(browserSync.reload({stream: true})); // Обновляем CSS на странице при изменении
});

gulp.task('browser-sync', function() { // Создаем таск browser-sync
	browserSync({ // Выполняем browserSync
		server: { // Определяем параметры сервера
			baseDir: 'app' // Директория для сервера - app
		},
		notify: false // Отключаем уведомления
	});
});

gulp.task('concat-js', function() {
	return gulp.src(['./app/js/*.js', '!app/js/bundle.min.js', '!./app/js/**/libs.min.js'])
		.pipe(errorHandler(logError))
		.pipe(concatJS('bundle.min.js')) // Собираем их в кучу в новом файле bundle.min.js
		.pipe(uglify()) // Сжимаем JS файл
		.pipe(gulp.dest('./app/js')) // Выгружаем в папку app/js
});

gulp.task('concat-css', function() {
	return gulp.src(['./app/css/*.css','!app/css/bundle.min.css', '!./app/css/**/libs.min.css']) // Выбираем файл для минификации, исключаем bundle.min.css
		.pipe(errorHandler(logError))
		.pipe(concatCSS('bundle.min.css'))
		.pipe(cssnano()) // Сжимаем
		.pipe(gulp.dest('./app/css')) // Выгружаем в папку app/css
});

gulp.task('css-libs', function() {
	return gulp.src(['./app/css/libs/*.css', '!./app/css/**/libs.min.css']) // Выбираем папку для минификации
		.pipe(errorHandler(logError))
		.pipe(concatCSS('libs.min.css'))
		.pipe(cssnano()) // Сжимаем
		.pipe(gulp.dest('./app/css')) // Выгружаем в папку app/css
});

gulp.task('js-libs', function() {
	return gulp.src(['./app/js/libs/*.js', '!./app/js/**/libs.min.js']) // Выбираем папку для минификации
		.pipe(errorHandler(logError))
		.pipe(concatJS('libs.min.js'))
		.pipe(uglify()) // Сжимаем JS файл
		.pipe(gulp.dest('./app/js')) // Выгружаем в папку app/css
});

gulp.task('watch', ['browser-sync'], function() {
	gulp.watch('./app/styl/**/*.styl', ['styl']); // Наблюдение за styl файлами в папке styl
	gulp.watch('./app/css/*.css', ['concat-css', browserSync.reload]); // Наблюдение за styl файлами в папке styl
	gulp.watch('./app/css/libs/*.css', [ 'css-libs', browserSync.reload]); // Наблюдение за styl файлами в папке styl
	gulp.watch('./app/js/libs/*.js', [ 'js-libs', browserSync.reload]); // Наблюдение за styl файлами в папке styl
	gulp.watch('./app/jade/**/*.jade', ['jade']); // Наблюдение за jade файлами в папке jade
	gulp.watch('./app/img/**/*', [browserSync.reload]); // Наблюдение за IMG файлами в папке IMG
	gulp.watch('./app/js/*.js', ['concat-js',browserSync.reload]);   // Наблюдение за JS файлами в папке js
});

gulp.task('clean', function() {
	return del.sync('dist'); // Удаляем папку dist перед сборкой
});

gulp.task('img', function() {
	return gulp.src('./app/img/**/*') // Берем все изображения из app
		.pipe(cache(imagemin({  // Сжимаем их с наилучшими настройками с учетом кеширования
			interlaced: true,
			progressive: true,
			svgoPlugins: [{removeViewBox: false}],
			use: [pngquant()]
		})))
		.pipe(gulp.dest('./dist/img')); // Выгружаем на продакшен
});
gulp.task('app', ['jade', 'styl', 'img', 'concat-css', 'concat-js', 'js-libs', 'css-libs', 'clear']);

gulp.task('build', ['jade', 'styl', 'img', 'concat-css', 'concat-js', 'js-libs', 'css-libs', 'clean', 'clear'], function() {

	var buildFonts = gulp.src('./app/fonts/**/*') // Переносим шрифты в продакшен
	.pipe(gulp.dest('./dist/fonts'))

	var buildJs = gulp.src('./app/js/bundle.min.js') // Переносим скрипты в продакшен
	.pipe(gulp.dest('./dist/js'))

	var buildJsLibs = gulp.src('./app/js/libs.min.js') // Переносим скрипты в продакшен
	.pipe(gulp.dest('./dist/js'))

	var buildHtml = gulp.src('./app/*.html') // Переносим HTML в продакшен
    .pipe(gulp.dest('./dist'));
    
	var buildCss = gulp.src('./app/css/bundle.min.css') // Переносим CSS в продакшен
	.pipe(gulp.dest('./dist/css'));

	var buildCssLibs = gulp.src('./app/css/libs.min.css') // Переносим CSS-libs в продакшен
	.pipe(gulp.dest('./dist/css'));

});

gulp.task('clear', function (callback) { // кэш чистим
	return cache.clearAll();
})

gulp.task('default', ['watch', 'clear']);
