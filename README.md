# 个人博客项目实现步骤
## 首先，分成index和admin两个文件
>以下是index文件的头部分
```js
var express= require('express') // http框架
var app = express()
var bodyParser = require('body-parser') // 解析http请求体
var urlencodedParser = bodyParser.urlencoded({extended:false})
const cookieParser = require('cookie-parser')  
const MongoControl = require('./tools/databasecontrol').MongoControl
const page = new MongoControl('blog', 'page')
// 初始化存储的集合
const comment = new MongoControl('blog', 'comment') 
const ejs = require('ejs')
const moment = require('moment')
 const marked=require('marked')
app.use(cookieParser())

app.use(express.static('./static', {
    index: false
}))

// 后台功能接口的静态文件请求
app.use('/admin',express.static('./static',{index:false}))
//后台功能路由
app.use('/admin',require('./admin'))
```
>首页接口，读取首页内容，将数据库中的文章渲染到首页
```js
app.get('/', function (req, res) {
    //在page数据库里查找全部文章
    page.find({}, function (err, data) {
        //ejs渲染json文章数据到页面中
        ejs.renderFile('./static/ejs/index.ejs', { data: data }, function (error, html) {
            res.send(html)
        })
    })
})
```
>首页前端界面用ejs方式，引入jQuery,bootstrap
```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
    <link rel="stylesheet" href="./bootstrap-3.3.7-dist/css/bootstrap.css">
    <script src="./bootstrap-3.3.7-dist/js/bootstrap.js"></script>
    <script src="./tools/jquery-3.3.1.min.js"></script>
</head>
```
>其中，a标签的登录跳转到/admin页面
```js
<body>
    <div class="container">
        <div class="page-header">
            <h1>CDown
                <small>我的个人博客</small>
            </h1>
            <ul class="list-group">
                    <% data.forEach(function(e){ %>
                <li class="list-group-item">
                    <a href="/p?_id=<%= e._id %>">
                        <h3> <%= e.title %></h3>
                    </a>
                    <p>日期 :  <%= e.date%></p>
                    <p> <%= e.intro%></p>
                </li>
                <% }) %>
              </ul>
        </div>
    </div>
</body>
```
>文章的具体深入

>首页中会有具体文章的a标签，a标签的接口是/p+这个文章的id
```js
   <a href="/p?_id=<%= e._id %>">
```
>后端接口
```js
app.get('/p', function (req, res) {
    // 获取前端传入的_id
    var _id = req.query._id
    // 根据_id查询文章
    page.findById(_id, function (err, result) {
        // 如果没有这篇文章，则报404
        if (result.length == 0) {
            res.status(404).send('你来到我的博客')
            return
        }



        //根据文章的id查询相关评论

        var data = result[0] //id查询肯定只返回一条

        data.content=marked(data.content)  //使用marked处理md为html
       
        comment.find({ fid: _id ,state:1 }, function (err, result) {
            //渲染评论
            ejs.renderFile('./static/ejs/page.ejs', { data: data,comment : result }, function (err, html) {
                html=html.replace('  <!-- content -->',data.content)
                res.send(html)
            })
        })
    })
})
```
>具体文章部分分为两个部分，文章和评论部分

>文章部分  最上面写了个a标签方便跳转到首页
```js
  <div class="container">
            <h3> <a href="/">首页</a>    </h3> 
            <div class="page-header">
                <h1> <%= data.title %>
                    <small><%= data.intro %></small>
                </h1>
            </div>
            <div>
                分类：
                <span class="label label-primary"><%= data.sort %></span>
            </div>
            <p>
                作者：<%= data.author %>
            </p>
            <p>
                日期：<%= data.date %>
            </p>
            <div class="well">
                   <!-- content -->
            </div>
```
>评论部分
```js
  <div class="page-header">
                <h3>评论
                </h3>
            </div>
            <% comment.forEach(function(e){ %>
                <div class="panel panel-default">
                    <div class="panel-body">
                     <strong><%= e.content %></strong>
                    </div>
                    <div class="panel-footer">
                        <%= e.author %> - <%= e.date %>
                    </div>
                </div>
        <% }) %>
    <div class="page-header">
        <h3>我也想发表评论
        </h3>
    </div>
    <form method="POST" action="/submitComment?_id=<%=data._id%>">
        <div class="form-group">
            <label for="exampleInputEmail1">你的邮箱</label>
            <input type="email" class="form-control" id="exampleInputEmail1" name="email" placeholder="邮箱">
        </div>
        <div class="form-group">
            <textarea class="form-control" rows="3" name="content" ></textarea>
        </div>
        <button type="submit" class="btn btn-default">提交</button>
    </form>
        </div>
```

>发布评论的接口
```js
app.post('/submitComment',urlencodedParser,function(req,res){

    //获取携带在url中的文章id
    var _id = req.query._id
    //获取评论内容 email 和content
    var {email , content} = req.body

    //简单的表单验证 ： 不允许为空
    if(!_id){
        res.send('不允许评论')
        return 
    }
    if(!email || !content){
        res.send('不允许评论')
        return 
    }
    //操作评论数据库
    comment.insert({
        fid : _id,
        author : email,
        content : content,
        date : moment().format('YYYY-MM-DD HH-mm-ss'),
        state : 0
    },(err,result)=>{
        if(err){
            //如果数据库操作失败，则反500
            res.status(500).send('你发了什么评论把我的服务器干崩了？')
            return
        }
        //成功则重定向到这个文章
        res.redirect(
            '/p?_id=' + _id
        )
    })
})
```

## 第二部分 admin部分
>admin部分头部
```js
var express = require('express')
var router = express.Router() //功能和app一样
var urlencodedParser = require('body-parser').urlencoded({extended:false})
var moment = require('moment')
const MongoControl = require('./tools/databasecontrol').MongoControl
const page=new MongoControl('blog','page')
const comment=new MongoControl('blog','comment')
//引入cookie管理模块
const CookieControl=require('./static/js/cookie.js')
var admin = new CookieControl()
var path=require('path')
// const token='1254835123Tlx,zldlflf'
```
*/接口，通过路由的分发，使admin中的/接口就等于index中的/admin。路由分发写在index.js中*
>后台的/接口中实现文章的写入以及审核评论
```js
// 后台功能接口的静态文件请求
app.use('/admin',express.static('./static',{index:false}))
//后台功能路由
app.use('/admin',require('./admin'))
```

>首先左面有三个导航块
```js
 <div class="container">
        <div class="page-header">
            <h1>
                博客系统后台管理程序
                <small>v 0.1.2</small>
            </h1>
        </div>
        <div class="row">
            <div class="col-lg-3">
                <ul class="nav nav-pills nav-stacked">
                    <li role="presentation" class="list-item active" data-wrap="home">
                        <a href="#">Home</a>
                    </li>
                    <li role="presentation" class="list-item " data-wrap="fabiao">
                        <a href="#">发布文章</a>
                    </li>
                    <li role="presentation" class="list-item" id="shenhe-btn" data-wrap="shenhe">
                        <a href="#">审核评论</a>
                    </li>
                </ul>
            </div>
```
>点击右侧出现相应的块是通过给导块的类名加active
```html
<div class="col-lg-9 wrap-wrap">
                <!-- 主页 -->
                <div class="right-wrap active" id="home">主页</div>
                <!-- 发送文章部分 -->
                <div class="right-wrap" id="fabiao">
                    <form method="POST" action="/admin/uploadPage">
                        <div class="form-group">
                            <label for="title">大标题</label>
                            <input type="text" class="form-control" id="title" name="title" placeholder="大标题">
                        </div>
                        <div class="form-group">
                            <label for="author">作者</label>
                            <input type="text" class="form-control" id="author" name="author" placeholder="作者">
                        </div>
                        <div class="form-group">
                            <label for="sort">分类</label>
                            <input type="text" class="form-control" id="sort" name="sort" placeholder="分类">
                        </div>
                        <div class="form-group">
                            <label for="intro">简介</label>
                            <input type="text" class="form-control" id="intro" name="intro" placeholder="简介">
                        </div>
                        内容
                        <textarea class="form-control" rows="3" name="content"></textarea>
                        <br>
                        <button type="submit" class="btn btn-default">提交</button>
                    </form>
                </div>
```

```js
   var listItems = $('.list-item')
var rightWraps = $('.right-wrap')

listItems.on('click',function(){
    listItems.removeClass('active')
    $(this).addClass('active')
    var tag = $(this).attr('data-wrap') // 
    rightWraps.removeClass('active')
    $('#' + tag).addClass('active')
}) 
```

>加active类名的display会为block，否则为none。
```html
 <style>
        .wrap-wrap {
            position: relative;
        }

        .right-wrap {
            width: 100%;
            min-height: 500px;
            position: absolute;
            display: none;
        }

        .right-wrap.active {
            display: block;
        }
    </style>
```
>发表文章内容部分

>文章写入后就插入到数据库中
```html
   <div class="col-lg-9 wrap-wrap">
                <!-- 主页 -->
                <div class="right-wrap active" id="home">主页</div>
                <!-- 发送文章部分 -->
                <div class="right-wrap" id="fabiao">
                    <form method="POST" action="/admin/uploadPage">
                        <div class="form-group">
                            <label for="title">大标题</label>
                            <input type="text" class="form-control" id="title" name="title" placeholder="大标题">
                        </div>
                        <div class="form-group">
                            <label for="author">作者</label>
                            <input type="text" class="form-control" id="author" name="author" placeholder="作者">
                        </div>
                        <div class="form-group">
                            <label for="sort">分类</label>
                            <input type="text" class="form-control" id="sort" name="sort" placeholder="分类">
                        </div>
                        <div class="form-group">
                            <label for="intro">简介</label>
                            <input type="text" class="form-control" id="intro" name="intro" placeholder="简介">
                        </div>
                        内容
                        <textarea class="form-control" rows="3" name="content"></textarea>
                        <br>
                        <button type="submit" class="btn btn-default">提交</button>
                    </form>
                </div>
```

```js
router.post('/uploadPage',urlencodedParser,function(req,res){
    if(admin.checkToken(req.cookies.token)){

    }else{
        res.status(403).send('你没有权限')
        return
    }
var {sort,title,author,content,intro}=req.body
var now=moment().format('YYY-MM-DD HH-mm-ss')
page.insert({
    sort : sort,
    title : title,
    author :author,
    content : content,
    intro : intro,
    date : now
},()=>{
    res.send('文章发表成功')
})
})
```
>审核评论部分  先写一点东西，如果没有评论时提示
```html
 <div class="right-wrap" id="shenhe">
                    <div class="well">没有人想评论你写的东西</div>
                </div>
```
>后端评论接口
```js
router.get('/getComment',function(req,res){
    if(admin.checkToken(req.cookies.token)){

    } else {
        res.status(404).send('你没有权限')
        return
    }
    comment.find({state : 0},function(error,data){
        if(data.length == 0){
            res.send([])
            return
        }
        var count = 0
        for(var i = 0; i < data.length ; i++){
            var nowData = data[i]
            var nowDataFid = nowData.fid
            page.findById(nowDataFid,function(error,result){
                var page = result[0]
                nowData.f_title = page.title
                nowData.f_intro = page.intro
                count ++
                if(count == data.length){
                    res.send(data)
                }
            })
        }
    })
})
```
>前端ajax处理审核评论
```js
 var passComment = function(_id){
            $.ajax({
                type: 'get',
                url: '/admin/passComment',
                data: {
                    _id : _id
                },
                success: function (e) {
                    console.log(e)
                    getComment()
                }
            })
        }
```
>渲染界面 两个按钮，通过和不通过
```js
  var fillComment = function(arr){
            var html = ''
            if(arr.length == 0){
                $('#shenhe').html('<div class="well">没有人想评论你写的东西</div>')
                return
            }
            arr.forEach(function(e){
                html += `
                    <div class="panel panel-default">
                        <div class="panel-heading">
                            <h3 class="panel-title">作者：${e.author} 日期：${e.date}</h3>
                        </div>
                        <div class="panel-body">
                            <div class="well">评论的文章标题 ： ${e.f_title}
                                <br> 评论的文章简介：${e.f_intro}
                            </div>
                            ${e.content}
                        </div>
                        <div class="panel-footer">
                            <div class="btn-group" role="group" aria-label="...">
                                <button type="button" class="btn btn-default btn-success btn-pass" data-_id="${e._id}">通过</button>
                                <button type="button" class="btn btn-default btn-danger btn-nopass" data-_id="${e._id}">不通过</button>
                            </div>
                        </div>
                    </div>
                `
            })
            $('#shenhe').html(html)
            addEvenetListener()
        }
```
>通过的后端接口，将state改为状态为1.
```js
router.get('/passComment',function(req,res){
    if(admin.checkToken(req.cookies.token)){

    } else {
        res.status(404).send('你没有权限')
        return
    }
    var _id = req.query._id
    comment.updateById(_id,{state : 1},function(error,result){
        res.send(
            {
                result : 'ok'
            }
        )
    })
})
```
>不通过的后端接口，将state改为状态为2.
```js
router.get('/nopassComment',function(req,res){
    if(admin.checkToken(req.cookies.token)){

    } else {
        res.status(404).send('你没有权限')
        return
    }
    var _id = req.query._id
    comment.updateById(_id,{state : 2},function(error,result){
        res.send(
            {
                result : 'ok'
            }
        )
    })
})
```
>通过的前端ajax处理
```js
  var passComment = function(_id){
            $.ajax({
                type: 'get',
                url: '/admin/passComment',
                data: {
                    _id : _id
                },
                success: function (e) {
                    console.log(e)
                    getComment()
                }
            })
        }
```

```js
var addEvenetListener = function(){
            $('.btn-pass').on('click',function(){
                passComment(
                    $(this).attr('data-_id')
                )
            })
            $('.btn-nopass').on('click',function(){
                nopassComment(
                    $(this).attr('data-_id')
                )
            })
        }
```

>登录界面
```js
router.get('/login',function(req,res){
    res.sendFile(
        path.resolve('./static/html/login.html')
    )
})

router.post('/login',urlencodedParser,function(req,res){
if(req.body.username=='admin'&&req.body.password=='admin'){
res.cookie('token',admin.getToken())



    // res.send('登录成功')
    res.redirect('/admin')
}else{
    res.status(403).send('登录失败')
}
})
```
>登录界面前端页面
```html
 <div class="container">
        <div class="page-header">
            <h1>后台博客登录系统
                <br>
                <small>登录即可发表文章</small>
            </h1>
        </div>
        <form class="form-horizontal" method="POST" action="/admin/login">
            <div class="form-group">
                <label for="username" class="col-sm-2 control-label">账号</label>
                <div class="col-sm-10">
                    <input type="text" class="form-control" id="username" name="username" placeholder="账号">
                </div>
            </div>
            <div class="form-group">
                <label for="password" class="col-sm-2 control-label">密码</label>
                <div class="col-sm-10">
                    <input type="password" class="form-control" id="password" name="password" placeholder="密码">
                </div>
            </div>
            <div class="form-group">
                <div class="col-sm-offset-2 col-sm-10">
                    <button type="submit" class="btn btn-default">登录</button>
                </div>
            </div>
        </form>
    </div>
```
## 别看了，没了
