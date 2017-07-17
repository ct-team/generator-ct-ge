var gulp = require('gulp');
var uglify = require('gulp-uglify');
var htmlmin = require('gulp-htmlmin');
var replace = require('gulp-replace');
var cleanCSS = require('gulp-clean-css');
var gulpif = require('gulp-if');
var useref = require('gulp-useref');
var assetRev = require('gulp-asset-rev');
var gulpSequence = require('gulp-sequence');
var clean = require('gulp-clean');
var wrap = require("gulp-wrap");
var rename = require("gulp-rename");
var jshint = require('gulp-jshint');
var seajsCombo = require( 'gulp-seajs-combo' );
var sass = require('gulp-sass');
var spritesmith = require("gulp-spritesmith");
var plumber = require('gulp-plumber');//跳过错误管道
//var imagemin = require('gulp-imagemin');//压缩图片
//var pngquant = require('imagemin-pngquant');//深度压缩图片
//var cache = require('gulp-cache');//缓存

var arrayOfSquares = [];
var config = require('./gulpConfig.json');
var replaceUrl = /(\.\/)?assets\//g;

gulp.task('help', function() {
	console.log('sass:开启sass编译');
	console.log('htmltpl:模板脚本化');
	console.log('jshint:js检测');
	console.log('sprite:生成雪碧图');
});

//生成框架模版
gulp.task('htmltpl', function() {
	//未具体研究
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

//复制开发文件到构建文件夹
gulp.task('copy-build',function () {
    return gulp.src(config.src+'/**')		
        .pipe(gulp.dest(config.build));
});

//删除构建文件夹中需sea打包的文件
gulp.task('clean-seajs', function() {
	var seajsData = [];
	config.seajs.forEach(function(item){
		seajsData.push(config.build+item.Entry);
	});
	return gulp.src(seajsData, {read: false})
		.pipe(clean());

});

//删除测试文件
gulp.task('clean-test', function() {
	return gulp.src(config.test, {read: false})
		.pipe(clean());
});

//删除正式文件
gulp.task('clean-static', function() {
	return gulp.src(config.static, {read: false})
		.pipe(clean());
});
//删除构建的文件夹
gulp.task('clean-build', function() {
	return gulp.src(config.build, {read: false})
		.pipe(clean());
});

//删除构建的文件夹中的（原文件）
//gulp.task('clean-sprite', function() {
//	return gulp.src(config.build + config.sprite, {read: false})
//		.pipe(clean());
//});

//删除构建的文件夹中的（模版文件）
//gulp.task('clean-tplhtml', function() {
//	return gulp.src(config.build+config.staticTplhtml, {read: false})
//		.pipe(clean());
//});

//检测JS
gulp.task('jshint', function(){
    return gulp.src(config.src+config.staticJs+'**')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

//seajs合并
gulp.task('seajscombo2', function(){

		config.seajs.forEach(function(item){
			return gulp.src(config.src+item.Entry+item.Name)
				.pipe(seajsCombo())
				.pipe(uglify())
				.pipe(gulp.dest(config.build+item.Out));
		});

});

//拷贝JS到测试文件夹
gulp.task('copy-seajs2', function(){
	config.seajs.forEach(function(item){
		return gulp.src(config.build+item.Out+'**')
        .pipe(gulp.dest(config.test+item.Out)); 
	});
});

//文件合并
gulp.task('useref', function(){
  return gulp.src(config.build+'/*.html')
        .pipe(useref())
		.pipe(gulpif('*.js', uglify()))
		.pipe(gulpif('*.css', cleanCSS({compatibility: 'ie7'})))
        .pipe(gulp.dest(config.test));
});

//复制图片到测试文件夹
gulp.task('copy', function(){
  return gulp.src(config.build+config.staticImg+'**')
        .pipe(gulp.dest(config.test+config.staticImg));
});

//复制到正式文件夹
gulp.task('copy-static', function(){
  return gulp.src(config.test+'/**')
        .pipe(gulp.dest(config.static));
});

//测试文件正则替换
gulp.task('replace-test', function(){
  return gulp.src([config.test+'/**','!'+config.test+config.staticImg+'**'])
  		.pipe(replace(replaceUrl, config.testUrl))
        .pipe(gulp.dest(config.test));
});

//正式文件正则替换
gulp.task('replace-static', function(){
  return gulp.src([config.static+'/**','!'+config.static+config.staticImg+'**'])
  		.pipe(replace(replaceUrl, config.staticUrl))
        .pipe(gulp.dest(config.static));
});

//html打版本号
gulp.task('revall', function(){
 return gulp.src(config.test+'/*.html')
        .pipe(assetRev())
        .pipe(gulp.dest(config.test));
});

//css打版本号
gulp.task('revallcss',function () {
    return gulp.src(config.test+config.staticCss+'**')
        .pipe(assetRev())
        .pipe(gulp.dest(config.test+config.staticCss))
});

//生成雪碧图和CSS
//gulp.task('spritestart', function() {
//	return gulp.src(config.src+config.spriteCss+'*.css')
//		.pipe(spriter({
//			'spriteSheet': config.src+config.spriteImg + config.spriteImgName, //这是雪碧图自动合成的图。 很重要
//			'pathToSpriteSheetFromCSS':  '../img' + config.spriteImgName, //这是在css引用的图片路径，很重要
//			'spriteImgBuildCallback':function(data){	//自定义事件
//				if(data){
//					arrayOfSquares = data.map(function (item) {
//					  return item.replace(config.sprite + '\\','');
//					});
//				}
//			}
//        }))
//		.pipe(gulp.dest(config.src+config.staticCss)); //最后生成出来
//});

//复制图片
gulp.task('spriter-copyimg', function() {
	return gulp.src(config.src+config.spriteImg + '**').pipe(gulp.dest(config.src+config.staticImg));
});

//删除合成的图片
gulp.task('spriter-delimg', function() {
	config.spritesList.forEach(function(item){
		return gulp.src(config.src+config.staticImg+item.url, {read: false}).pipe(clean());
	});
});

//clean-img
gulp.task('clean-img', function(){
	return gulp.src(config.src+config.staticImg, {read: false})
		.pipe(clean());
});

//删除 bat文件
gulp.task('clean-rename', function(){
	return gulp.src(config.src+config.staticImg+'**/*.bat', {read: false})
		.pipe(clean());
});

//sass压缩
gulp.task('get-css', function(){
	gulp.src(config.src+config.spriteScss+'*.scss')
		.pipe(plumber())
		//.pipe(sass({outputStyle: 'compressed'}))
		.pipe(sass({outputStyle: 'compact'}).on('error', sass.logError))
		.pipe(plumber.stop())
		//.pipe(gulp.dest(config.src+config.spriteCss))
		.pipe(gulp.dest(config.src+config.staticCss))
});

//watchSass
gulp.task('watchSass', function(){
	gulp.watch(config.src+config.spriteScss+'*.scss', ['get-css']);
});

//生成雪碧图
gulp.task('sprites', function () {
	config.spritesList.forEach(function(item){
		return  gulp.src(config.src+config.spriteImg+item.url)
			.pipe(spritesmith({
				imgName: item.imgName,//生成雪碧图的名字
				styleName: item.cssName,//生成css的名字
				//retinaImgName: ' sprite@2x.png ',
				padding:5,//生成雪碧图片的间隔
				algorithm:item.algorithm,//生成的方式
				imgPath: '../img/'+item.out+item.imgName,//css中引用雪碧图的位置
				styleTemplate:config.src+config.styleTemplate //css模版
			}))
			//.pipe(imagemin({
			//	progressive: true,
			//	svgoPlugins: [{removeViewBox: false}],//不要移除svg的viewbox属性
			//	use: [pngquant()] //使用pngquant深度压缩png图片的imagemin插件
			//}))
			.pipe(gulpif('*.png', gulp.dest(config.src+config.staticImg+item.out)))
			.pipe(gulpif('*.scss', gulp.dest(config.src+config.spriteScss)));
	});
});

//压缩图片
gulp.task('testImagemin', function () {
	//gulp.src(config.src+config.staticImg+'**/*.{png,jpg,gif,ico}')
	//	//.pipe(imagemin({
	//	//	optimizationLevel: 5, //类型：Number  默认：3  取值范围：0-7（优化等级）
	//	//	progressive: true, //类型：Boolean 默认：false 无损压缩jpg图片
	//	//	interlaced: true, //类型：Boolean 默认：false 隔行扫描gif进行渲染
	//	//	multipass: true //类型：Boolean 默认：false 多次优化svg直到完全优化
	//	//}))
	//	.pipe(cache(imagemin({
	//		progressive: true,
	//		svgoPlugins: [{removeViewBox: false}],
	//		use: [pngquant()]
	//	})))
	//	.pipe(gulp.dest(config.build+config.staticImg));
});


//开发源代码生成
gulp.task('sass', gulpSequence('watchSass'));

gulp.task('sprite', gulpSequence('clean-img','spriter-copyimg','spriter-delimg','clean-rename','sprites'));

gulp.task('default',gulpSequence(['clean-test','clean-build','clean-static'],'copy-build','testImagemin','clean-seajs','htmltpl','seajscombo2','useref',['copy','copy-seajs2'],'revall','revallcss','copy-static','replace-test','replace-static','clean-build','jshint'));