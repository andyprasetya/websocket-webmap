var map,openTopoMap,openStreetMap,esriWorldImageryMap,zoomControl,attributionControl,scaleControl,layerControl,baseLayers,isCollapsed,
	earthquakeLayer,pulsingIcon1,pulsingIcon2,pulsingIcon3,mapHash,gridxy,geofongfz_geojson_request,usgs_geojson_request,inasafe_geojson_request,
	earthquakes,websocket,webSocketShifter;
var bbox_minx = parseFloat(95), bbox_miny = parseFloat(-11), bbox_maxx = parseFloat(141), bbox_maxy = parseFloat(7.5), 
	centroidx = parseFloat(122), centroidy = parseFloat(-3), mapminzoom = parseInt(3), mapmaxzoom = parseInt(17), mapinitzoom = parseInt(5);
openTopoMap = new L.TileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	minZoom: mapminzoom, 
	maxZoom: mapmaxzoom, 
	attribution: 'Map data: &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});
openStreetMap = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	minZoom: mapminzoom, 
	maxZoom: mapmaxzoom, 
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});
esriWorldImageryMap = new L.TileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	minZoom: mapminzoom, 
	maxZoom: mapmaxzoom, 
	attribution: 'ESRI Imagery Map'
});
earthquakeLayer = L.geoJson(null);
pulsingIcon1 = L.icon.pulse({ iconSize:[10,10], color:'red' });
pulsingIcon2 = L.icon.pulse({ iconSize:[15,15], color:'red' });
pulsingIcon3 = L.icon.pulse({ iconSize:[20,20], color:'red' });
map = L.map('map', {
	zoom: parseInt(mapinitzoom), center: [parseFloat(centroidy), parseFloat(centroidx)], layers: [openTopoMap,earthquakeLayer],
	zoomControl: false, minZoom: mapminzoom, maxZoom: mapmaxzoom, zoomControl: false});
/* uncomment line below to set map's max bbox */
/* map.setMaxBounds([[parseFloat(bbox_miny), parseFloat(bbox_minx)], [parseFloat(bbox_maxy), parseFloat(bbox_maxx)]]); */
zoomControl = L.control.zoom({position: "topleft"}).addTo(map);
attributionControl = L.control({ position: "bottomright" });
scaleControl = L.control.scale({ position: "bottomleft", maxWidth: 200, metric: true, imperial: false, updateWhenIdle: false }).addTo(map);
baseLayers = { "OpenTopoMap": openTopoMap, "OpenStreetMap": openStreetMap, "ESRI World Imagery": esriWorldImageryMap };
layerControl = L.control.groupedLayers(baseLayers, { collapsed: isCollapsed }).addTo(map);
gridxy = new L.Grid().addTo(map);
if (document.body.clientWidth <= 767) {
	isCollapsed = true;
} else {
	isCollapsed = false;
}
mapHash = new L.Hash(map);
/* request_geojson_earthquake_geofongfz(); */
request_geojson_earthquake_usgs();
/* request_geojson_earthquake_inasafe(); */
websocket = new WebSocket('ws://localhost:3000');
webSocketShifter = L.easyButton({
	states: [{
		stateName: 'shift-to-websocket',
		icon: 'fa-toggle-off fa-lg text-default',
		title: 'Shift to websocket',
		onClick: function(btn, map) {
			earthquakeLayer.clearLayers();
			/* request_websocket_geojson_earthquake_geofongfz(websocket); */
			request_websocket_geojson_earthquake_usgs(websocket);
			/* request_websocket_geojson_earthquake_inasafe(websocket); */
			console.log('Shift to websocket...');
			btn.state('shift-to-onetime');
	}
	}, {
		stateName: 'shift-to-onetime',
		icon: 'fa-toggle-on fa-lg text-primary',
		title: 'Turn-off websocket',
		onClick: function(btn, map) {
			_send_websocket_termination(websocket);
			earthquakeLayer.clearLayers();
			/* request_geojson_earthquake_geofongfz(); */
			request_geojson_earthquake_usgs();
			/* request_geojson_earthquake_inasafe(); */
			console.log('Turn-off websocket, request one-time data...');
			btn.state('shift-to-websocket');
	}
	}]
});
webSocketShifter.addTo(map);
function request_geojson_earthquake_geofongfz () {
	geofongfz_geojson_request = new XMLHttpRequest();
	geofongfz_geojson_request.open('GET', './latest-geofongfz', true);
	geofongfz_geojson_request.onreadystatechange = function() {
		if(geofongfz_geojson_request.readyState === 4) {
			if(geofongfz_geojson_request.status === 200) {
				var data = JSON.parse(this.responseText);
				earthquakes = L.geoJson(null, {
					pointToLayer: function (feature, latlng) {
						if (parseFloat(feature.properties.mag)<=2.5) {
							return L.marker(latlng, {icon: pulsingIcon1});
						} else if (parseFloat(feature.properties.mag)>2.5 && parseFloat(feature.properties.mag)<=4.0) {
							return L.marker(latlng, {icon: pulsingIcon2});
						} else {
							return L.marker(latlng, {icon: pulsingIcon3});
						}
					}
				});
				earthquakes.addData(data);
				earthquakeLayer.addLayer(earthquakes);
			} else {
				earthquakeLayer.clearLayers();
				alert('Local GeoJSON fails.');
			}
		}
	}
	geofongfz_geojson_request.send();
}
function request_geojson_earthquake_usgs () {
	usgs_geojson_request = new XMLHttpRequest();
	usgs_geojson_request.open('GET', './latest-usgs', true);
	usgs_geojson_request.onreadystatechange = function() {
		if(usgs_geojson_request.readyState === 4) {
			if(usgs_geojson_request.status === 200) {
				var data = JSON.parse(this.responseText);
				earthquakes = L.geoJson(null, {
					pointToLayer: function (feature, latlng) {
						if (parseFloat(feature.properties.mag)<=2.5) {
							return L.marker(latlng, {icon: pulsingIcon1});
						} else if (parseFloat(feature.properties.mag)>2.5 && parseFloat(feature.properties.mag)<=4.0) {
							return L.marker(latlng, {icon: pulsingIcon2});
						} else {
							return L.marker(latlng, {icon: pulsingIcon3});
						}
					}
				});
				earthquakes.addData(data);
				earthquakeLayer.addLayer(earthquakes);
			} else {
				earthquakeLayer.clearLayers();
				alert('Local GeoJSON fails.');
			}
		}
	}
	usgs_geojson_request.send();
}
function request_geojson_earthquake_inasafe () {
	inasafe_geojson_request = new XMLHttpRequest();
	inasafe_geojson_request.open('GET', './latest-inasafe', true);
	inasafe_geojson_request.onreadystatechange = function() {
		if(inasafe_geojson_request.readyState === 4) {
			if(inasafe_geojson_request.status === 200) {
				var data = JSON.parse(this.responseText);
				earthquakes = L.geoJson(null, {
					pointToLayer: function (feature, latlng) {
						if (parseFloat(feature.properties.mag)<=2.5) {
							return L.marker(latlng, {icon: pulsingIcon1});
						} else if (parseFloat(feature.properties.mag)>2.5 && parseFloat(feature.properties.mag)<=4.0) {
							return L.marker(latlng, {icon: pulsingIcon2});
						} else {
							return L.marker(latlng, {icon: pulsingIcon3});
						}
					}
				});
				earthquakes.addData(data);
				earthquakeLayer.addLayer(earthquakes);
			} else {
				earthquakeLayer.clearLayers();
				alert('Local GeoJSON fails.');
			}
		}
	}
	inasafe_geojson_request.send();
}
function request_websocket_geojson_earthquake_geofongfz (websocket) {
	if (websocket.readyState === websocket.OPEN) {
		websocket.send('request_websocket_data_geofongfz');
	} else {
		websocket = null;
		websocket = new WebSocket('ws://localhost:3000');
		websocket.onopen = function (event) {
			websocket.send('request_websocket_data_geofongfz');
		};
	}
	websocket.onmessage = function (event) {
		earthquakeLayer.clearLayers();
		var data = JSON.parse(event.data);
		earthquakes = L.geoJson(null, {
			pointToLayer: function (feature, latlng) {
				if (parseFloat(feature.properties.mag)<=2.5) {
					return L.marker(latlng, {icon: pulsingIcon1});
				} else if (parseFloat(feature.properties.mag)>2.5 && parseFloat(feature.properties.mag)<=4.0) {
					return L.marker(latlng, {icon: pulsingIcon2});
				} else {
					return L.marker(latlng, {icon: pulsingIcon3});
				}
			}
		});
		earthquakes.addData(data);
		earthquakeLayer.addLayer(earthquakes);
	};
}
function request_websocket_geojson_earthquake_usgs (websocket) {
	if (websocket.readyState === websocket.OPEN) {
		websocket.send('request_websocket_data_usgs');
	} else {
		websocket = null;
		websocket = new WebSocket('ws://localhost:3000');
		websocket.onopen = function (event) {
			websocket.send('request_websocket_data_usgs');
		};
	}
	websocket.onmessage = function (event) {
		earthquakeLayer.clearLayers();
		var data = JSON.parse(event.data);
		earthquakes = L.geoJson(null, {
			pointToLayer: function (feature, latlng) {
				if (parseFloat(feature.properties.mag)<=2.5) {
					return L.marker(latlng, {icon: pulsingIcon1});
				} else if (parseFloat(feature.properties.mag)>2.5 && parseFloat(feature.properties.mag)<=4.0) {
					return L.marker(latlng, {icon: pulsingIcon2});
				} else {
					return L.marker(latlng, {icon: pulsingIcon3});
				}
			}
		});
		earthquakes.addData(data);
		earthquakeLayer.addLayer(earthquakes);
	};
}
function request_websocket_geojson_earthquake_inasafe (websocket) {
	if (websocket.readyState === websocket.OPEN) {
		websocket.send('request_websocket_data_inasafe');
	} else {
		websocket = null;
		websocket = new WebSocket('ws://localhost:3000');
		websocket.onopen = function (event) {
			websocket.send('request_websocket_data_inasafe');
		};
	}
	websocket.onmessage = function (event) {
		earthquakeLayer.clearLayers();
		var data = JSON.parse(event.data);
		earthquakes = L.geoJson(null, {
			pointToLayer: function (feature, latlng) {
				if (parseFloat(feature.properties.mag)<=2.5) {
					return L.marker(latlng, {icon: pulsingIcon1});
				} else if (parseFloat(feature.properties.mag)>2.5 && parseFloat(feature.properties.mag)<=4.0) {
					return L.marker(latlng, {icon: pulsingIcon2});
				} else {
					return L.marker(latlng, {icon: pulsingIcon3});
				}
			}
		});
		earthquakes.addData(data);
		earthquakeLayer.addLayer(earthquakes);
	};
}
function _send_websocket_termination (websocket) {
	if (websocket.readyState === websocket.OPEN) {
		websocket.send('request_terminate_websocket');
	} else {
		websocket = null;
		return false;
	}
}
