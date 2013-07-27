var crypto = require('crypto'),
    User = require('../models/user.js'),
    Post = require('../models/post.js'),
    config = require('../config.js'),
    check = require('validator').check,
    sanitize = require('validator').sanitize;

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
                title: 'Home - ' + config.siteName,
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
            // req.flash('Registration is currently not allowed.');
            return res.redirect('/');
        }
        res.render('reg',{
            title: 'Register - ' + config.siteName,
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
        // TODO validate user inputs using validator.
        if(name === '') {
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

        // get password hash
        var hash = crypto.createHash('sha256'),
            password = hash.update(req.body.password).digest('hex');
        var newUser = new User({
            name: req.body.username,
            password: password,
            email: req.body.email
        });
        // check if username exists.
        User.get(newUser.name, function(err, user){
            if(user) {
                err = 'User exists.';
            }
            if(err) {
                req.flash('error', err);
                return res.redirect('/reg');
            }
            newUser.save(function(err){
                if(err){
                    req.flash('error',err);
                    return res.redirect('/reg');
                }
                req.session.user = newUser; // store user information to session.
                req.flash('success','Registered successfully.');
                res.redirect('/');
            });
        });
    });

    // Login pages
    app.get('/login', checkNotLogin, function(req,res){
        res.render('login',{
            title: 'Login - ' + config.siteName,
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
                req.flash('error', 'Login failed');
                return res.redirect('/login');
            }
            // Login success, store user information to session.
            req.session.user = user;
            req.flash('success','Successfully logged in.');
            res.redirect('/');
        });
    });

    app.get('/post-new', checkLogin, function(req,res) {
        res.render('post-new',{
            title:'Post new - ' + config.siteName,
            siteName: config.siteName,
            tagLine: config.tagLine,
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        });
    });
    app.post('/post-new', checkLogin, function(req, res) {
        var currentUser = req.session.user,
        // TODO split tags by ','
            tags = [{"tag":req.body.tag1},{"tag":req.body.tag2},{"tag":req.body.tag3}];
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
            req.flash('success', 'Posted successfully.');
            res.redirect('/');
        });
    });

    app.get('/logout', checkLogin, function(req, res) {
        req.session.user = null;
        req.flash('success','Successfully logged out.');
        res.redirect('/');
    });

    app.get('/archive', function(req,res){
        Post.getArchive(function(err, posts){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('archive',{
                title: 'Archive - ' + config.siteName,
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
                title: 'Tags - ' + config.siteName,
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
                title: 'Tag: ' + req.params.tag + ' - ' + config.siteName,
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
                req.flash('error','User not exist.');
                return res.redirect('/');
            }
            // query for top 10 posts by 'user'.
            Post.getTen(user.name, page, function(err, posts){
                if(err){
                    req.flash('error',err);
                    return res.redirect('/');
                }
                res.render('user',{
                    title: 'User: '+ req.params.name + ' - ' + config.siteName,
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
    });

    app.get('/u/:name/:day/:title', function(req,res){
        Post.getOne(req.params.name, req.params.day, req.params.title, function(err, post){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            res.render('article',{
                title: req.params.title + ' - ' + config.siteName,
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

    function checkLogin(req, res, next) {
        if(!req.session.user){
            req.flash('error','You have to login first.');
            return res.redirect('/login');
        }
        next();
    }

    function checkNotLogin(req,res,next) {
        if(req.session.user){
            req.flash('error','You have already logged in.');
            return res.redirect('/');
        }
        next();
    }

}