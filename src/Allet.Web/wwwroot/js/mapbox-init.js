window.alletMap = {
    _maps: {},
    init: function (mapId, accessToken, markers) {
        if (typeof mapboxgl === 'undefined') return;
        mapboxgl.accessToken = accessToken;
        var center = [0, 20];
        var zoom = 2;
        if (markers && markers.length > 0) {
            center = [markers[0].lng, markers[0].lat];
            if (markers.length === 1) zoom = 8;
        }
        var map = new mapboxgl.Map({
            container: mapId,
            style: 'mapbox://styles/mapbox/light-v11',
            center: center,
            zoom: zoom
        });
        if (markers && markers.length > 1) {
            var bounds = new mapboxgl.LngLatBounds();
            markers.forEach(function (m) {
                bounds.extend([m.lng, m.lat]);
            });
            map.fitBounds(bounds, { padding: 40, maxZoom: 10 });
        }
        var markerEls = [];
        var markerObjs = [];
        markers.forEach(function (m, i) {
            var el = document.createElement('div');
            el.className = 'mapbox-marker';
            el.style.width = '12px';
            el.style.height = '12px';
            el.style.borderRadius = '50%';
            el.style.backgroundColor = '#4f46e5';
            el.style.border = '2px solid white';
            el.style.boxShadow = '0 1px 2px rgba(0,0,0,0.3)';
            el.style.transition = 'transform 0.15s, background-color 0.15s';
            var popup = m.label ? new mapboxgl.Popup({ offset: 12 }).setText(m.label) : null;
            var marker = new mapboxgl.Marker(el).setLngLat([m.lng, m.lat]).setPopup(popup).addTo(map);
            markerEls.push(el);
            markerObjs.push(marker);
        });
        this._maps[mapId] = { map: map, markerEls: markerEls, markerObjs: markerObjs };
    },
    highlight: function (mapId, index) {
        var entry = this._maps[mapId];
        if (!entry) return;
        var el = entry.markerEls[index];
        if (!el) return;
        el.style.transform = 'scale(2.2)';
        el.style.backgroundColor = '#f59e0b';
        el.style.zIndex = '10';
        var marker = entry.markerObjs[index];
        if (marker && marker.getPopup()) marker.togglePopup();
    },
    unhighlight: function (mapId, index) {
        var entry = this._maps[mapId];
        if (!entry) return;
        var el = entry.markerEls[index];
        if (!el) return;
        el.style.transform = '';
        el.style.backgroundColor = '#4f46e5';
        el.style.zIndex = '';
        var marker = entry.markerObjs[index];
        if (marker && marker.getPopup() && marker.getPopup().isOpen()) marker.togglePopup();
    }
};
