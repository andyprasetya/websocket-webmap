var map,openStreetMap,esriWorldImageryMap,zoomControl,attributionControl,scaleControl,layerControl,baseLayers,isCollapsed,
	earthquakeLayer,pulsingIcon1,pulsingIcon2,pulsingIcon3,mapHash,usgs_geojson_request,earthquakes,realTimeShift;
var bbox_minx = parseFloat(95), bbox_miny = parseFloat(-11), bbox_maxx = parseFloat(141), 
	bbox_maxy = parseFloat(7.5), centroidx = parseFloat(122), centroidy = parseFloat(-3), 
	mapminzoom = parseInt(3), mapmaxzoom = parseInt(17), mapinitzoom = parseInt(5);
openStreetMap = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {minZoom: mapminzoom, maxZoom: mapmaxzoom, attribution: 'OpenStreetMaps'});
esriWorldImageryMap = new L.TileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {minZoom: mapminzoom, maxZoom: mapmaxzoom, attribution: 'ESRI Imagery Map'});
earthquakeLayer = L.geoJson(null);
pulsingIcon1 = L.icon.pulse({iconSize:[10,10],color:'red'});
pulsingIcon2 = L.icon.pulse({iconSize:[15,15],color:'red'});
pulsingIcon3 = L.icon.pulse({iconSize:[20,20],color:'red'});
map = L.map('map', {zoom: parseInt(mapinitzoom), center: [parseFloat(centroidy), parseFloat(centroidx)], layers: [openStreetMap,earthquakeLayer], zoomControl: false, minZoom: mapminzoom, maxZoom: mapmaxzoom, zoomControl: false});
/* map.setMaxBounds([[parseFloat(bbox_miny), parseFloat(bbox_minx)], [parseFloat(bbox_maxy), parseFloat(bbox_maxx)]]); */
zoomControl = L.control.zoom({position: "topleft"}).addTo(map);
attributionControl = L.control({position: "bottomright"});
scaleControl = L.control.scale({position: "bottomleft", maxWidth: 200, metric: true, imperial: false, updateWhenIdle: false}).addTo(map);
baseLayers = {"OpenStreetMap": openStreetMap, "ESRI World Imagery": esriWorldImageryMap};
layerControl = L.control.groupedLayers(baseLayers, {collapsed: isCollapsed}).addTo(map);
if (document.body.clientWidth <= 767) {isCollapsed = true;} else {isCollapsed = false;}
mapHash = new L.Hash(map);
request_realtime_geojson_earthquake_usgs();
realTimeShift = L.easyButton('fa-toggle-on fa-lg text-primary', function (btn, map){window.open('./','_self');});
realTimeShift.addTo(map);
function request_realtime_geojson_earthquake_usgs () {
	var websocket = new WebSocket('ws://localhost:3000');
	websocket.onopen = function (event) {
		websocket.send('request_realtime_data');
	};
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