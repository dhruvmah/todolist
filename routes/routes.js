var db = require('../models/simpleDB.js');
var SHA3 = require("crypto-js/sha3");
var async = require('async');

var getMain = function(req, res) {
	if(req.session.logged == true){
		res.redirect("/home/" + req.session.username);
	} else {
  res.render('main.ejs', {error: null});
	}
};

//displays sign up page	
var signUp = function(req, res) {
	if(req.session.logged == true){
		res.redirect("/home/" + req.session.username);
	} else {
		res.render('signup.ejs', {error: null});
	};
}
//after login button is clicked
var checkLogin = function(req, res) {
	var email = req.body.email;
	var password = SHA3(req.body.password).toString();
	if (email === "" || password === "") {
		res.render('main.ejs', {error: 1});
	} else {
	db.getID(email, function(err, user_id){
		if(err){
		    res.render('main.ejs', {error: err.value});
		} else {
			db.loginUser(user_id.Attributes[0].Value, password, function(err, data){
				if(err){
					res.render('main.ejs', {error:err.value});
				} else {
					if (data.logged_in === true) {
						req.session.logged =true; 
						req.session.username = user_id.Attributes[0].Value;
						db.toggleOnline(req.session.username, 'yes', function(err, data) {
							if (err) {
								res.send(err);
							} else {
								res.redirect("/home/" + req.session.username);
								//res.send({id: req.session.username});
							}
						});
					} else {
						res.render('main.ejs', {error: 1});
					}
				}
			});
		}
	});
	}
};

//after create account button is pressed
var createAccount = function(req, res) {
	if(req.session.logged){
		res.redirect('/home');
	}
	var email = req.body.email;
	var password1 = SHA3(req.body.password1).toString();
	var password2 = SHA3(req.body.password2).toString();
	var first_name = req.body.first_name;
	var last_name = req.body.last_name;
	var school = req.body.school;
	var birthday = req.body.birthday;
	var gender = req.body.gender;
	var interests = req.body.interests;
	var image = req.body.image;
	if (email === "" || password1 === "" || password2 === ""
			|| first_name === "" || last_name === "" || school === "" || interests === "") {
		res.render("signup.ejs", {error : 1});
	} else if (password1 != password2) {
		res.render("signup.ejs", {error : 2});
	} else {
		db.createAccount(email, password1, first_name, last_name, school, birthday, gender, interests, image, function(err, data) {
			if (err) {
				res.render("signup.ejs", {error : err.value});
			} else {
				req.session.logged = true;
				req.session.username = data;
				db.toggleOnline(data, 'yes', function(err, data) {
					if (err) {
						res.send(err);
					} else {
						res.redirect("/home/" + req.session.username);
					}
				});
			}
		});
	}
};

//gets profile information
var getProfile = function(req, res){
	var id = req.params.id;
	db.getProfile(id, function(err, data) {
		if (err) {
			console.log(err);
			res.render("error.ejs");
		} else if (data) {
				profile = {};
				for( j=0; j<data.length; j++) {
					if(data[j].Name == "email") {
						var email = data[j].Value;
					} else if(data[j].Name=="network") {
						var network = data[j].Value;
					} else if(data[j].Name=="birthday") {
						var birthday = data[j].Value;						
					} else if(data[j].Name=="first_name") {
						var firstName = data[j].Value;
					} else if(data[j].Name=="last_name") {
						var lastName = data[j].Value;
					} else if(data[j].Name=="gender") {
						var gender = data[j].Value;
					} else if(data[j].Name=="interests") {
						var interests = data[j].Value;
					} else if(data[j].Name=="image") {
						var image = data[j].Value;
					}
				}
				profile.firstName = firstName;
				profile.lastName = lastName;
				profile.birthday = birthday;
				profile.network = network;
				profile.email = email;
				profile.id = id;
				profile.gender = gender;
				profile.interests = interests;
				profile.image = image;
				res.render("profile.ejs", {profile : profile});
		}
	});
}

//sets posts (ie. statuses or wall posts)
var sendMessage = function(req, res) {
	
	if(req.session.username === req.body.target) {
		var type = "1";
	} else {
		var type = "2";
	}
	//1 = status
	//2 = wall post
	//3 = private message
	
	//only difference between them is the creator and privacy
	
	var content = String(req.body.content);
	var creator = String(req.session.username);
	var target = String(target);
	var timeStamp = String(new Date() / 1000);
	var pvt = req.body.pvt;
	if(type === "1") {
		var target = String(req.session.username);
	} else if (type === "2"){
		var target = req.body.target;
	} 
	if (content === "") {
		res.send("error");
	}  else {
		db.sendMessage(content, creator, target, pvt, timeStamp, function(err, data) {
			if (err) {
				res.send("error");
			} else {
				res.send("success!");
			}
		});
	}
};

//posts comment on a post
var postComment = function(req, res) {
	var content = String(req.body.content);
	var tag = String(req.body.tag);
	var creator = String(req.session.username);
	var timeStamp = String(new Date() / 1000);
	if (content === "") {
		res.send("error");
	}  else {
		db.postComment(content, creator, tag, timeStamp, function(err, data) {
			if (err) {
				res.send("error");
			} else {
				res.send("success!");
			}
		});
	}
};


//TODO: loadHome - fetches all statuses, posts and friendships made of friends
var loadHome = function(req, res){
	var id = req.params.id;
	var friend_ids = [];
	friend_ids.push(req.session.username);
	var messages = []
	 async.series([
        //Load user to get userId first
        function(callback) {
            db.getFriends(id, function(err, data) {
                if (err){ return callback(err)
                }
                //Check that a user was found
                else if (data[0] != undefined) {
                	for(var i=0; i<data[0].length; i++){
						friend_ids.push(data[0][i].Attributes[0].Value);
	             	} 
	             }
                callback();
            	
            
            });
        },
        //Load posts (won't be called before task 1's "task callback" has been called)
        function(callback) {
        		loadFriendshipPostings(friend_ids, function(err, data){
        			if(err) return callback(err);
        			for(var i=0; i<data.length; i++){
						 messages.push(data[i]);
        			}
        			callback(); 
        		})
        },
        function(callback) {
        		loadPostsWithUserIds(friend_ids, function(err, data){
        			if(err) return callback(err);
        			for(var i=0; i<data.length; i++){
						 messages.push(data[i]);
        			}
        			callback(); 
        		})
        }

    ], function(err) { //This function gets called after the two tasks have called their "task callbacks"
        messages.sort(function(a,b) {
        	return b.timeStamp-a.timeStamp
        });
        res.send(JSON.stringify(messages));
   	});
};

function loadPostsWithUserIds(friend_ids, callback) {
    var posts = []
	async.forEach(friend_ids, function(friend_id, callback) {
            db.loadAllPosts(friend_id, function(err, data){
            	if(data) {
            		if(data.Items != undefined){
						for(var i = 0; i<data.Items.length; i++) {
							    var nextPost = {};
								for(var j=0; j<data.Items[i].Attributes.length; j++){
								 	if(data.Items[i].Attributes[j].Name == "content") {
										var content = data.Items[i].Attributes[j].Value;
									} else if(data.Items[i].Attributes[j].Name=="comment_tag") {
										var comment_tag = data.Items[i].Attributes[j].Value;
									} else if(data.Items[i].Attributes[j].Name=="creator") {
										var creator = data.Items[i].Attributes[j].Value;
									} else if(data.Items[i].Attributes[j].Name=="target") {
										var target = data.Items[i].Attributes[j].Value;
									} else if(data.Items[i].Attributes[j].Name=="timeStamp") {
										var timeStamp = data.Items[i].Attributes[j].Value;
									}
								}
								nextPost.content = content;
								nextPost.comment_tag=comment_tag;
								nextPost.creator=creator;
								nextPost.timeStamp = timeStamp;
								nextPost.target = target;
								posts.push(nextPost);
	                    }
	            	}
            	} 
            	callback();
            });
        }, function(err) {
            if (err) return callback(err);
            callback(null, posts);
        });
};



function loadFriendshipPostings(friend_ids, callback) {
    var friendships = []
	async.forEach(friend_ids, function(friend_id, callback) {
            db.loadFriendShipPostings(friend_id, function(err, data){
            	if(data) {
            		friendShip = {};
            		if(data.Items != undefined){
						for(var i = 0; i<data.Items.length; i++) {
								for(var j=0; j<data.Items[i].Attributes.length; j++){
								 	if(data.Items[i].Attributes[j].Name == "f1") {
										var f1 = data.Items[i].Attributes[j].Value;
									} else if(data.Items[i].Attributes[j].Name=="f2") {
										var f2 = data.Items[i].Attributes[j].Value;
									} else if(data.Items[i].Attributes[j].Name=="timeStamp") {
										var timeStamp = data.Items[i].Attributes[j].Value;
									}
								}
								if(parseInt(f1) > parseInt(f2)) {
									friendShip.f1 = f1;
									friendShip.f2 = f2;
								} else {
									friendShip.f2 = f1;
									friendShip.f1 = f2;
								}
								friendShip.timeStamp = timeStamp; 
								friendships.push(friendShip);
	                    }
	            	}
            	} 
            	callback();
            });
        }, function(err) {
            if (err) return callback(err);
            callback(null, friendships);
        });
};





//fetches wall posts for a profile page
var loadWall = function(req, res) {
	var id = req.params.id;
	db.loadWall(id, function(err, data){
		if(err){
			res.send("error on restaurants");
		} else if(data.Items != undefined) {
			posts = [];
			if(data.Items != undefined){
			for(i=0; i<data.Items.length; i++){
				nextPost = new Object();
				var name = data.Items[i].Name;
				for( j=0; j<data.Items[i].Attributes.length; j++) {
					if(data.Items[i].Attributes[j].Name == "content") {
						var content = data.Items[i].Attributes[j].Value;
					} else if(data.Items[i].Attributes[j].Name=="timeStamp") {
						var timeStamp = data.Items[i].Attributes[j].Value;
					} else if(data.Items[i].Attributes[j].Name=="like_count") {
						var like_count = data.Items[i].Attributes[j].Value;						
					} else if(data.Items[i].Attributes[j].Name=="creator") {
						var creator = data.Items[i].Attributes[j].Value;
					} else if(data.Items[i].Attributes[j].Name=="comment_tag") {
						var comment_tag = data.Items[i].Attributes[j].Value;
					} else if(data.Items[i].Attributes[j].Name=="target") {
						var target = data.Items[i].Attributes[j].Value;
					}
				}

				nextPost.content = content;
				nextPost.timeStamp = timeStamp;
				nextPost.like_count = like_count;
				nextPost.comment_tag = comment_tag;
				nextPost.creator = creator;
				nextPost.target = target;
				posts.push(nextPost);
				}
			res.send(JSON.stringify(posts));			
		}
	}
	});
};

var addFriend = function(req, res){
	var friendTwo = req.params.id;
	var friendOne = req.session.username;
	var timeStamp = String(new Date() / 1000);
	db.addFriend(friendOne, friendTwo, timeStamp, function(err, data){
		if(err) {
			res.send("error can't add");	
		} else if(data) {
			res.send("confirmed");
		}	
	});
};


var deleteFriend = function(req, res){
	var friendTwo = req.params.id;
	var friendOne = req.session.username;
	db.deleteFriend(friendOne, friendTwo, function(err, data){
		if(err) {
			res.send("error can't deleted");	
		} else if(data) {
			res.send("deleted");
		}	
	});
};

var checkFriend = function(req, res) {
	
	var friendOne = req.session.username;
	var friendTwo = req.params.id;
	db.checkFriend(friendOne,friendTwo, function(err, data){
		if(err) {
			res.send("error");
		} else if(data.Items === undefined){
			res.send(false)
		} else {
			res.send(true);
		}
	});
};

//fetches comments
var loadComment = function(req, res) {
	var id = req.params.id;
	db.loadComment(id, function(err, data){
		if(err){
			res.send("error on restaurants");
		} else if(data) {
			comments = [];
			if(data.Items !== undefined) {
				for(i=0; i<data.Items.length; i++){
					nextComment = new Object();
					var name = data.Items[i].Name;
					for( j=0; j<data.Items[i].Attributes.length; j++) {
						if(data.Items[i].Attributes[j].Name == "content") {
							var content = data.Items[i].Attributes[j].Value;
						} else if(data.Items[i].Attributes[j].Name=="timeStamp") {
							var timeStamp = data.Items[i].Attributes[j].Value;
						} else if(data.Items[i].Attributes[j].Name=="like_count") {
							var like_count = data.Items[i].Attributes[j].Value;						
						} else if(data.Items[i].Attributes[j].Name=="creator") {
							var creator = data.Items[i].Attributes[j].Value;
						} else if(data.Items[i].Attributes[j].Name=="post_tag") {
							var post_tag = data.Items[i].Attributes[j].Value;
						}
					}
					nextComment.content = content;
					nextComment.timeStamp = timeStamp;
					nextComment.like_count = like_count;
					nextComment.post_tag = post_tag;
					nextComment.creator = creator;
					comments.push(nextComment);
					}
			}
			res.send(JSON.stringify(comments));			
		}
	});
}; 

var searchSuggest = function(req, res) {
	var term = req.params.term;
	db.findUsers(term, function(err, data) {
		if (err) {
			res.send("error during add");
		} else if (data.Items != undefined) {
			var arr = new Array();
			for (var i = 0; i < data.Items.length; i++) {
				arr[i] = data.Items[i].Name + ',' + data.Items[i].Attributes[0].Value + ',' + data.Items[i].Attributes[1].Value;
			}
			res.send('search.ejs', {error:null, elements:arr});
		} else {
			res.send('search.ejs', {error:null, elements:null});
		}
	})
}


//after logout button is pressed
var logout = function(req, res) {
	req.session.logged = false;
	var id = req.session.username;
	db.toggleOnline(id, 'no', function(err, data) {
		if (err) {
			res.send(err);
		} else {
			res.redirect('/');
		}
	});
};

var search = function(req, res) {
	res.render('search.ejs', {error:null});
}

var getHome = function(req, res) {
	res.render('homepage.ejs', {error:null});
}

var getHome2 = function(req, res) {
	res.redirect('/home/' + req.session.username);
}

var getOnline = function(req, res) {
	db.getOn(req.session.username, function(err, data) {
		if (err) {
			res.send(err);
		} else if (data.Items != undefined) {
			var j = 0;
			var returned = new Array();
			for (var i = 0; i < data.Items.length; i++) {
				console.log(data.Items[i].Name);
				var friendTwo = data.Items[i].Name;
				var friendOne = req.session.username;
				var isFriends = true; //change back to false
				var tmp = {};
				tmp.Value = i;
				//console.log("1: " + i);
				/*db.checkFriend(friendOne,friendTwo, function(err2, data2){
					if(err2) {
						console.log("1");
						res.send("error");
					} else if(data2.Items === undefined){
						console.log("2");
					} else {
						console.log("3");
						isFriends = true;
						console.log("2: " + tmp.Value);
					}
				}); */
				if (isFriends) {
					console.log(data.Items[i]);
					returned[j] = (data.Items[i]);
					j++;
				}
			}
			console.log("Returned: ");
			console.log(returned);
			res.send(returned);
		} else {
			res.send(null);
		}
	})
}

// to help with replacing user ids with first and last names
// didn't finish
var getName = function(req, res) {
	var id = req.session.username;
	db.getProfile(id, function (err, data) {
		if (err) {
			res.send(err);
		} else if (data.Items != undefined) {
			//do stuff
			console.log(data.Items);
		} else {
			res.send(null);
		}
	});
}

var getProfile2 = function(req, res) {
	res.send();
}

var getSuggest = function(req, res) {
	console.log("routes is getting suggestions");
	var id = req.session.username;
	console.log(id);
	db.get_friendrec(req.session.username, function(err, data) {
		if (err) {
			res.send(err);
		} else{
				console.log("in the routes we get back:");
				console.log(data);
				 if (data.Items != undefined) {
					console.log("suggestions in routes");
					console.log(data.Items);
					var j = 0;
					var returned = new Array();
					for (var i = 0; i < data.Items.length; i++) {
						var f = data.Items[i].Attributes[1].Value;
						returned[i] = (f);
					}
						
					console.log("Returned adsfadsf: ");
					console.log(typeof(returned));
					res.send(JSON.stringify(returned));
		} else {
			res.send(null);
			}
		}
	});
	}

var getVisual = function(req, res) {
	db.getvis (function (err, data) {
		if (err) {
			res.send(err);
		} else if (data.Items != undefined) {
			res.send("issues");
		} else {
			res.render('friendvisualizer.ejs');
		}
	});
}


var routes = { 
  get_main: getMain,
  check_login: checkLogin,
  create_account: createAccount,
  sign_up: signUp,
  logout: logout,
  get_profile:getProfile,
  send_message:sendMessage,
  load_wall: loadWall,
  load_home: loadHome,
  post_comment: postComment,
  load_comments:loadComment,
  add_friend: addFriend,
  check_friend: checkFriend,
  delete_friend: deleteFriend,
  search_help: searchSuggest,
  get_search: search,
  get_home: getHome,
  get_home2: getHome2,
  get_online: getOnline,
  get_name: getName,
  get_profile2: getProfile2,
  get_suggestions: getSuggest,
  visual: getVisual
};

module.exports = routes;
