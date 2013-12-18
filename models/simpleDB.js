var AWS = require('aws-sdk');
AWS.config.loadFromPath('config.json');
var simpledb = new AWS.SimpleDB();

// creates a new account in the db
var myDB_createAccount = function(email, password, first_name, last_name, school, birthday, gender, interests, image, route_callbck){
	var error = {};
	simpledb.getAttributes({DomainName: 'emailID', ItemName: email}, function(err1, data1) {
		if (err1) { //no users were found
			route_callbck("Database add error: " + err1, null);
		} else if (data1.Attributes == undefined) {
			console.log("Err: " + err1);
			// add the user with the new userID
			var random_id = Math.floor(Math.random()*1000000000000000); // 10^15
			var random_string = random_id + "";
			simpledb.putAttributes({DomainName: 'users', ItemName: random_string, Attributes: [{'Name': 'email', 'Value': email},{'Name': 'password', 'Value': password}, {'Name': 'first_name', 'Value': first_name}, {'Name': 'last_name', 'Value': last_name}, {'Name': 'birthday', 'Value': birthday}, {'Name': 'network', 'Value': school}, {'Name': 'gender', 'Value': gender}, {'Name': 'interests', 'Value': interests}, {'Name': 'image', 'Value': image}]}, function(err2, data2) {
				if (err2) {
					route_callbck("Database add error: " + err2, null);
				} else {
					simpledb.putAttributes({DomainName: 'emailID', ItemName: email, Attributes: [{'Name': 'user_id', 'Value': random_string}]}, function(err3, data3) {
						if (err3) {
							route_callbck("Database add error: " + err3, null);
						} else {
							route_callbck(null, random_string);
						}
					});
				}
			});
		} else { // user exists
			error.value = 3;
			route_callbck(error, null);
		}
	});
};

//handles logging in
var myDB_login = function(user_id, password, route_callbck){
	var error = {};
	if(user_id === "" || password === "") {
		route_callbck({value:1}, null);
	} else {
	simpledb.getAttributes({DomainName:'users', ItemName: user_id}, function(err, data){
		if (err) {
			route_callbck(error, null);
		} else if (data.Attributes === undefined) {
			error.value=2;
			route_callbck(error,null);
		} else {
			var results = {};
			for(var i = 0; i<data.Attributes.length; i++) {
				if (data.Attributes[i].Name === "password"){
					var logged_in =  data.Attributes[i].Value === password;
					if(logged_in) {
						results.logged_in = (logged_in);	
						route_callbck(null, results);
					} else {
						error.value = 3;
						route_callbck(error, null);
					}
				}
			}
		}
	});
	}
};

//adds restaurant to the database
var myDB_sendMessage = function(content, creator, target, pvt, timeStamp, route_callbck){
	if(content === "" || creator  === "" || target === "" || pvt === "" || timeStamp === "") {
		//missing a parameter
		var results = {};
		results.added = false;
		route_callbck(null, results);
	} else {
		var message_id = Math.floor(Math.random()*1000000000000000);
		var comment_tag = Math.floor(Math.random()*1000000000000000);
		simpledb.putAttributes({DomainName:'messages', ItemName:(String(message_id)),
					Attributes:[{Name:"content", Value: content}, {Name:"creator", Value: creator},
					 {Name:"target", Value: target}
					,{Name:"like_count", Value: "0"}
					,{Name:"creator", Value: creator}
					,{Name:"timeStamp", Value: timeStamp}
					,{Name:"comment_tag", Value: String(comment_tag)}
					, {Name:"pvt", Value: pvt}]},
					function(err2, data2){
						if(err2) {
							console.log(err2);
							route_callbck(err2, null);
						} else if (data2) {
							results = {};
							results.added = true;
							route_callbck(null, results);
						} else route_callbck(null, null);
					});
			}
};

//adds restaurant to the database
var myDB_postComment = function(content, creator, tag, timeStamp, route_callbck){
	if(content === "" || creator  === "" || timeStamp === "" || tag === "") {
		//missing a parameter
		var results = {};
		results.added = false;
		route_callbck(null, results);
	} else {
		var comment_id = Math.floor(Math.random()*1000000000000000);
		simpledb.putAttributes({DomainName:'commentlist', ItemName:(String(comment_id)),
					Attributes:[{Name:"content", Value: content}, {Name:"creator", Value: creator}
					,{Name:"like_count", Value: "0"}
					,{Name:"timeStamp", Value: timeStamp}
					,{Name:"post_tag", Value: String(tag)}]},
					function(err2, data2){
						if(err2) {
							route_callbck(err2, null);
						} else if (data2) {
							results = {};
							results.added = true;
							route_callbck(null, results);
						} else route_callbck(null, null);
					});
			}
		};		
		
//This function gets a single user's profile info
var myDB_getProfile = function(id, route_callbck){
	//might need to do a string escape kind of thing in the select expression
	simpledb.select({SelectExpression: "select * from users where itemName() = \'" + String(id) + "\'"},
		  function (err, data) {
    if (err) {
    	route_callbck("Lookup error: "+err, null);
    } else {
    	route_callbck(null, data["Items"][0]["Attributes"]);     
    }
  });
};

var get_ID = function(email, route_callbck) {
	simpledb.getAttributes({DomainName:'emailID', ItemName:email}, function(err, data){
		if (err) {
			var err = {};
			err.value = 2;
			route_callbck(err, null);
		} else if (data.Attributes === undefined) {
			var err = {};
			err.value=2;
			route_callbck(err,null);
		} else {
			route_callbck(null, data);
		}
	});
};

//This function gets all the restaurants to display in the table
var myDB_loadPosts = function(id, route_callbck){
  simpledb.select({SelectExpression: "select * from messages where target = \'" + String(id) + "\'", ConsistentRead: true
	  }, function (err, data) {
    if (err) {
      route_callbck("Lookup error: "+err, null);
    } else {
      route_callbck(null, data);
    }
  });
};

var myDB_loadAllPosts = function(id, route_callbck){
  simpledb.select({SelectExpression: "select * from messages where target = \'" + String(id) + "\' or creator = \'" +
   String(id) + "\'", ConsistentRead: true
	  }, function (err, data) {
    if (err) {
      route_callbck("Lookup error: "+err, null);
    } else {
      route_callbck(null, data);
    }
  });
};

var myDB_loadComments = function(id, route_callbck){
	  simpledb.select({SelectExpression: "select * from commentlist where post_tag = \'" + String(id) + "\'", ConsistentRead: true
		  }, function (err, data) {
	    if (err) {
	      route_callbck("Lookup error: "+err, null);
	    } else {
	      route_callbck(null, data);
	    }
	  });
}


var myDB_getFriends = function(id, route_callbck){
	  var datas = []
	  simpledb.select({SelectExpression: "select f2 from friendships where f1 = \'" + String(id) + "\'"
	  	, ConsistentRead: true
		}, function (err, data) {
	    	if (err) {
	      		route_callbck("Lookup error: "+ err, null);
	    	} else if (data) {
	    		if(data.Items != undefined){
	    			datas.push(data.Items);
	    		}
	      		simpledb.select({SelectExpression: "select f1 from friendships where f2 = \'" + String(id) + "\'"
	  			, ConsistentRead: true
						}, function (err1, data1) {
	    					if (err1) {
					      		route_callbck("Lookup error: "+err, null);
					    	} else if (data1) {
					    		if(data1.Items != undefined){
	    							datas.push(data1.Items);
	    						}
					      		route_callbck(null, datas);
						    }
					  	});
				}
		});
	}


var myDB_getFriends2 = function(id, route_callbck){
	  simpledb.select({SelectExpression: "select * from friendships where f1 = \'" + String(id) + "\' or f2 = \'" + String(id) + "\'"
	  	, ConsistentRead: true
		}, function (err, data) {
	    	if (err) {
	      		route_callbck("Lookup error: "+ err, null);
	    	} else if (data) {
	    		route_callbck(null, data);
			}
		});
	}



var myDB_addFriend = function(friendOne, friendTwo, timeStamp, route_callbck){
	if(parseInt(friendOne) > parseInt(friendTwo)){
		var itemName = friendOne + "," + friendTwo;
		var f1 = friendOne;
		var f2 = friendTwo;
	} else {
		var itemName = friendTwo + "," + friendOne;
		var f1 = friendTwo;
		var f2 = friendOne;
	}
	simpledb.putAttributes({DomainName:'friendships', ItemName:(itemName),
		Attributes:[{Name:"f1", Value: f1}, {Name:"f2", Value: f2}, {Name: "timeStamp", Value: timeStamp}]},
		function(err, data){
			if(err) {
				console.log(err);
				route_callbck(err, null);
			} else if (data) {
					results = {};
					results.added = true;
					route_callbck(null, results);
			} else {
				route_callbck(null,null);
			}
	});
};

var myDB_deleteFriend = function(friendOne, friendTwo, route_callbck){
	if(parseInt(friendOne) > parseInt(friendTwo)){
		var itemName = friendOne + "," + friendTwo;
	} else {
		var itemName = friendTwo + "," + friendOne;
	}
	simpledb.deleteAttributes({DomainName:'friendships', ItemName:itemName},
		function(err, data){
			if(err) {
				console.log(err);
				route_callbck(err, null);
			} else if (data) {
				results = {};
				results.added = true;
				route_callbck(null, results);
			} else{
				route_callbck(null,null);
			}
	});
};

var myDB_checkFriendship = function(friendOne, friendTwo, route_callbck) {
	  simpledb.select({SelectExpression: "select * from friendships where itemName() = \'"
		  + friendOne + "," + friendTwo + "\'" + "OR itemName() = \'"
		  + friendTwo + "," + friendOne + "\'", ConsistentRead: true}, function(err, data) {
			  if(err){
					console.log(err);
					route_callbck(err, null);
			  } else if (data.size === 2) {	
				  		route_callbck(null, true);
					} else {
						route_callbck(null, data);
					}  
		});
};

var myDB_findUsers = function(term, route_callbck) {
	var query = "select first_name, last_name from users where first_name like '" + term + "%'";
	simpledb.select({SelectExpression: query, ConsistentRead: true}, function(err, data) {
		if (err) {
			console.log(err);
			route_callbck(err, null);
		} else if (data) {
			route_callbck(null, data);
		} else {
			route_callbck(null, null);
		}
	})
}

var myDB_toggle = function(id, bool, route_callbck) {
	if (bool === 'yes') var tog = 'no';
	else var tog = 'yes';
	simpledb.deleteAttributes({DomainName: 'users', ItemName: id, Attributes:[{'Name': 'online', 'Value': tog}]}, function(err, data) {
		if (err) {
			route_callbck(err, null);
		} else {
			simpledb.putAttributes({DomainName: 'users', ItemName: id, Attributes:[{'Name': 'online', 'Value': bool}]}, function(err2, data2) {
				if (err2) {
					route_callbck(err2, null);
				} else {
					route_callbck(null, null);
				}
			});
		}
	});
}


var myDB_online = function(id, route_callbck) {
	simpledb.select({SelectExpression: "select first_name, last_name from users where online='yes'", ConsistentRead: true}, function(err, data) {
		if (err) {
			route_callbck(err, null);
		} else if (data) {

			route_callbck(null, data);
		} else {
			route_callbck(null, null);
		}
	});
}

// returning correct thing
var myDB_friendrec = function (id, route_callbck) {
	console.log("in db we have: " + id);
	simpledb.select({SelectExpression: "select user, friend from recommendations where user='" + id + "' limit 5", ConsistentRead: true}, function (err, data) {
		if (err) {
			route_callbck(err, null);
		} else if (data) {
			route_callbck(null, data);
			console.log(data);
		} else {
			route_callbck(null, null);
		}
	});
}

// does not work
var myDB_vis = function (route_callbck) {
	//simpledb.select({SelectExpression: "select "})
	route_callbck(null, null);
}


/* We define an object with one field for each method. For instance, below we have
   a 'lookup' field, which is set to the myDB_lookup function. In routes.js, we can
   then invoke db.lookup(...), and that call will be routed to myDB_lookup(...). */

var database = {
  createAccount: myDB_createAccount, 
  loginUser: myDB_login,
  getID: get_ID,
  getProfile: myDB_getProfile,
  sendMessage: myDB_sendMessage,
  loadWall: myDB_loadPosts,
  postComment: myDB_postComment,
  loadComment: myDB_loadComments,
  createAccount: myDB_createAccount,
  addFriend: myDB_addFriend,
  checkFriend: myDB_checkFriendship,
  deleteFriend: myDB_deleteFriend,
  getFriends: myDB_getFriends,
  loadAllPosts: myDB_loadAllPosts,
  loadFriendShipPostings: myDB_getFriends2,
  findUsers: myDB_findUsers,
  toggleOnline: myDB_toggle,
  getOn: myDB_online,
  get_friendrec: myDB_friendrec,
  getvis: myDB_vis
};
                                        
module.exports = database;
                                        