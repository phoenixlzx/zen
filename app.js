
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , MongoStore = require('connect-mongo')(express)
  , config = require('./config.js')
  , flash = require('connect-flash');


var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views/' + config.theme);
app.set('view engine', 'ejs');
app.use(express.favicon());
// app.use(express.favicon(__dirname + '/public/img/favicon.ico'));
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({
    secret: config.cookieSecret,
    key: config.db,
    cookie: {maxAge: 1000 * 60 * 60 * 24 * 30},//30 days
    store: new MongoStore({
        db: config.db
    })
}));
app.use(flash());
app.use(app.router);
app.use(require('less-middleware')({ src: __dirname + '/public' }));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

routes(app);

// Convert URLs
/*
var mongodb = require('./models/db.js'),
    check = require('validator').check,
    sanitize = require('validator').sanitize;
 function URL(callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.find(function(err, posts) {
                posts.each(function(err, doc) {
                    if (doc) {
                        var url = "";
                        if (doc.title.indexOf('/') === -1) {
                            url = doc.title;
                        } else {
                            console.log(doc.title.indexOf('/'));
                            url = doc.title.replace('/', '_');
                            //console.log(url);
                        }
                        collection.update({"name":doc.name,"time.day":doc.day,"title":doc.title}, {$set:{"url" : url}}, function(err, callback) {
                            if(err) {
                                return callback(err);
                            }
                            mongodb.close();
                        });
                    }
                });
            });
        });
    });
}
URL();
// Convert URL end
*/

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
