var crypto = require('crypto'),
    User = require('../models/user.js'),
    Post = require('../models/post.js'),
    config = require('../config.js'),
    check = require('validator').check,
    sanitize = require('validator').sanitize,
    RSS = require('rss'),
    mongo = require('mongodb'),
    BSON = mongo.BSONPure;

module.exports = function(app) {
    // Get homepage.
    app.get('/', function(req,res){
        var page = req.query.p?parseInt(req.query.p):1;
        Post.getTen(null, page, function(err, posts){
            if(err){
                posts = [];
            }
            // console.log(req.session.user);
            res.render('index',{
                title: res.__('HOMEPAGE') + ' - ' + config.siteName,
                siteName: config.siteName,
                tagLine: config.tagLine,
                allowReg: config.allowReg,
                user: req.session.user,
                posts: posts,
                page: page,
                postsLen: posts.length,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    // Registration.
    app.get('/reg', checkNotLogin, function(req, res) {
        if (!config.allowReg) {
            res.redirect('/');
            req.flash(res.__("REG_NOT_ALLOWED"));
            return;
        }
        res.render('reg',{
            title: res.__('REGISTER') + ' - ' + config.siteName,
            siteName: config.siteName,
            tagLine: config.tagLine,
            allowReg: config.allowReg,
            user: req.session.user,
            allowReg: config.allowReg,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/reg', checkNotLogin, function(req,res){
        var name = req.body.username,
            mail = req.body.email,
            password = req.body.password,
            repeatPassword = req.body['password-repeat'];

        try {
            check(name, 'USERNAME_EMPTY').notEmpty();
            check(name, 'USERNAME_ALPHANUMERIC').isAlphanumeric();
            check(password, 'PASSWORD_EMPTY').notEmpty();
            check(repeatPassword, 'PASSWORD_NOT_EQUAL').equals(password);
            check(mail, 'EMAIL_INVALID').len(4, 64).isEmail();
        } catch (e) {
            req.flash('error', res.__(e.message));
            return res.redirect('/reg');
        }

/*        if(name === '') {
            req.flash('error','Username cannot be empty');
            return res.redirect('/reg');
        }
        if(password === '') {
            req.flash('error','Password cannot be empty');
            return res.redirect('/reg');
        }
        // check if password equals.
        if(repeatPassword != password) {
            req.flash('error','Password not equal.');
            return res.redirect('/reg');
        }
        // validate email
        if (!check(req.body.email).len(4, 64).isEmail()) {
            req.flash('error','Please enter a valid email address.');
            return res.redirect('/reg');
        }
*/
        // get password hash
        var hash = crypto.createHash('sha256'),
            password = hash.update(req.body.password).digest('hex');
        var newUser = new User({
            name: name,
            password: password,
            email: mail
        });
        // check if username exists.
        User.check(newUser.name, newUser.email, function(err, user){
            console.log(user);
            if(user) {
                err = 'USER_EXISTS';
            }
            if(err) {
                req.flash('error', res.__(err));
                return res.redirect('/reg');
            }
            newUser.save(function(err){
                if(err){
                    req.flash('error',err);
                    return res.redirect('/reg');
                }
                req.session.user = newUser; // store user information to session.
                req.flash('success',res.__('REG_SUCCESS'));
                res.redirect('/');
            });
        });
    });

    // Login pages
    app.get('/login', checkNotLogin, function(req,res){
        res.render('login',{
            title: res.__('LOGIN') + ' - ' + config.siteName,
            siteName: config.siteName,
            tagLine: config.tagLine,
            allowReg: config.allowReg,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    // TODO password recovery.
    app.post('/login', checkNotLogin, function(req, res){
        // Generate password hash
        var hash = crypto.createHash('sha256'),
            password = hash.update(req.body.password).digest('hex');
        // check login details
        User.get(req.body.username, function(err, user) {
            if(!user || user.password != password) {
                req.flash('error', res.__('LOGIN_FAIL'));
                return res.redirect('/login');
            }
            // Login success, store user information to session.
            req.session.user = user;
            req.flash('success', res.__('LOGIN_SUCCESS'));
            res.redirect('/');
        });
    });

    app.get('/post-new', checkLogin, function(req,res) {
        res.render('post-new',{
            title: res.__('POST_NEW') + ' - ' + config.siteName,
            siteName: config.siteName,
            tagLine: config.tagLine,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/post-new', checkLogin, function(req, res) {
        var currentUser = req.session.user,
            tag = req.body.tag.split(', '),
            tags = [];
        if (req.body.title === '') {
            req.flash('error', res.__('TITLE_EMPTY'));
            return res.redirect('/post-new');
        }
        if (!req.body.post) {
            req.flash('error', res.__('CONTENT_EMPTY'));
            return res.redirect('/post-new');
        }
        tag.forEach(function(tag) {
                if(tag) {
                    if (tag.indexOf('/') > -1) {
                        tag = tag.replace(/\//g, '_');
                    }
                    tags.push({"tag":tag});
                }
        });
        // console.log(tags);
            // tags = [{"tag":req.body.tag1},{"tag":req.body.tag2},{"tag":req.body.tag3}];
        var md5 = crypto.createHash('md5'),
            email_MD5 = md5.update(currentUser.email.toLowerCase()).digest('hex'),
            avatar = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=64",
            post = new Post(currentUser.name, avatar, req.body.title, tags, req.body.post);
        // console.log(currentUser.name);
        post.save(function(err) {
            if(err){
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success', res.__('POST_SUCCESS'));
            res.redirect('/');
        });
    });

    app.get('/post/:id/edit', checkLogin, function(req,res){
        var ObjectID = new BSON.ObjectID(req.params.id);
        Post.getRaw(ObjectID, function(err, post){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            if (req.session.user.name != post.name) {
                req.flash('error', res.__('NO_PERMISSION'));
                return res.redirect('/post/' + req.params.id);
            }
            var tags = "";
            post.tags.forEach(function(tag) {
                if (tag) {
                    tags += tag.tag + ", ";
                }
            });
            res.render('edit',{
                title: res.__('EDIT_POST') + ' - ' + config.siteName,
                siteName: config.siteName,
                tagLine: config.tagLine,
                allowReg: config.allowReg,
                user: req.session.user,
                post: post,
                tags: tags,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.post('/post/:id/edit', checkLogin, function(req, res) {
        var ObjectID = new BSON.ObjectID(req.params.id);
        var currentUser = req.session.user,
            tag = req.body.tag.split(', '),
            tags = [];
        // console.log(tag);
        if (req.body.title === '') {
            req.flash('error', res.__('TITLE_EMPTY'));
            return res.redirect('/post/' + req.params.id);
        }
        if (!req.body.post) {
            req.flash('error', res.__('CONTENT_EMPTY'));
            return res.redirect('/post/' + req.params.id);
        }
        tag.forEach(function(tag) {
            if(tag) {
                if (tag.indexOf('/') > -1) {
                    tag = tag.replace(/\//g, '_');
                }
                tags.push({"tag":tag});
            }
        });
        // console.log(tags);
        // trim '/' in title
        var md5 = crypto.createHash('md5'),
            email_MD5 = md5.update(currentUser.email.toLowerCase()).digest('hex'),
            avatar = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=64",
            post = new Post(currentUser.name, avatar, req.body.title, tags, req.body.post);
        // console.log(currentUser.name);
        post.edit(currentUser.name, ObjectID, post, function(err, post) {
            if(err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            //console.log(post);
            req.flash('success', res.__('POST_UPDATED'));
            res.redirect('/post/' + req.params.id);
        });
    });

    app.post('/post/:id/delete', checkLogin, function(req, res) {
        var ObjectID = new BSON.ObjectID(req.params.id);
        var currentUser = req.session.user;
        Post.remove(currentUser.name, ObjectID, function(err) {
            if(err) {
                req.flash('error', err);
                return res.redirect('/post/' + req.params.id);
            }
            req.flash('success', res.__('POST_DELETED'));
            res.redirect('/');
        })
    });

    app.get('/logout', checkLogin, function(req, res) {
        req.session.user = null;
        req.flash('success',res.__('LOGOUT_SUCCESS'));
        res.redirect('/');
    });

    app.get('/archive', function(req,res){
        Post.getArchive(function(err, posts){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('archive',{
                title: res.__('ARCHIVE') + ' - ' + config.siteName,
                siteName: config.siteName,
                tagLine: config.tagLine,
                allowReg: config.allowReg,
                user: req.session.user,
                posts: posts,
                postsLen: posts.length,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get('/tags', function(req,res){
        Post.getTags(function(err, posts){
            if(err){
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('tags',{
                title: res.__('TAGS') + ' - ' + config.siteName,
                siteName: config.siteName,
                tagLine: config.tagLine,
                allowReg: config.allowReg,
                user: req.session.user,
                posts: posts,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get('/tags/:tag', function(req,res){
        Post.getTag(req.params.tag, function(err, posts){
            if(err){
                req.flash('error', err);
                return res.redirect('/');
            }
            res.render('tag',{
                title: res.__('TAG') + ': ' + req.params.tag + ' - ' + config.siteName,
                siteName: config.siteName,
                tagLine: config.tagLine,
                allowReg: config.allowReg,
                user: req.session.user,
                posts: posts,
                tag: req.params.tag,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get('/u/:name', function(req,res){
        var page = req.query.p?parseInt(req.query.p):1;
        // check if user exists.
        User.get(req.params.name, function(err, user){
            if(!user){
                req.flash('error',res.__('USER_NOT_EXIST'));
                return res.redirect('/');
            }
            // query for top 10 posts by 'user'.
            Post.getTen(user.name, page, function(err, posts){
                if(err){
                    req.flash('error',err);
                    return res.redirect('/');
                }
                res.render('user',{
                    title: res.__('USER') + ': '+ req.params.name + ' - ' + config.siteName,
                    siteName: config.siteName,
                    tagLine: config.tagLine,
                    allowReg: config.allowReg,
                    user: req.session.user,
                    username: req.params.name,
                    posts: posts,
                    page: page,
                    postsLen: posts.length,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString()
                });
            });
        });
    });

    app.get('/me', checkLogin, function(req, res) {
        res.render('me',{
            title: req.session.user.name + ' - ' + config.siteName,
            siteName: config.siteName,
            tagLine: config.tagLine,
            allowReg: config.allowReg,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });

    app.post('/me', checkLogin, function(req, res) {
        var email = req.body.email,
            hash = crypto.createHash('sha256'),
            password = hash.update(req.body.password).digest('hex'),
            newPassword = req.body.newpass,
            repeatPassword = req.body['password-repeat'],
            inputError = '';

        if (password != req.session.user.password) {
            inputError = 'WRONG_PASSWORD';
        }
        if (repeatPassword || newPassword) {
            var hash = crypto.createHash('sha256'),
                newPassword = hash.update(newPassword).digest('hex');
            var hash = crypto.createHash('sha256'),
                repeatPassword = hash.update(repeatPassword).digest('hex');
            if (repeatPassword != newPassword) {
                inputError = 'PASSWORD_NOT_EQUAL';
            }
            password = newPassword;
        }


        try {
            check(email, 'EMAIL_INVALID').len(4, 64).isEmail();
        } catch (e) {
            inputError = e.message;
        }

        if (inputError) {
            req.flash('error', res.__(inputError));
            return res.redirect('/me');
        }

        var newUser = new User({
                name: req.session.user.name,
                email: email,
                password: password
            });
        console.log(newUser);

        User.edit(newUser, function(err, user){
            if(err) {
                req.flash('error', res.__(err));
                return res.redirect('/me');
            }
            req.flash('success', res.__('USER_UPDATED'));
            req.session.user = null;
            res.redirect('/login');
        });
    });

    app.get('/post/:id', function(req,res){
        var ObjectID = new BSON.ObjectID(req.params.id);
        Post.getOne(ObjectID, function(err, post) {
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('article',{
                title: post.title + ' - ' + config.siteName,
                siteName: config.siteName,
                tagLine: config.tagLine,
                allowReg: config.allowReg,
                user: req.session.user,
                post: post,
                disqus: config.disqus,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            });
        });
    });

    app.get('/rss', function(req, res) {
        var feed = new RSS({
            title: 'RSS - ' + config.siteName,
            author: '',
            date: '',
            discription: '',
            url: config.url,
            feed_url: config.url + '/rss',
            pubDate: new Date()
        });

        var xml = '';

        Post.getTen(null, 1, function(err, posts){
            if(err){
                posts = [];
            }
            posts.forEach(function(post, index) {
                feed.item({
                    title:  post.title,
                    discription: post.content,
                    url: config.url + '/post/' + post._id,
                    author: post.name,
                    date: post.time.date
                });
                xml = feed.xml();
            });
            // console.log(xml);
            res.send(xml);
        });

    });

    function checkLogin(req, res, next) {
        if(!req.session.user){
            req.flash('error',res.__('LOGIN_NEEDED'));
            return res.redirect('/login');
        }
        next();
    }

    function checkNotLogin(req,res,next) {
        if(req.session.user){
            req.flash('error',res.__('ALREADY_LOGIN'));
            return res.redirect('/');
        }
        next();
    }

}