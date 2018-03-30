var express = require('express');
var router = express.Router();
var moment = require('moment');
var uuid = require('uuid');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xhr = new XMLHttpRequest();
var dataurl,startdate,enddate;
router.get('/', function(req, res, next) {
  res.render('index', { title: 'MyWebmap' });
});
router.get('/latest-geofongfz', function(req, res, next) {
	dataurl = "http://geofon.gfz-potsdam.de/eqinfo/list.php?fmt=geojson";
	xhr.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			var data = JSON.parse(this.responseText);
			res.json(data);
		}
	};
	xhr.open('GET', dataurl);
	xhr.send();
});
router.get('/latest-usgs', function(req, res, next) {
	startdate = moment.utc().subtract(24,"hours").format("YYYY-MM-DD");
	enddate = moment.utc().format("YYYY-MM-DD");
	dataurl = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime="+startdate+"&endtime="+enddate+"&minmagnitude=1";
	xhr.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {
			var data = JSON.parse(this.responseText);
			res.json(data);
		}
	};
	xhr.open('GET', dataurl);
	xhr.send();
});
router.get('/latest-inasafe', function(req, res, next) {
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
			res.json(geojson);
		}
	};
	xhr.open('GET', dataurl);
	xhr.send();
});
module.exports = router;
