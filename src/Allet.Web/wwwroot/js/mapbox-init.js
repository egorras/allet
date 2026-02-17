window.alletMap = {
    _maps: {},
    init: function (mapId, accessToken, markers) {
        if (typeof mapboxgl === 'undefined') return;
        mapboxgl.accessToken = accessToken;

        // normalize property names (Blazor may send PascalCase or camelCase)
        markers = (markers || []).map(function (m) {
            return {
                label: m.label || m.Label || '',
                lat: m.lat || m.Lat || 0,
                lng: m.lng || m.Lng || 0,
                color: m.color || m.Color || '#4f46e5'
            };
        });

        var center = [0, 20];
        var zoom = 2;
        if (markers.length > 0) {
            center = [markers[0].lng, markers[0].lat];
            if (markers.length === 1) zoom = 8;
        }

        var map = new mapboxgl.Map({
            container: mapId,
            style: 'mapbox://styles/mapbox/light-v11',
            center: center,
            zoom: zoom
        });

        if (markers.length > 1) {
            var bounds = new mapboxgl.LngLatBounds();
            markers.forEach(function (m) { bounds.extend([m.lng, m.lat]); });
            map.fitBounds(bounds, { padding: 40, maxZoom: 10 });
        }

        var popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 20 });
        var markerObjects = [];

        markers.forEach(function (m, i) {
            var marker = new mapboxgl.Marker({ color: m.color, scale: 0.8 })
                .setLngLat([m.lng, m.lat])
                .addTo(map);

            var el = marker.getElement();
            el.dataset.index = i;
            el.style.cursor = 'pointer';

            el.addEventListener('mouseenter', function () {
                popup.setLngLat([m.lng, m.lat]).setText(m.label).addTo(map);
            });
            el.addEventListener('mouseleave', function () {
                popup.remove();
            });

            markerObjects.push(marker);
        });

        this._maps[mapId] = { map: map, popup: popup, markers: markers, markerObjects: markerObjects };
    },

    highlight: function (mapId, index) {
        var entry = this._maps[mapId];
        if (!entry) return;
        var obj = entry.markerObjects[index];
        if (!obj) return;
        var el = obj.getElement();
        el.style.transform = el.style.transform.replace(/scale\([^)]*\)/, '') + ' scale(1.4)';
        el.style.zIndex = '10';
        var m = entry.markers[index];
        if (m && m.label) {
            entry.popup.setLngLat([m.lng, m.lat]).setText(m.label).addTo(entry.map);
        }
    },

    unhighlight: function (mapId, index) {
        var entry = this._maps[mapId];
        if (!entry) return;
        var obj = entry.markerObjects[index];
        if (!obj) return;
        var el = obj.getElement();
        el.style.transform = el.style.transform.replace(/scale\([^)]*\)/, '');
        el.style.zIndex = '';
        entry.popup.remove();
    },

    bindTableHover: function (mapId, tableId) {
        var table = document.getElementById(tableId);
        if (!table) return;
        var currentRow = null;
        table.addEventListener('mouseover', function (e) {
            var row = e.target.closest('tr[data-marker]');
            if (row === currentRow) return;
            if (currentRow) {
                var oldIdx = parseInt(currentRow.dataset.marker, 10);
                if (!isNaN(oldIdx) && oldIdx >= 0) window.alletMap.unhighlight(mapId, oldIdx);
            }
            currentRow = row;
            if (row) {
                var idx = parseInt(row.dataset.marker, 10);
                if (!isNaN(idx) && idx >= 0) window.alletMap.highlight(mapId, idx);
            }
        });
        table.addEventListener('mouseleave', function () {
            if (currentRow) {
                var idx = parseInt(currentRow.dataset.marker, 10);
                if (!isNaN(idx) && idx >= 0) window.alletMap.unhighlight(mapId, idx);
                currentRow = null;
            }
        });
    }
};
