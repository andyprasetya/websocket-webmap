# websocket-webmap
## A Quick-and-(still)-dirty WebSocket ([RFC 6455](https://tools.ietf.org/html/rfc6455)) protocol implementation in GeoJSON-push webmap.
This repo is an implementation of WebSocket in a webmap which is visualising the USGS (and InaSAFE - see code) earthquake data.

The server-side packages are [Express](https://expressjs.com), [moment](http://momentjs.com/), [path](https://github.com/jinder/path), [Pug](https://pugjs.org/), [ws](https://github.com/websockets/ws) and [xmlhttprequest](https://github.com/driverdan/node-XMLHttpRequest).

On the client-side, it uses [Leaflet](http://leafletjs.com/), [Leaflet-GroupedLayerControl](https://github.com/ismyrnow/leaflet-groupedlayercontrol), [Leaflet.EasyButton](https://github.com/CliffCloud/Leaflet.EasyButton), mapshakers' [Leaflet-Pulse-Icon](https://github.com/mapshakers/leaflet-icon-pulse), [Leaflet-Hash](https://github.com/mlevans/leaflet-hash) and the awesome [Font Awesome](https://github.com/FortAwesome/Font-Awesome).

Well, I think it's just a small step to fully understand the-right-way of WebSocket, and there are still a lot of challenges to beat for a better and efficient application architecture.
