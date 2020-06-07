const express = require('express');
const fs = require('fs');
const https = require('https')
const http = require('http')
const privateKey  = fs.readFileSync('sslcert/selfsigned.key', 'utf8');
const certificate = fs.readFileSync('sslcert/selfsigned.crt', 'utf8');

const credentials = {key: privateKey, cert: certificate};
const ttl = 3600;
const app = express()

require('dotenv').config()  
const Redis = require('ioredis');
const Mysql      = require('mysql');
const mysql = Mysql.createConnection({
    host     : process.env.MYSQL_URL,
    port      :  process.env.MYSQL_PORT,
    user     : process.env.MYSQL_USERNAME,
    password : process.env.MYSQL_PASSWORD,
    database : process.env.MYSQL_DB
});
 
// todo: load balanced webservers w/ round robin
// todo: cognito
// todo: message queue

// const session = require('express-session');
const bodyParser = require('body-parser') 

app.use( bodyParser.json() );      
app.use(bodyParser.urlencoded({      
  extended: true
}));  
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

// use express as session store
// app.use(session({ 
//     secret: 'randomstring',
//     resave: false,
//     saveUninitialized: true,
//     cookie: { secure: true, 
//         httpOnly: true },
//     store: redis
//   })) 

http.createServer(app).listen(80, function() {
    console.log('listening on port 80');
  }); 
https.createServer(credentials, app).listen(443, function() {
    console.log('listening on port 443');
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
        setSessionValue(username);
        return res.sendFile(__dirname + '/views/index.html')

    }  else { 
        res.redirect(301, '/login')
    } 
}); 

const setSessionValue = username => {
    const key = `user:${username}`
    redis.setex(key, ttl, username, function (err, reply) { 
    }); 
}

app.get('/logout', (req, res) => { 
    if (req.session && req.session.username){ 
        const key = `user:${username}`
        redis.del(key);
        req.session.destroy(function(err) {
            res.redirect(301, '/login')
        })
    } else {
        res.redirect(301, '/login')
    } 
}); 

app.get('/login', (req, res) => {   
    return res.sendFile(__dirname + '/views/login.html') 
}); 

app.post('/login', (req, res) => { 
    const username = req.body.username;  
    req.session.username = username;
    setSessionValue(username);
    return res.sendFile(__dirname + '/views/index.html')
});  

app.get('/planet', (req, res) => {  
    console.log('planet page') 
    const id = Number(req.query.id)
    const key = "planet:" + id.toString();
    return redis.hget(key, (err, resultFromCache) => {
        // If that key exist in Redis store
        if (resultFromCache) { 
            const resultJSON = JSON.parse(resultFromCache);
            return res.status(200).json(resultJSON);
        } else { 
            mysql.query(`SELECT * FROM planet where id = ${id}`, function (err, resultFromDb) {
                if (err) { 
                    return 'db error occurred'
                } else {   
                    const row = JSON.stringify(resultFromDb[0]); 
                    const fields = JSON.parse(row) 
                    redis.setex(key, 3600, JSON.stringify({ source: 'redis cache', ...fields, })); 
                    return res.status(200).json({ source: 'mysql', ...fields, }); 
                } 
            }) 
        }
    });
}); 

app.get('/update', (req, res) => {   
    return res.sendFile(__dirname + '/views/update.html') 
}); 

app.post('/update', (req, res) => {   
    const id = req.body.id;
    const value = req.body.value;
    const key = "planet:" + id;
    return redis.hget(key, async (err, resultFromCache) => {
        // If that key exist in Redis store
        if (resultFromCache) {
            // update db and writethru cache
            mysql.query(`UPDATE planet set name = '${value}' where id = ${id}`, function (err, resultFromDb, fields) {
                if (err) { 
                    return 'insert db error occurred'
                } else {  
                    const row = JSON.stringify(resultFromDb);  
                    const valueIntoCache = {
                        source: 'redis cache',
                        id: row.insertId,
                        name: value
                    }
                    redis.hset(key, "name", value); 
                    return res.status(200).json({ source: 'mysql', ...valueIntoCache, }); 
                } 
            }) 
        } else { 
            // insert record into db, update if existing
            mysql.query(`REPLACE into planet (id, name) values(${id}, '${value}')`, function (err, resultFromDb, fields) {
                if (err) {
                    console.log('insert db error occurred')
                    return 'insert db error occurred'
                } else {  
                    const row = JSON.stringify(resultFromDb);  
                    const valueIntoCache = {
                        source: 'redis cache',
                        id: row.insertId,
                        name: value
                    } 
                    const _key = 'planet:' + row.insertId; 
                    redis.pipeline()
                    .hset(_key, 'source', 'redis cache')
                    .hset(_key, 'id', row.insertId)
                    .hset(_key, 'id', row.insertId)
                    .exec(function (err, results) {
                        console.log('pipeline error')
                    });
                    return res.status(200).json(valueIntoCache); 
                } 
            }) 
        }
    }); 
}); 