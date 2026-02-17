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

        var popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 15 });
        var markerObjects = [];

        markers.forEach(function (m, i) {
            // Create custom HTML element for the marker
            var el = document.createElement('div');
            el.className = 'custom-marker';
            el.style.width = '24px';
            el.style.height = '24px';
            el.style.borderRadius = '50%';
            el.style.backgroundColor = m.color;
            el.style.border = '2px solid white';
            el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
            el.style.cursor = 'pointer';
            el.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
            el.dataset.index = i;

            // Create marker with custom element
            var marker = new mapboxgl.Marker({
                element: el,
                anchor: 'center'
            })
                .setLngLat([m.lng, m.lat])
                .addTo(map);

            // Add hover events to the custom element
            el.addEventListener('mouseenter', function () {
                el.style.transform = 'scale(1.4)';
                el.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
                el.style.zIndex = '10';
                popup.setLngLat([m.lng, m.lat]).setText(m.label).addTo(map);
            });

            el.addEventListener('mouseleave', function () {
                el.style.transform = 'scale(1)';
                el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
                el.style.zIndex = '';
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
        el.style.transform = 'scale(1.4)';
        el.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
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
        el.style.transform = 'scale(1)';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
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
