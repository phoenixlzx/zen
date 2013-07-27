var mongodb = require('./db.js');

function User(user) {
    this.name = user.name;
    this.email = user.email;
    this.password = user.password;
}

module.exports = User;

// save user data.
User.prototype.save = function(callback) {
    // user infomation to save.
    var user = {
        name: this.name,
        email: this.email,
        password: this.password
    };
    // open database.
    mongodb.open(function(err, db) {
        if(err) {
            return callback(err);
        }

        // read user collection.
        db.collection('users', function(err, collection) {
            if(err) {
                mongodb.close;
                return callback(err);
            }

            // insert user data to collection.
            collection.insert(user, {safe: true}, function(err, user) {
                mongodb.close();
                callback(err, user); // return user data if success.
            });
        });
    });
};

// read user data.
User.get = function(name, callback) {
    //open database.
    mongodb.open(function(err, db) {
        if(err) {
            return callback(err);
        }
        // read users collection.
        db.collection('users', function(err, collection) {
            if(err) {
                mongodb.close();
                return callback(err);
            }
            collection.findOne({
                name: name
            }, function(err, doc) {
                mongodb.close();
                if(doc) {
                    var user = new User(doc);
                    callback(err, user); // query success, return user data.
                } else {
                    callback(err, null); // query failed, return null.
                }
            });
        });
    });
};