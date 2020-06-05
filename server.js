const express = require('express');
require('dotenv').config()
const responseTime = require('response-time')
const axios = require('axios');
// const redis = require('redis'); 
const session = require('express-session');
const bodyParser = require('body-parser')
const app = express();  

// const cache = new AWS.ElastiCache({apiVersion: '2015-02-02', endpoint: process.env.REDIS_URL});
var RedisClustr = require('redis-clustr');
var RedisClient = require('redis');
// var config = require("./config.json");

var redisClient = new RedisClustr({
    servers: [
        {
            host: process.env.REDIS_URL,
            port: process.env.REDIS_PORT
        }
    ],
    createClient: function (port, host) {
        // this is the default behaviour
        return RedisClient.createClient(port, host);
    }
});  

//connect to redis
redisClient.on("connect", function () {
  console.log("connected");
});

//check the functioning
// redis.set("framework", "AngularJS", function (err, reply) {
//   console.log("redis.set " , reply);
// });

// redis.get("framework", function (err, reply) {
//   console.log("redis.get ", reply);
// });


console.log(process.env.REDIS_URL)
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
  }))

app.listen(3000, function() {
  console.log('Example app listening on port 3000!');
});
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 


let client;
// const RedisServer = require('redis-server'); 
// const server = new RedisServer(6379);
 
server.open((err) => {
  if (err === null) { 
    client = redis.createClient();
    client.on('connect', (err) => {
        console.log("connect " + err);
      });
    // // Print redis errors to the console
    client.on('error', (err) => {
      console.log("Error " + err);
    });
  }
}); 
 
app.get('/', (req, res) => { 
    if (req.session && req.session.username){
        const username = req.session.username
        console.log('has username')  
        redisClient.set("framework", "AngularJS", function (err, reply) {
            console.log("redis.set " , reply);
          });
          
        redisClient.get("framework", function (err, reply) {
        console.log("redis.get ", reply);
        });
        return res.sendFile(__dirname + '/views/index.html')

    }  else {
        console.log('no username')
        // return res.sendFile(__dirname + '/views/login.html')
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