var express = require('express')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);
server.listen(8080);
const bodyParser= require('body-parser');
const mongo = require('mongodb').MongoClient;
app.use(bodyParser.urlencoded({extended: true}))
// routing
app.get('/', function (req, res) {
	rooms = ['General'];
	db.collection("rooms").find({}).	project({roomname:1, _id:0}).toArray(function(err, result) {
		if (err) throw err;
		console.log(result);
		for(i = 0; i<result.length; i++){
		console.log(result[i].roomname);
		rooms.push(result[i].roomname);
		}
	  });
	res.sendfile(__dirname + '/index.html');
  });
app.get('/rooms', function (req, res) {
	res.sendfile(__dirname + '/rooms.html');
});
let chat;
var db;
mongo.connect('mongodb://127.0.0.1/mongogc', function(err, client){
    if(err){
        throw err;
	}
	 chat = client.db('mongogc').collection('chats');
	db = client.db('mongogc');
	app.listen(3000, () => {
		console.log('listening on 3000')
	  });
	console.log('MongoDB connected...');
});

app.post('/quotes', (req, res) => {
	db.collection('rooms').save(req.body, (err, result) => {
		if (err) return console.log(err)
		console.log('Room saved to database')
		res.redirect('/')
	  })
  });



// usernames which are currently connected to the chat
var usernames = {};

// rooms which are currently available in chat

var rooms = ['General'];

io.sockets.on('connection', function (socket) {
	
	// when the client emits 'adduser', this listens and executes
	socket.on('adduser', function(username){
		// store the username in the socket session for this client
		socket.username = username;
		// store the room name in the socket session for this client
		socket.room = 'General';
		// add the client's username to the global list
		usernames[username] = username;
		// send client to room 1
		socket.join('General');
		// echo to client they've connected
		socket.emit('updatechat', 'SERVER', 'you have connected to General');
		// echo to room 1 that a person has connected to their room
		socket.broadcast.to('General').emit('updatechat', 'SERVER', username + ' has connected to this room');
		chat.find({room: socket.room}).limit(100).sort({_id:1}).toArray(function(err, res){
			socket.emit('updaterooms', rooms, 'General',res);
		});
		
	});
	
	// when the client emits 'sendchat', this listens and executes
	socket.on('sendchat', function (data) {
		// we tell the client to execute 'updatechat' with 2 parameters
		chat.insert({name: socket.username, message: data, room: socket.room}, function(){
			console.log("Chat Recorded!");
		});
		io.sockets.in(socket.room).emit('updatechat', socket.username, data);
	});
	
	socket.on('switchRoom', function(newroom){
		socket.leave(socket.room);
		socket.join(newroom);
		socket.emit('updatechat', 'SERVER', 'you have connected to '+ newroom);
		// sent message to OLD room
		socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has left this room');
		// update socket session room title
		socket.room = newroom;
		socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username+' has joined this room');
		chat.find({room: socket.room}).limit(100).sort({_id:1}).toArray(function(err, res){
			socket.emit('updaterooms', rooms, newroom, res);
		});
		
	});
	

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){
		// remove the username from global usernames list
		delete usernames[socket.username];
		// update list of users in chat, client-side
		io.sockets.emit('updateusers', usernames);
		// echo globally that this client has left
		socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
		socket.leave(socket.room);
	});
});
