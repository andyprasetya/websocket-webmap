var map,openTopoMap,openStreetMap,esriWorldImageryMap,zoomControl,attributionControl,scaleControl,layerControl,baseLayers,isCollapsed,
	earthquakeLayer,pulsingIcon1,pulsingIcon2,pulsingIcon3,mapHash,gridxy,geofongfzbutton,usgsbutton,inasafebutton,earthquakes,websocket,
	webSocketShifter;
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
scaleControl = L.control.scale({ position: "bottomleft", maxWidth: 200, metric: true, imperial: true, updateWhenIdle: false }).addTo(map);
baseLayers = { "OpenTopoMap": openTopoMap, "OpenStreetMap": openStreetMap, "ESRI World Imagery": esriWorldImageryMap };
layerControl = L.control.groupedLayers(baseLayers, { collapsed: isCollapsed }).addTo(map);
gridxy = new L.Grid().addTo(map);
if (document.body.clientWidth <= 767) {
	isCollapsed = true;
} else {
	isCollapsed = false;
}
mapHash = new L.Hash(map);
geofongfzbutton = L.easyButton({
	states: [{
		stateName: 'geofongfz',
		icon: 'far fa-dot-circle fa-lg text-geofongfz',
		title: 'GEOFON GFZ',
		onClick: function(btn, map) {
			earthquakeLayer.clearLayers();
			document.getElementById('data-source').value = 'geofongfz';
			request_geojson_earthquake();
			console.log('Get GEOFON GFZ data...');
			btn.state('geofongfz');
	}}]
}).addTo(map);
usgsbutton = L.easyButton({
	states: [{
		stateName: 'usgs',
		icon: 'far fa-dot-circle fa-lg text-usgs',
		title: 'USGS',
		onClick: function(btn, map) {
			earthquakeLayer.clearLayers();
			document.getElementById('data-source').value = 'usgs';
			request_geojson_earthquake();
			console.log('Get USGS data...');
			btn.state('usgs');
	}}]
}).addTo(map);
inasafebutton = L.easyButton({
	states: [{
		stateName: 'inasafe',
		icon: 'far fa-dot-circle fa-lg text-inasafe',
		title: 'InaSAFE',
		onClick: function(btn, map) {
			earthquakeLayer.clearLayers();
			document.getElementById('data-source').value = 'inasafe';
			request_geojson_earthquake();
			console.log('Get InaSAFE data...');
			btn.state('inasafe');
	}}]
}).addTo(map);
request_geojson_earthquake();
websocket = new WebSocket('ws://localhost:3000');
webSocketShifter = L.easyButton({
	states: [{
		stateName: 'shift-to-websocket',
		icon: 'fa-toggle-off fa-lg',
		title: 'Shift to websocket',
		onClick: function(btn, map) {
			earthquakeLayer.clearLayers();
			request_websocket_geojson_earthquake(websocket);
			console.log('Shift to websocket...');
			btn.state('shift-to-onetime');
	}
	}, {
		stateName: 'shift-to-onetime',
		icon: 'fa-toggle-on fa-lg text-websocket',
		title: 'Turn-off websocket',
		onClick: function(btn, map) {
			_send_websocket_termination(websocket);
			earthquakeLayer.clearLayers();
			request_geojson_earthquake();
			console.log('Turn-off websocket, request one-time data...');
			btn.state('shift-to-websocket');
	}
	}]
});
webSocketShifter.addTo(map);
function request_geojson_earthquake () {
	var context = document.getElementById('data-source').value;
	var geojson_request = new XMLHttpRequest();
	geojson_request.open('GET', './latest-'+context+'', true);
	geojson_request.onreadystatechange = function() {
		if(geojson_request.readyState === 4) {
			if(geojson_request.status === 200) {
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
	geojson_request.send();
}
function request_websocket_geojson_earthquake (websocket) {
	var endpointdatasource = document.getElementById('data-source').value;
	if (websocket.readyState === websocket.OPEN) {
		websocket.send('request_websocket_data_'+endpointdatasource+'');
	} else {
		websocket = null;
		websocket = new WebSocket('ws://localhost:3000');
		websocket.onopen = function (event) {
			websocket.send('request_websocket_data_'+endpointdatasource+'');
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
