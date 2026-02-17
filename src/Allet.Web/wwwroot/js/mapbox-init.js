window.alletMap = {
    _maps: {},

    init: function (mapId, accessToken, markers) {
        if (typeof mapboxgl === 'undefined') return;

        // If map already exists, just update markers
        if (this._maps[mapId]) {
            this.updateMarkers(mapId, markers);
            return;
        }

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

        this._maps[mapId] = {
            map: map,
            markers: [],
            markerObjects: []
        };

        // Add markers after map is created
        this._addMarkers(mapId, markers);

        // Fit bounds if multiple markers
        if (markers.length > 1) {
            var bounds = new mapboxgl.LngLatBounds();
            markers.forEach(function (m) { bounds.extend([m.lng, m.lat]); });
            map.fitBounds(bounds, { padding: 40, maxZoom: 10 });
        }
    },

    updateMarkers: function (mapId, markers) {
        var entry = this._maps[mapId];
        if (!entry) return;

        // normalize property names
        markers = (markers || []).map(function (m) {
            return {
                label: m.label || m.Label || '',
                lat: m.lat || m.Lat || 0,
                lng: m.lng || m.Lng || 0,
                color: m.color || m.Color || '#4f46e5'
            };
        });

        // Remove old markers
        entry.markerObjects.forEach(function (marker) {
            marker.remove();
        });
        entry.markerObjects = [];
        entry.markers = [];

        // Add new markers
        this._addMarkers(mapId, markers);

        // Fit bounds if multiple markers
        if (markers.length > 1) {
            var bounds = new mapboxgl.LngLatBounds();
            markers.forEach(function (m) { bounds.extend([m.lng, m.lat]); });
            entry.map.fitBounds(bounds, { padding: 40, maxZoom: 10 });
        } else if (markers.length === 1) {
            entry.map.flyTo({ center: [markers[0].lng, markers[0].lat], zoom: 8 });
        }
    },

    _addMarkers: function (mapId, markers) {
        var entry = this._maps[mapId];
        if (!entry) return;

        var map = entry.map;
        var markerObjects = entry.markerObjects;

        markers.forEach(function (markerData, index) {
            // Skip invalid markers
            if (!markerData || !markerData.lng || !markerData.lat) {
                return;
            }

            // Create custom HTML element for the marker
            var el = document.createElement('div');
            el.className = 'custom-marker';
            el.style.width = '24px';
            el.style.height = '24px';
            el.style.borderRadius = '50%';
            el.style.backgroundColor = markerData.color;
            el.style.border = '2px solid white';
            el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
            el.style.cursor = 'pointer';
            el.style.transition = 'transform 0.2s ease, box-shadow 0.2s ease';
            el.dataset.index = index;

            // Create popup for this marker
            var popup = new mapboxgl.Popup({
                closeButton: false,
                closeOnClick: false,
                offset: 25
            }).setText(markerData.label);

            // Create marker with custom element and popup
            var marker = new mapboxgl.Marker({
                element: el
            })
                .setLngLat([markerData.lng, markerData.lat])
                .setPopup(popup)
                .addTo(map);

            // Add hover events for visual effects only
            el.addEventListener('mouseenter', function () {
                el.style.transform = 'scale(1.4)';
                el.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
                el.style.zIndex = '10';
                marker.togglePopup(); // Show popup
            });

            el.addEventListener('mouseleave', function () {
                el.style.transform = 'scale(1)';
                el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
                el.style.zIndex = '';
                marker.togglePopup(); // Hide popup
            });

            markerObjects.push(marker);
        });

        entry.markers = markers;
    },

    highlight: function (mapId, index) {
        var entry = this._maps[mapId];
        if (!entry) return;
        var marker = entry.markerObjects[index];
        if (!marker) return;

        var el = marker.getElement();
        el.style.transform = 'scale(1.4)';
        el.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
        el.style.zIndex = '10';

        marker.togglePopup();
    },

    unhighlight: function (mapId, index) {
        var entry = this._maps[mapId];
        if (!entry) return;
        var marker = entry.markerObjects[index];
        if (!marker) return;

        var el = marker.getElement();
        el.style.transform = 'scale(1)';
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        el.style.zIndex = '';

        var popup = marker.getPopup();
        if (popup && popup.isOpen()) {
            marker.togglePopup();
        }
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
