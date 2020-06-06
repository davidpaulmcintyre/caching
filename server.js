const express = require('express');
require('dotenv').config()
const responseTime = require('response-time') 
// const redis = require('redis'); 
const Redis = require('ioredis');
var Mysql      = require('mysql');
var mysql = Mysql.createConnection({
    host     : process.env.MYSQL_URL,
    port      :  process.env.MYSQL_PORT,
    user     : process.env.MYSQL_USERNAME,
    password : process.env.MYSQL_PASSWORD,
    database : process.env.MYSQL_DB
});

const session = require('express-session');
const bodyParser = require('body-parser')
// const cookieParser = require('cookie-parser')
// const cookieSession = require('cookie-session')
const app = express();  

app.use( bodyParser.json() );      
app.use(bodyParser.urlencoded({      
  extended: true
})); 
// app.use(cookieParser());
// app.use(cookieSession({signed: false}));  
const opts = {
    host: process.env.REDIS_URL,
    port: process.env.REDIS_PORT,
    autoResubscribe: true,
    maxRetriesPerRequest: 5
};
const redis = new Redis(opts); 

mysql.connect(function(err){
    if(!err) {
        console.log("Database is connected ... ");    
    } else {
        console.log("Error connecting database ... ", err);    
    }
});


console.log(process.env.REDIS_URL)
app.use(session({ 
    secret: 'randomstring',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true, 
        httpOnly: true }
  }))

app.listen(80, function() {
  console.log('Example app listening on port 80!');
}); 
 
redis.on("connect", function () {
    console.log("connected");
  });
  
  redis.on('error', err => {
    console.log('error', err.message, {stack: err.stack});
});

  //check the functioning
// redis.set("framework", "AngularJS", function (err, reply) {
//     if (err){
//         console.log(err)
//     } else {
//         console.log("redis.set " , reply);
//     }
// });

// redis.get("framework", function (err, reply) {
//     if (err){
//         console.log(err)
//     } else {
//         console.log("redis.set " , reply);
//     }
// }); 
 
app.get('/', (req, res) => { 
    if (req.session && req.session.username){
        const username = req.session.username
        console.log('has username')  
        redis.set(username, username, function (err, reply) {
            console.log("redis.set " , reply);
          });
          
        redis.get(username, function (err, reply) {
        console.log("redis.get ", reply);
        });
        return res.sendFile(__dirname + '/views/index.html')

    }  else {
        console.log('no username') 
        res.redirect(301, '/login')
    } 
}); 

app.get('/logout', (req, res) => { 
    if (req.session && req.session.username){
        console.log('logout') 
        req.session.destroy(function(err) {
            res.redirect(301, '/login')
        })
    } else {
        res.redirect(301, '/login')
    } 
}); 

app.get('/login', (req, res) => {  
    console.log('login page')
    return res.sendFile(__dirname + '/views/login.html') 
}); 

app.post('/login', (req, res) => {   
    req.session.username = req.body.username
    return res.sendFile(__dirname + '/views/index.html')
}); 

app.get('/planet', (req, res) => {  
    console.log('planet page') 
    const id = Number(req.query.id)
    const key = "planet:" + str(id)
    const result = cache.hgetall(key)
    if (result){
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ content: result }, null, 3));
    } else {
        const sql = "SELECT `id`, `name` FROM `planet` WHERE `id`=%s"
        const row = mysql.query(`SELECT * FROM planet where id = ${id}`, function (err, result, fields) {
            if (err) {
                return 'db error occurred'
            } else {
                cache.hmset(key, result)
                cache.expire(key, ttl)
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ content: row }, null, 3));
            } 
        })
    } 

}); 
