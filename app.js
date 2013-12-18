/* Some initialization boilerplate. Also, we include the code from
   routes/routes.js, so we can have access to the routes. Note that
   we get back the object that is defined at the end of routes.js,
   and that we use the fields of that object (e.g., routes.get_main)
   to access the routes. */

var express = require('express');
var routes = require('./routes/routes.js');
var async = require('async');
var app = express();

app.use(express.bodyParser());
app.use(express.logger("default"));
app.use(express.cookieParser());
app.use(express.session({secret:'session'}));

app.configure(function() {
	 app.use(function(req, res, next) {
	     res.setHeader("Cache-Control", "no-cache must-revalidate");
	     return next();
	 });
	});

app.use("/", express.static(__dirname + '/'));


/* Below we install the routes. The first argument is the URL that we
   are routing, and the second argument is the handler function that
   should be invoked when someone opens that URL. Note the difference
   between app.get and app.post; normal web requests are GETs, but
   POST is often used when submitting web forms ('method="post"'). */

app.get('/', routes.get_main);
app.get('/home/:id', routes.get_home);
app.get('/profile/:id', routes.get_profile);
app.post('/checklogin', routes.check_login);
app.get('/signup', routes.sign_up);
app.post('/createaccount', routes.create_account);
app.get('/loadwall/:id', routes.load_wall);
app.get('/loadhome/:id', routes.load_home);
app.post('/postcomment', routes.post_comment);
app.get('/loadcomments/:id', routes.load_comments);
app.get('/logout', routes.logout);
app.post('/sendmessage', routes.send_message);
app.post('/addfriend/:id', routes.add_friend);
app.post('/delete/:id', routes.delete_friend);
app.get('/checkfriend/:id', routes.check_friend);
app.get('/suggest/:term', routes.search_help);
app.get('/search', routes.get_search);
app.get('/getonline', routes.get_online);
app.get('/gethome/', routes.get_home2);
app.get('/findname/', routes.get_name);
app.get('/getprofile2/', routes.get_profile2);
app.get('/getsuggestions/', routes.get_suggestions);
app.get('/visualize/', routes.visual);
/* Run the server */

console.log('Authors: Dhruv Maheshwari (dhruvm) & Corey Loman (loman)');
app.listen(8080);
console.log('Server running on port 8080. Now open http://localhost:8080/ in your browser!');
