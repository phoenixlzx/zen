var mongodb = require('./db.js'),
    markdown = require('markdown').markdown;

function Post(name, avatar, title, tags, content, url) {
    this.name = name;
    this.avatar = avatar;
    this.title = title;
    this.tags = tags;
    this.content = content;
    this.url = url;
}

module.exports = Post;

Post.prototype.save = function(callback) {
    // Get post date/time
    var date = new Date();
    var time = {
        date: date,
        year : date.getFullYear(),
        month : date.getFullYear() + "-" + (date.getMonth()+1),
        day : date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate(),
        minute : date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes()
    }
    // Post to save.
    var post = {
        name: this.name,
        avatar: this.avatar,
        title: this.title,
        time: time,
        tags: this.tags,
        // content: markdown.toHTML(this.content),  // parse MD to HTML while insert into DB. WARNING: will this cause security problems?
        content: this.content,
        url: this.url,
        views: 0
    };

    // Open database.
    mongodb.open(function(err, db) {
        if(err) {
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }
            collection.insert(post, {safe: true}, function(err, post) {
                mongodb.close();
                callback(null);
            });
        });
    });
};

Post.prototype.edit = function(name, day, url, post, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            // console.log(post);
            collection.update({"name":name,"time.day":day,"url":url}, {$set:{
                "title" : post.title,
                "tags" : post.tags,
                "content" : post.content
            }}, function(err) {
                if (err) {
                    // console.log(err);
                    mongodb.close();
                    return callback(err);
                }
                // console.log(post);
                mongodb.close();
                callback(null);
            });
        });
    });
};

Post.remove = function(name, day, url, callback) {
    mongodb.open(function(err, db) {
        if(err) {
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }
            collection.remove({"name":name, "time.day":day, "url":url}, true, function(err) {
                if(err) {
                    mongodb.close();
                    return callback(err);
                }
                mongodb.close();
                callback(null);
            });
        });
    });
};

Post.getTen = function(name, page, callback) {
    // Open database.
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        // Read posts collection
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var query = {};
            if (name) {
                query.name = name;
            }
            // Query for page - 1, 10 posts each.
            collection.find(query,{skip:(page - 1)*10,limit:10}).sort({
                time: -1
            }).toArray(function (err, docs) {
                mongodb.close();
                if (err) {
                    callback(err, null);
                }
                // Parse Markdown to HTML, if there is security problems
                // while insert HTML to DB, then use this method. May cause higher load.
                docs.forEach(function(doc) {
                    doc.content = markdown.toHTML(doc.content);
                });
                callback(null, docs);
            });
        });
    });
};

// return all posts.
Post.getArchive = function(callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            // return array containing name, time and title.
            collection.find({},{"name":1,"time":1,"title":1,"url":1}).sort({
                time:-1
            }).toArray(function(err, docs){
                    mongodb.close();
                    if (err) {
                        callback(err, null);
                    }
                    callback(null, docs);
                });
        });
    });
};

// get all tags
Post.getTags = function(callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.distinct("tags.tag",function(err, docs){
                mongodb.close();
                if (err) {
                    callback(err, null);
                }
                callback(null, docs);
            });
        });
    });
};

// return specified tagged articles.
Post.getTag = function(tag, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            // return posts containing name, time and title, query by tags.tag
            collection.find({"tags.tag":tag},{"name":1,"time":1,"title":1,"url":1}).sort({
                time:-1
            }).toArray(function(err, docs) {
                    mongodb.close();
                    if (err) {
                        callback(err, null);
                    }
                    callback(null, docs);
            });
        });
    });
};

// search for posts, query by keyword.
Post.search = function(keyword, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var pattern = new RegExp("^.*"+keyword+".*$", "i");
            collection.find({"title":pattern},{"name":1,"time":1,"title":1,"url":1}).sort({
                time:-1
            }).toArray(function(err, docs) {
                    mongodb.close();
                    if (err) {
                        callback(err, null);
                    }
                    callback(null, docs);
            });
        });
    });
};

// Get specified post.
Post.getOne = function(name, day, url, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            // 根据用户名、发表日期及文章名进行精确查询
            collection.findOne({"name":name,"time.day":day,"url":url},function (err, doc) {
                mongodb.close();
                if (err) {
                    callback(err, null);
                }
                //解析 markdown 为 html
                if(doc){
                    doc.content = markdown.toHTML(doc.content);
                }
                callback(null, doc);//返回特定查询的文章
            });
            collection.update({"name":name,"time.day":day,"url":url},{$inc:{"views":1}}, {w: 0});
        });
    });
};

// Get raw markdown text
Post.getRaw = function(name, day, url, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            return callback(err);
        }
        db.collection('posts', function(err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            // 根据用户名、发表日期及文章名进行精确查询
            collection.findOne({"name":name,"time.day":day,"url":url},function (err, doc) {
                mongodb.close();
                if (err) {
                    callback(err, null);
                }
                // return raw markdown text
                // if(doc){
                //    doc.content = markdown.toHTML(doc.content);
                // }
                callback(null, doc);
            });
        });
    });
};
