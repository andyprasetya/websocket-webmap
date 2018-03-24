const SocketServer = require('ws').Server;
const express = require('express');
const app = express();
const path = require('path');
const moment = require('moment');
var uuid = require('uuid');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
const xhr = new XMLHttpRequest();
var dataurl,startdate,enddate;
var connectedUsers = [];
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
var index = require('./routes/index');
app.use('/', index);
app.use('/latest-*', index);
app.use("*",function(req, res, next){
	res.status(404).json({"status" : "404"});
	next();
});
var server = app.listen(3000, function() {
	console.log("websocket-webmap is running at localhost, port 3000");
});
function terminated() {}
function connectionIsAlive() {
	this.isAlive = true;
}
const websocketserver = new SocketServer({ server });
websocketserver.on('connection', function connection(websocket) {
	var intervalrequest,stringified_geojson;
	websocket.id = uuid.v4();
	websocket.isAlive = true;
	websocket.on('pong', connectionIsAlive);
	console.log("a client [id:"+websocket.id+"] is connected...");
	websocket.on('message', function incoming(message) {
		console.log('A websocket data request is coming: %s \nBegin to process at '+new Date()+'', message);
		switch (message) {
			case 'request_websocket_data_usgs':
				intervalrequest = setInterval(function(){
					startdate = moment.utc().subtract(24,"hours").format("YYYY-MM-DD");
					enddate = moment.utc().format("YYYY-MM-DD");
					dataurl = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime="+startdate+"&endtime="+enddate+"&minmagnitude=1";
					xhr.onreadystatechange = function() {
						if (this.readyState == 4 && this.status == 200) {
							var data = this.responseText;
							if (websocket.readyState !== websocket.OPEN) {
								websocket.terminate();
							} else {
								websocket.send(data);
								console.log('Sending data to clientId: '+websocket.id+'...');
							}
						}
					};
					xhr.open('GET', dataurl);
					xhr.send();
				},10*1000);
				break;
			case 'request_websocket_data_inasafe':
				intervalrequest = setInterval(function(){
					startdate = moment.utc().subtract(24,"hours").format("YYYY-MM-DD");
					enddate = moment.utc().format("YYYY-MM-DD");
					dataurl = "http://realtime.inasafe.org/realtime/api/v1/earthquake/?format=json&min_depth=1&max_depth=1000&min_magnitude=1&max_magnitude=10&min_time="+startdate+"&max_time="+enddate+"";
					xhr.onreadystatechange = function() {
						if (this.readyState == 4 && this.status == 200) {
							var data = JSON.parse(this.responseText);
							var json_inasafe = data.results;
							var geojson = {};
							geojson['type'] = 'FeatureCollection';
							geojson['metadata'] = [];
							var metadata = {
								"count": data.count
							}
							geojson['metadata'].push(metadata);
							geojson['features'] = [];
							for (var chunk in json_inasafe) {
								var featureEntry = {
									"type": "Feature",
									"geometry": {
										"type": "Point",
										"coordinates": [parseFloat(json_inasafe[chunk].location.coordinates[0]), parseFloat(json_inasafe[chunk].location.coordinates[1])]
									},
									"properties": {
										"mag": json_inasafe[chunk].magnitude,
										"place": json_inasafe[chunk].location_description
									}
								}
								geojson['features'].push(featureEntry);
							}
							stringified_geojson = JSON.stringify(geojson);
							if (websocket.readyState !== websocket.OPEN) {
								websocket.terminate();
							} else {
								websocket.send(stringified_geojson);
							}
						}
					};
					xhr.open('GET', dataurl);
					xhr.send();
				},10*1000);
				break;
			case 'request_terminate_websocket':
				websocketserver.clients.forEach(function each(websocket) {
					if (websocket.isAlive === true) {
						return websocket.terminate();
					}
					websocket.isAlive = false;
				});
				break;
			default:
				console.log('default::undefined');
				break;
		}
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
