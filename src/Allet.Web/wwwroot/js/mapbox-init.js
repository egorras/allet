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

        var popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 10 });

        map.on('load', function () {
            var features = markers.map(function (m, i) {
                return {
                    type: 'Feature',
                    id: i,
                    properties: { label: m.label, color: m.color },
                    geometry: { type: 'Point', coordinates: [m.lng, m.lat] }
                };
            });

            map.addSource('markers', {
                type: 'geojson',
                data: { type: 'FeatureCollection', features: features }
            });

            map.addLayer({
                id: 'markers-circle',
                type: 'circle',
                source: 'markers',
                paint: {
                    'circle-radius': [
                        'case',
                        ['boolean', ['feature-state', 'highlight'], false],
                        10, 6
                    ],
                    'circle-color': ['get', 'color'],
                    'circle-stroke-width': [
                        'case',
                        ['boolean', ['feature-state', 'highlight'], false],
                        3, 2
                    ],
                    'circle-stroke-color': [
                        'case',
                        ['boolean', ['feature-state', 'highlight'], false],
                        '#f59e0b', '#ffffff'
                    ],
                    'circle-radius-transition': { duration: 150 },
                    'circle-stroke-width-transition': { duration: 150 }
                }
            });

            // Map hover: show popup
            map.on('mouseenter', 'markers-circle', function (e) {
                map.getCanvas().style.cursor = 'pointer';
                var f = e.features[0];
                if (f && f.properties.label) {
                    popup.setLngLat(f.geometry.coordinates).setText(f.properties.label).addTo(map);
                }
            });
            map.on('mouseleave', 'markers-circle', function () {
                map.getCanvas().style.cursor = '';
                popup.remove();
            });
        });

        this._maps[mapId] = { map: map, popup: popup, markers: markers };
    },

    highlight: function (mapId, index) {
        var entry = this._maps[mapId];
        if (!entry) return;
        var map = entry.map;
        if (!map.getSource('markers')) return;
        map.setFeatureState({ source: 'markers', id: index }, { highlight: true });
        var m = entry.markers[index];
        if (m && m.label) {
            entry.popup.setLngLat([m.lng, m.lat]).setText(m.label).addTo(map);
        }
    },

    unhighlight: function (mapId, index) {
        var entry = this._maps[mapId];
        if (!entry) return;
        var map = entry.map;
        if (!map.getSource('markers')) return;
        map.setFeatureState({ source: 'markers', id: index }, { highlight: false });
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
