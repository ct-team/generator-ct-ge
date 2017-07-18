var version = "2.0.0";
var http = require('http');        
var fs = require('fs');            
var server = new http.Server();    
var httpOpt;
var dataConfig;
fs.readFile('./serverPackage.json', function (err, data) {
    if (err) {
        throw err;
    }
    dataConfig = JSON.parse(data);
    httpOpt = dataConfig.config;
    var port = httpOpt.serverPort || 8000;
    server.listen(port);            
    start();
    console.log('start port:' + port);
});

function httpGet(url, request, callback) {
    var opt = {
        host: httpOpt.host,
        port: httpOpt.port,
        path: url,
        method: 'GET',
        headers: {
            cookie: request.headers.cookie
        }
    };
    var data = [];
    var req = http.request(opt, function (response) {
        response.on('data', function (chunk) {
            data.push(chunk);
        });
        response.on('end', function () {
            data = (Buffer.concat(data)).toString();
            callback(data);
        });
    });
    req.on('error', function (e) {
        console.log('problem with request: ' + e.message);
    });
    req.end();
}
function httpPost(url, request, callback) {
    var postdata = "";
    request.addListener("data", function (postchunk) {
        postdata += postchunk;
    });
    request.addListener("end", function () {
        return postDeal(url, callback, postdata);
    });

}
function jsonOut(response, data) {
    response.writeHead(200, {'Content-type': 'application/json; charset=UTF-8'});
    response.write(data);
    response.end();
}
function getType(endTag) {
    var type = null;
    switch (endTag) {
        case 'html' :
        case 'htm' :
            type = 'text/html; charset=UTF-8';
            break;
        case 'js' :
            type = 'application/javascript; charset="UTF-8"';
            break;
        case 'css' :
            type = 'text/css; charset="UTF-8"';
            break;
        case 'txt' :
            type = 'text/plain; charset="UTF-8"';
            break;
        case 'manifest' :
            type = 'text/cache-manifest; charset="UTF-8"';
            break;
        default :
            type = 'application/octet-stream';
            break;
    }
    return type;
}
function postDeal(url, callback, postdata) {
    var postData = postdata;
    console.log(postData);
    var opt = {
            host: httpOpt.host,
            port: httpOpt.port,
            path: url,
            method: 'POST',
            headers: {
                "Content-Type": 'application/x-www-form-urlencoded',
                "Content-Length": postData.length
            }
        },
        data = [],
        req = http.request(opt, function (response) {
            response.on('data', function (chunk) {
                data.push(chunk);
            });
            response.on('end', function () {
                data = (Buffer.concat(data)).toString();
                callback(data);
            });
        });
    req.on('error', function (e) {
        console.log('problem with request: ' + e.message);
    });
    req.write(postData);
    req.end();
}
function getUrlObject(url, arg) {

    var i,
        object = dataConfig.dataList,
        r = false;
    for (i = 0; i < object.length; i++) {
        if (object[i].url == url && argCheck(arg,object[i].arg)) {
            r = object[i];
            break;
        }
    }
    return r;
}
function argCheck(urlArg, configArg) {
    if (configArg === '' ) {
        return true;
    }
    var argObj = parseQueryString(urlArg);
    if(typeof argObj !== typeof configArg){
        console.log('argCheck 参数类型不一致');
        return false;
    }
    for(var i in configArg){
        if(configArg[i] !== argObj[i]){
            return false;
        }
    }
    return true;
}
function parseQueryString(url) {
    var obj = {};
    var keyvalue = [];
    var key = "", value = "";
    var paraString = url.split("&");
    for (var i in paraString) {
        keyvalue = paraString[i].split("=");
        key = keyvalue[0];
        value = keyvalue[1];
        obj[key] = value;
    }
    return obj;
}
function postQuery(url, request, callback) {
    var postdata = "";
    request.addListener("data", function (postchunk) {
        postdata += postchunk;
    });
    request.addListener("end", function () {
        return callback(postdata);
    });

}
function start() {
    // 使用on方法注册时间处理
    server.on('request', function (request, response) {
        var url = require('url').parse(request.url);
        var method = '';
        if (url.pathname == "" || url.pathname == "/") {
            fs.readFile('./index.html', function (err, content) {
                if (err) {
                    response.writeHead(404, {'Content-Type': 'text/plain; charset="UTF-8"'});
                    response.write(err.message);
                    response.end();
                } else {
                    response.writeHead(200, {'Content-Type': 'text/html; charset=UTF-8'});
                    response.write(content);
                    response.end();
                }
            });
            return;
        }


        if (request.headers['x-requested-with'] && request.headers['x-requested-with'].toLowerCase() == 'xmlhttprequest') {
            method = request.method.toLowerCase();
            if (method == 'post') {
                postQuery(url.path, request, function (d) {
                    debugHandle(method, url, response, request, d);
                });
            } else {
                debugHandle(method, url, response, request, url.query);
            }
            return;
        }
        var filename = url.pathname.substring(1);
        var type = getType(filename.substring(filename.lastIndexOf('.') + 1));
        fs.readFile(filename, function (err, content) {
            if (err) {
                response.writeHead(404, {'Content-Type': 'text/plain; charset="UTF-8"'});
                response.write(err.message);
                response.end();
            } else {
                response.writeHead(200, {'Content-Type': type});
                response.write(content);
                response.end();
            }
        });


    });

}

function debugHandle(method, url, response, request, arg) {
    var jsonData;
    var urlObject;

    if (httpOpt.debug) {
        urlObject = getUrlObject(url.pathname, arg);
        if (urlObject) {
            jsonData = JSON.stringify(urlObject.data);
        } else {
            jsonData = '{"msg":"nodata"}';
        }
        jsonOut(response, jsonData);
        return;
    }

    if (method == "post") {
        httpPost(url.path, request, function (data) {
            jsonOut(response, data);
        });
    } else {
        httpGet(url.path, request, function (data) {
            jsonOut(response, data);
        });
    }
}
