const express = require('express');
const responseTime = require('response-time')
const axios = require('axios');
const redis = require('redis'); 
const session = require('express-session');
const bodyParser = require('body-parser')
const app = express();  
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
const RedisServer = require('redis-server'); 
const server = new RedisServer(6379);
 
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
        console.log('has username') 
        // return res.status(200).json({username: req.session.username});
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