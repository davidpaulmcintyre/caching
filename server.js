const express = require('express');
require('dotenv').config()
const responseTime = require('response-time') 
// const redis = require('redis'); 
const Redis = require('ioredis');
const session = require('express-session');
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const cookieSession = require('cookie-session')
const app = express();  

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 
app.use(cookieParser());
app.use(cookieSession());
// const cache = new AWS.ElastiCache({apiVersion: '2015-02-02', endpoint: process.env.REDIS_URL});
// var RedisServer = require('redis-clustr');
// var RedisClient = require('redis');
// var config = require("./config.json");

// var redisClient = new RedisServer({
//     servers: [
//         {
//             host: process.env.REDIS_URL,
//             port: process.env.REDIS_PORT
//         }
//     ],
//     // createClient: function (port, host) {
//     //     // this is the default behaviour
//     //     return RedisClient.createClient(port, host);
//     // }
// });  
const opts = {
    host: process.env.REDIS_URL,
    port: process.env.REDIS_PORT,
    autoResubscribe: true,
    maxRetriesPerRequest: 5
};
const redis = new Redis(opts); 

console.log(process.env.REDIS_URL)
app.use(session({
    // secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
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
            return res.sendFile(__dirname + '/views/login.html') 
        })
    } else {
    return res.sendFile(__dirname + '/views/login.html') 
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