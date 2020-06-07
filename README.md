This is a nodejs application that demonstrates how to use redis for caching session data, such as login info, as well as how to use redis as a cache for frequently accessed items from a mysql database. 

It uses a writethrough with redis to update the cache when an update is made to the mysql store.

This app needs to be installed in an aws environment where the node server has access to a running instance of redis and mysql.  The templates/template-cfn.yaml file is a CloudFormation template that provides a starting point for a aws environment.

After configuring aws:
```
npm install
npm run start
