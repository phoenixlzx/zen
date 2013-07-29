var crypto = require('crypto'),
    User = require('../models/user.js'),
    Post = require('../models/post.js'),
    config = require('../config.js'),
    check = require('validator').check,
    sanitize = require('validator').sanitize,
    RSS = require('rss');

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
            res.redirect('/');
            req.flash('Registration is currently not allowed.');
            return;
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
            tag = req.body.tag.split(', '),
            tags = [];
        tag.forEach(function(tag) {
                if(tag) {
                    tags.push({"tag":tag});
                }
        });
        // console.log(tags);
            // tags = [{"tag":req.body.tag1},{"tag":req.body.tag2},{"tag":req.body.tag3}];
        // trim '/' in title
        var url = "";
        if (req.body.title.indexOf('/') === -1) {
            url = req.body.title;
        } else {
            console.log(req.body.title.indexOf('/'));
            url = req.body.title.replace(/\//g, '%2F');
            //console.log(url);
        }
        var md5 = crypto.createHash('md5'),
            email_MD5 = md5.update(currentUser.email.toLowerCase()).digest('hex'),
            avatar = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=64",
            post = new Post(currentUser.name, avatar, req.body.title, tags, req.body.post, url);
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

    app.get('/u/:name/:day/:url/edit', checkLogin, function(req,res){
        if (req.session.user.name != req.params.name) {
            req.flash('error', "You do not have permission to do this.");
            return res.redirect('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.url);
        }
        var newUrl = "";
        if (req.params.url.indexOf('/') === -1) {
            newUrl = req.params.url;
        } else {
            newUrl = req.params.url.replace(/\//g, '%2F');
            //console.log(url);
        }
        Post.getRaw(req.params.name, req.params.day, newUrl, function(err, post){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            var tags = "";
            post.tags.forEach(function(tag) {
                if (tag) {
                    tags += tag.tag + ", ";
                }
            });
            res.render('edit',{
                title: 'Edit post - ' + config.siteName,
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

    app.post('/u/:name/:day/:url/edit', checkLogin, function(req, res) {
        if (req.session.user.name != req.params.name) {
            req.flash('error', "You do not have permission to do this.");
            return res.redirect('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.url);
        }
        var currentUser = req.session.user,
        // TODO split tags by ','
            tag = req.body.tag.split(', '),
            tags = [];
        // console.log(tag);
        tag.forEach(function(tag) {
            if(tag) {
                tags.push({"tag":tag});
            }
        });
        // console.log(tags);
        // trim '/' in title
        var newUrl = "";
        if (req.body.title.indexOf('/') === -1) {
            newUrl = req.body.title;
        } else {
            newUrl = req.body.title.replace(/\//g, '%2F');
            //console.log(url);
        }
        var md5 = crypto.createHash('md5'),
            email_MD5 = md5.update(currentUser.email.toLowerCase()).digest('hex'),
            avatar = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=64",
            post = new Post(currentUser.name, avatar, req.body.title, tags, req.body.post);
        // console.log(currentUser.name);
        post.edit(currentUser.name, req.params.day, req.params.url, newUrl, post, function(err) {
            if(err){
                req.flash('error', err);
                return res.redirect('/');
            }
            //console.log(post);
            req.flash('success', 'Post updated.');
            res.redirect('/u/' + req.params.name + '/' + req.params.day + '/' + newUrl);
        });
    });

    app.get('/u/:name/:day/:url/delete', checkLogin, function(req, res) {
        if (req.session.user.name != req.params.name) {
            req.flash('error', "You do not have permission to do this.");
            return res.redirect('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.url);
        }
        var currentUser = req.session.user,
            newUrl = "";
        if (req.params.url.indexOf('/') === -1) {
            newUrl = req.params.url;
        } else {
            newUrl = req.params.url.replace(/\//g, '%2F');
            //console.log(url);
        }
        Post.remove(req.params.name, req.params.day, req.params.url, function(err) {
            if(err) {
                req.flash('error', err);
                return res.redirect('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.url);
            }
            req.flash('success', 'Post deleted.');
            res.redirect('/');
        })
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

    app.get('/u/:name/:day/:url', function(req,res){
        var newUrl = "";
        if (req.params.url.indexOf('/') === -1) {
            newUrl = req.params.url;
        } else {
            newUrl = req.params.url.replace(/\//g, '%2F');
            //console.log(url);
        }
        Post.getOne(req.params.name, req.params.day, newUrl, function(err, post){
            if(err){
                req.flash('error',err);
                return res.redirect('/');
            }
            console.log(post);
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
                    url: config.url + '/u/' + post.name + '/' + post.time.day + '/' + post.url,
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