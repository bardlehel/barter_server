//var express = require('express');

var http = require('http')
  , express      = require('express')
  , cookieParser = require('cookie-parser')
  , bodyParser = require('cookie-parser')
  , session      = require('express-session')
  ;

var app = express();

  app.use(cookieParser());
  app.use(bodyParser());
  app.use(session({secret: '1234567890QWERTY'}));

app.get('/awesome', function(req, res) {

  if(req.session.lastPage) {
    res.send('Last page was: ' + req.session.lastPage + '. ');
  }
  else res.send('You are awesome');
  req.session.lastPage = '/awesome';
});

app.get('/radical', function(req, res) {

  if(req.session.lastPage) {
    res.send('Last page was: ' + req.session.lastPage + '. ');
  }
  else res.send('You are awesome');
req.session.lastPage = '/radical';
});

app.listen(process.env.PORT || 8081);
