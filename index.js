const SocketServer = require('ws').Server;
var express = require('express');
var app = express();
var path = require('path');
var moment = require('moment');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xhr = new XMLHttpRequest();
var dataurl,startdate,enddate;
var connectedUsers = [];

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.static(path.join(__dirname, 'public')));

var index = require('./routes/index');

app.use('/', index);
app.use('/realtime', index);
app.use('/latest-*', index);

app.use("*",function(req, res, next){
	res.status(404).json({"status" : "404"});
	next();
});

var server = app.listen(3000, function() {
	console.log("webmap sedang berjalan di localhost, port 3000");
});

function terminated() {}

function connectionIsAlive() {
	this.isAlive = true;
}

const websocketserver = new SocketServer({ server });

websocketserver.on('connection', function connection(websocket) {
	var intervalrequest;
	websocket.isAlive = true;
	websocket.on('pong', connectionIsAlive);
    console.log("connection ...");
    websocket.on('message', function incoming(message) {
		console.log('received: %s', message);
		setInterval(function(){
			startdate = moment.utc().subtract(24,"hours").format("YYYY-MM-DD");
			enddate = moment.utc().format("YYYY-MM-DD");
			dataurl = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime="+startdate+"&endtime="+enddate+"&minmagnitude=1";
			xhr.onreadystatechange = function() {
				if (this.readyState == 4 && this.status == 200) {
					var data = this.responseText;
					//websocket.send(data);
					//console.log(data);
					if (websocket.readyState !== websocket.OPEN) {
						websocket.terminate();
					} else {
						websocket.send(data);
					}
				}
			};
			xhr.open('GET', dataurl);
			xhr.send();
		},10*1000);
		connectedUsers.push(message);
    });
});

const interval = setInterval(function ping() {
	websocketserver.clients.forEach(function each(websocket) {
		if (websocket.isAlive === false) {
			return websocket.terminate();
		}
		websocket.isAlive = false;
		websocket.ping(terminated);
	});
}, 30*1000);