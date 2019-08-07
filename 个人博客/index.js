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
// const marked=require('marked')
app.use(cookieParser())

app.use(express.static('./static', {
    index: false
}))







// 后台功能接口的静态文件请求
app.use('/admin',express.static('./static',{index:false}))
//后台功能路由
app.use('/admin',require('./admin'))






app.get('/', function (req, res) {
    //在page数据库里查找全部文章
    page.find({}, function (err, data) {
        //ejs渲染json文章数据到页面中
        ejs.renderFile('./static/ejs/index.ejs', { data: data }, function (error, html) {
            res.send(html)
        })
    })
})

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
       
        comment.find({ fid: _id ,state:1 }, function (err, result) {
            //渲染评论
            ejs.renderFile('./static/ejs/page.ejs', { data: data,comment : result }, function (err, html) {
                res.send(html)
            })
        })
    })
})


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

app.listen(3000)