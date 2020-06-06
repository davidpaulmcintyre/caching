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
    const key = "planet:" + id.toString();

    return redis.get(key, (err, resultFromCache) => {
        // If that key exist in Redis store
        if (resultFromCache) {
            console.log('from cache')   
            const resultJSON = JSON.parse(resultFromCache);
            return res.status(200).json(resultJSON);
        } else { 
            mysql.query(`SELECT * FROM planet where id = ${id}`, function (err, resultFromDb) {
                if (err) {
                    console.log('db error occurred')
                    return 'db error occurred'
                } else {
                    console.log('row ', resultFromDb)  
                    const fields = JSON.parse(JSON.stringify(resultFromDb))
                    redis.setex(key, 3600, JSON.stringify({ source: 'redis cache', ...fields, }));
                    // Send JSON response to client
                    return res.status(200).json({ source: 'mysql', ...fields, }); 
                } 
            }) 
        }
      });
}); 
