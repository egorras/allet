window.alletMap = {
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
        markers.forEach(function (m) {
            var el = document.createElement('div');
            el.className = 'mapbox-marker';
            el.style.width = '12px';
            el.style.height = '12px';
            el.style.borderRadius = '50%';
            el.style.backgroundColor = '#4f46e5';
            el.style.border = '2px solid white';
            el.style.boxShadow = '0 1px 2px rgba(0,0,0,0.3)';
            var popup = m.label ? new mapboxgl.Popup({ offset: 12 }).setText(m.label) : null;
            new mapboxgl.Marker(el).setLngLat([m.lng, m.lat]).setPopup(popup).addTo(map);
        });
    }
};
