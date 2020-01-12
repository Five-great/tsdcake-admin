'use strict';

var express = require('express');
var timeout = require('connect-timeout');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var AV = require('leanengine');
var qiniu = require("qiniu"); 
var config = require('./config'); 
// var multer  = require('multer') ;
// var upload = multer({ dest: 'uploads/'});
// var fs = require('fs');
var request= require('request');

// 加载云函数定义，你可以将云函数拆分到多个文件方便管理，但需要在主文件中加载它们
require('./cloud');

var app = express();

// 设置模板引擎
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.static('public'));

// 设置默认超时时间
app.use(timeout('15s'));

// 加载云引擎中间件
app.use(AV.express());

app.enable('trust proxy');
// 需要重定向到 HTTPS 可去除下一行的注释。
app.use(AV.Cloud.HttpsRedirect());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(AV.Cloud.CookieSession({ secret: 'my secret', maxAge: 3600000, fetchUser: true }));
app.get('/', function(req, res) {
    if (req.currentUser) {
        //console.log(req);
        // res.redirect('./public/dist');
        res.redirect('/goodsLsit');
    } else {
       res.render('index');
        //res.redirect('/comments');
        //res.redirect('/comments');
    }
});

// 可以将一类的路由单独保存在一个文件中
app.use('/comments', require('./routes/comments'));
app.use('/goodsList', require('./routes/goodsList'));
// app.use('/vue', require('./routes/comments'));

// 处理登录请求（可能来自登录界面中的表单）
app.post('/login', function(req, res) {
    if (req.body.username == process.env.SMTP_USER 
        || req.body.username == process.env.TO_EMAIL) {

      AV.User.logIn(req.body.username, req.body.password).then(function(user) {
        res.saveCurrentUser(user); // 保存当前用户到 Cookie
        res.redirect('./goodsList'); // 跳转到个人资料页面
      }, function(error) {
          //登录失败，跳转到登录页面
          res.redirect('/');
      });

    } else {
      res.redirect('/');
    }
    
});

// 登出账号
app.get('/logout', function(req, res) {
    req.currentUser.logOut();
    res.clearCurrentUser(); // 从 Cookie 中删除用户
    res.redirect('/');
});




  
//set app variable   
app.all('*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
  res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
  res.header("X-Powered-By",' 3.2.1')
  if(req.method=="OPTIONS") res.send(200);/*让options请求快速返回*/
  else  next();
});  


// app.use(express.static(__dirname + "/public"));  

var accessKey = config.accessKey;
var secretKey = config.secretKey;
var mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
app.post('/upload', function(req, res) {
  console.log('接收的数据');
  console.log(req.body.value);
  var scopeVal = req.body.value;        // 接收传过来的上传空间 如test-demo, test-demo1等
  // var scopeVal = 'test-demo'; 
  var options = {
    scope: scopeVal,
  };
  var putPolicy = new qiniu.rs.PutPolicy(options);
  var uploadToken=putPolicy.uploadToken(mac);
  var dataList = {
    token : uploadToken,
    bucketLists : config.bucket_lists
  }
  res.send(dataList);      // 依据传过来的上传空间生成token并返回
});


app.get('/token', function(req, res,next) {
  //var scopeVal = req.body.value;        // 接收传过来的上传空间 如test-demo, test-demo1等
  // var scopeVal = 'test-demo'; 
  var options = {
    scope: 'tsdcake',
  };
  var putPolicy = new qiniu.rs.PutPolicy(options);
  res.send(putPolicy.uploadToken(mac));
});


app.use('/setUp', function(req, res) {
  var url = 'https://www.baidu.com/' + req.url;
  req.pipe(request(url)).pipe(res);
});


//github     img-token: 771c87bdb4f4d5c342839e3b89e8b2d7ad67628f
// app.post('/wxpostdata', function(req, res) {
//   console.log('接收的数据ww');
//   console.log(req.body);
//   request.post({url: req.body.url, formData: req.body.data? JSON.stringify(req.body.data):''}, function (error, response, body) {  
//     if (!error && response.statusCode == 200) {
//       res.send((typeof body==='object')?body : JSON.parse(body));
//     }
//     res.send((typeof error==='object')?error: JSON.parse(error));
//   })
// });

// app.use(upload.single('file')); //
// app.post('/wxfiledata', function(req, res) {
//   console.log('接收的数据data');
//   console.log(req.body);//获取到的age和name
//   console.log(req.file);//获取到的文件
//   var formData = {
//     media: fs.createReadStream(req.file.path)
//   }
//     request.post({url: 'https://api.weixin.qq.com/cgi-bin/material/add_material?access_token='+req.query.access_token+'&type=image',formData: formData},  (error, response, body)=> {  
//     if (!error && response.statusCode == 200) {
//       //res.send((typeof body==='object')?body : JSON.parse(body));
//       var cc=[req.file,body,formData,response,red.body];
//       if(body.errcode==0){res.send((typeof body==='object')?body: JSON.parse(body));}
//       res.send((typeof cc==='object')?cc: JSON.parse(cc));
//     }
//     //res.send((typeof req.body==='object')?req.body: JSON.parse(req.body));
//     return 0;
//    });
// });

// app.post('/wxgetdata', function(req, res) {
//   console.log('接收的数据ww');
//   console.log(req.body);
//   request.get({url: req.body.url}, function (error, response, body) {  
//     if (!error && response.statusCode == 200) {
//       res.send((typeof body==='object')?body : JSON.parse(body));
//     }
//     res.send((typeof error==='object')?error: JSON.parse(error));
//   })
// });



app.use(function(req, res, next) {
    // 如果任何一个路由都没有返回响应，则抛出一个 404 异常给后续的异常处理器
    if (!res.headersSent) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    }
});

// error handlers
app.use(function(err, req, res, next) {
  if (req.timedout && req.headers.upgrade === 'websocket') {
    // 忽略 websocket 的超时
    return;
  }

  var statusCode = err.status || 500;
  if (statusCode === 500) {
    console.error(err.stack || err);
  }
  if (req.timedout) {
    console.error('请求超时: url=%s, timeout=%d, 请确认方法执行耗时很长，或没有正确的 response 回调。', req.originalUrl, err.timeout);
  }
  res.status(statusCode);
  // 默认不输出异常详情
  var error = {};
  if (app.get('env') === 'development') {
    // 如果是开发环境，则将异常堆栈输出到页面，方便开发调试
    error = err;
  }
  res.render('error', {
    message: err.message,
    error: error
  });
});

app.locals.dateFormat = function (date) {
    var vDay = padWithZeros(date.getDate(), 2);
    var vMonth = padWithZeros(date.getMonth() + 1, 2);
    var vYear = padWithZeros(date.getFullYear(), 2);
    var vHour = padWithZeros(date.getHours(), 2);
    var vMinute = padWithZeros(date.getMinutes(), 2);
    var vSecond = padWithZeros(date.getSeconds(), 2);
    // return `${vYear}-${vMonth}-${vDay}`;
    return `${vYear}-${vMonth}-${vDay} ${vHour}:${vMinute}:${vSecond}`;
};

const padWithZeros = (vNumber, width) => {
    var numAsString = vNumber.toString();
    while (numAsString.length < width) {
        numAsString = '0' + numAsString;
    }
    return numAsString;
};

module.exports = app;
