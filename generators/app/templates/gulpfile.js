var gulp = require('gulp');
var uglify = require('gulp-uglify');
var htmlmin = require('gulp-htmlmin');
var replace = require('gulp-replace');
var cleanCSS = require('gulp-clean-css');
var gulpif = require('gulp-if');
var useref = require('gulp-useref');
var assetRev = require('ge-asset-rev');
var gulpSequence = require('gulp-sequence');
var clean = require('gulp-clean');
var wrap = require("gulp-wrap");
var rename = require("gulp-rename");
var jshint = require('gulp-jshint');
var seajsCombo = require( 'gulp-seajs-combo' );
var concat = require('gulp-concat');
var arrayOfSquares = [];
var config = require('./gulpConfig.json');
var replaceUrl = /(\.\/)?assets\//g;

gulp.task('help', function() {
	console.log('htmltpl:模板脚本化');
	console.log('jshint:js检测');
	console.log('sprite:生成雪碧图');
});

gulp.task('htmltpl', function() {
	var options = {
		collapseWhitespace:true,
		collapseBooleanAttributes:true,
		removeComments:true,
		removeEmptyAttributes:true,
		removeScriptTypeAttributes:true,
		removeStyleLinkTypeAttributes:true,
		minifyJS:true,
		minifyCSS:true
	};
	return gulp.src(config.src+config.staticTplhtml+'*.html')
		.pipe(htmlmin(options))
		.pipe( wrap( "define(function(){return '<%= contents %>'});" ))
		.pipe(rename(function (path) { path.extname = ".js" }))
		.pipe(gulp.dest(config.src+config.staticTpl))
});
gulp.task('build',function () {
    return gulp.src(config.src+'/**')		
        .pipe(gulp.dest(config.build));
});
gulp.task('clean-seajs', function() {
	var seajsData = [];
	config.seajs.forEach(function(item){
		seajsData.push(config.build+item.Entry);
	});
	return gulp.src(seajsData, {read: false})
		.pipe(clean());

});
gulp.task('clean-test', function() {
	return gulp.src(config.test, {read: false})
		.pipe(clean());
});
gulp.task('clean-static', function() {
	return gulp.src(config.static, {read: false})
		.pipe(clean());
});
gulp.task('clean-build', function() {
	return gulp.src(config.build, {read: false})
		.pipe(clean());
});
gulp.task('clean-sprite', function() {
	return gulp.src(config.build + config.sprite, {read: false})
		.pipe(clean());
});
gulp.task('clean-tplhtml', function() {
	return gulp.src(config.build+config.staticTplhtml, {read: false})
		.pipe(clean());
});
gulp.task('jshint', function(){
    return gulp.src(config.src+config.staticJs+'**')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});
gulp.task('seajscombo2', function(){
	/*for(var i=0;i < config.seajs.length;i++){
		gulp.src(config.src+config.seajs[i].Entry+config.seajs[i].Name)
        .pipe(seajsCombo())
		.pipe(uglify())
        .pipe(gulp.dest(config.build+config.seajs[i].Out));
	}  */
	config.seajs.forEach(function(item){
		return gulp.src(config.src+item.Entry+item.Name)
        .pipe(seajsCombo())
		.pipe(uglify())
        .pipe(gulp.dest(config.build+item.Out)); 
	});
	
	  
});
gulp.task('copy-seajs2', function(){
	config.seajs.forEach(function(item){
		return gulp.src(config.build+item.Out+'**')
        .pipe(gulp.dest(config.test+item.Out)); 
	});
  /*for(var i=0;i < config.seajs.length;i++){
	 gulp.src(config.build+config.seajs[i].Out+'**')
        .pipe(gulp.dest(config.test+config.seajs[i].Out)); 
  }	*/
});

gulp.task('useref', function(){
  return gulp.src(config.build+'/*.html')
        .pipe(useref())
		.pipe(gulpif('*.js', uglify()))
		.pipe(gulpif('*.css', cleanCSS({compatibility: 'ie7'})))
        .pipe(gulp.dest(config.test));
});

gulp.task('copy', function(){
  return gulp.src(config.build+config.staticImg+'**')
        .pipe(gulp.dest(config.test+config.staticImg));
});
gulp.task('copy-static', function(){
  return gulp.src(config.test+'/**')
        .pipe(gulp.dest(config.static));
});
gulp.task('replace-test', function(){
  return gulp.src([config.test+'/**','!'+config.test+config.staticImg+'**'])
  		.pipe(replace(replaceUrl, config.testUrl))
        .pipe(gulp.dest(config.test));
});
gulp.task('replace-static', function(){
  return gulp.src([config.static+'/**','!'+config.static+config.staticImg+'**'])
  		.pipe(replace(replaceUrl, config.staticUrl))
        .pipe(gulp.dest(config.static));
});
gulp.task('revall', function(){
 return gulp.src(config.test+'/*.html')
        .pipe(assetRev())
        .pipe(gulp.dest(config.test));
});
gulp.task('revallcss',function () {
    return gulp.src(config.test+config.staticCss+'**')
        .pipe(assetRev())
        .pipe(gulp.dest(config.test+config.staticCss))
});


//开发源代码生成
gulp.task('default',gulpSequence(['clean-test','clean-build','clean-static'],'build','clean-seajs','clean-sprite','clean-tplhtml','htmltpl','seajscombo2','useref',['copy','copy-seajs2'],'revall','revallcss','copy-static','replace-test','replace-static','clean-build','jshint'));