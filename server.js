
var server

//Requirements
const express = require('express')
const bodyParser = require('body-parser')
const expressip = require('express-ip')
const path = require('path')
const https = require('https')
const fs = require('fs')

const app = express()
const redirectServer = express()
const port = 443

var lastTopic

//SSL Keys
var privateKey = fs.readFileSync('demo.key', 'utf8')
var certificate = fs.readFileSync('demo.cert', 'utf8')
//Apply the SSL
var credentials = {
	key: privateKey,
	cert: certificate
}

//Set up the app engine
app.engine('.html', require('ejs').__express)
app.set('view engine', 'html')
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, "/Client")))
app.use(expressip().getIpInfoMiddleware)

//Start listening on https

server = https.createServer(credentials, app)
server.listen(port, function () {
	console.log("Listening to port " + port)
})

//Set up http->https redirect server

redirectServer.get('*', function (req, res) {
	res.redirect('https://' + req.headers.host + req.url)
})

redirectServer.listen(80, function () {
	console.log("Listening on port 80 (http) to redirect to 443 (https)")
})

app.get('/', function (req, res) {
	res.render(path.join(__dirname, '/Client', '/home.html'))
})

app.get('/info', function (req, res) {
	res.render(path.join(__dirname, '/Client', '/info.html'))
})

//TCP Chat server setup
var users = []
const io = require('socket.io')(server, {
	// below are engine.IO options
	pingInterval: 1000,
	pingTimeout: 3000,
	cookie: false
});

//New conenction
io.on('connection', function (socket) {
	//Handle disconnect
	socket.on('disconnect', function () {
		if (io.sockets.connected[socket.partner] != null)
		{
			io.sockets.connected[socket.partner].emit("partnerLeft", "The other person left.")
			io.sockets.connected[socket.partner].disconnect(true)
		} else
		{
			var i = 0
			users.forEach(user => {
				if (user.id === socket.id)
				{
					return
				}
				i++
			})
			users.splice(i, 1)
		}
	})

	socket.on('randomTopic', function (msg) {
		var randomTopic
		try
		{
			randomTopic = users[Math.floor(Math.random() * users.length)].topic
		} catch (e)
		{
			randomTopic = ''
		}
		socket.emit('randomTopic', randomTopic)
	})

	//User entered topic, find a partner or put on waiting
	socket.on('topic', function (topic) {
		if (topic.toString().length > 32)
		{
			return;
		}
		topic = topic.replace(/</g, "&lt;").replace(/>/g, "&gt;")
		lastTopic = topic
		var isNew = true
		topic = topic.toLowerCase()
		let namespace = null
		let ns = io.of(namespace || "/")
		for (var i = 0; i < users.length; i++)
		{
			if (users[i].topic === topic)
			{
				if (ns.connected[users[i].id] != null)
				{
					isNew = false
					//Found user with same topic, connecting them together
					socket.partner = users[i].id
					ns.connected[users[i].id].partner = socket.id
					socket.emit("found", "")
					io.to(users[i].id).emit("found", "")
					users.splice(i, 1)
					break
				} else
				{
					users.splice(i, 1)
					i--
				}
			}
		}
		//A new topic has been added to the list
		if (isNew)
		{
			var usr = {
				"topic": topic,
				"ip": socket.handshake.address,
				"id": socket.id
			}
			users.push(usr)
		}
	})

	socket.on('msg', function (msg) {
		msg = msg.replace(/</g, "&lt;").replace(/>/g, "&gt;")
		io.to(socket.partner).emit("msg", msg)
	})

	socket.on('typing', function (msg) {
		io.to(socket.partner).emit("typing", msg)
	})

	socket.on('stats', function (msg) {
		var statsJSON = {}
		statsJSON["usersWaiting"] = users.length
		statsJSON["lastTopic"] = lastTopic
		socket.emit('stats', JSON.stringify(statsJSON))
	})
})

//Clean up disconnected users every 10 seconds
setInterval(function () {
	var cnt = 0
	for (var i = 0; i < users.length; i++)
	{
		if (io.sockets.connected[users[i].id] == null)
		{
			if (io.sockets.connected[users[i].partner] != null)
			{
				io.sockets.connected[socket.partner].emit("partnerLeft", "The other person left.")
				io.sockets.connected[socket.partner].disconnect(true)
			}
			users.splice(i, 1)
			i--
			cnt++
		}
	}
	if (cnt > 0)
	{
		console.log("Cleaned up: " + cnt)
	}
}, 10 * 1000)


/*
  Set up user input for server
*/

// Get process.stdin as the standard input object.
var standard_input = process.stdin

// Set input character encoding.
standard_input.setEncoding('utf-8')

// When user input data and click enter key.
standard_input.on('data', function (data) {
	console.log("Waiting users:")
	console.log(users)
})