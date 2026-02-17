window.alletMap = {
    _maps: {},
    init: function (mapId, accessToken, markers) {
        if (typeof mapboxgl === 'undefined') return;
        mapboxgl.accessToken = accessToken;
        var center = [0, 20];
        var zoom = 2;
        if (markers && markers.length > 0) {
            center = [markers[0].lng || markers[0].Lng, markers[0].lat || markers[0].Lat];
            if (markers.length === 1) zoom = 8;
        }
        var map = new mapboxgl.Map({
            container: mapId,
            style: 'mapbox://styles/mapbox/light-v11',
            center: center,
            zoom: zoom
        });
        // normalize marker property names (Blazor may send PascalCase or camelCase)
        markers = markers.map(function (m) {
            return {
                label: m.label || m.Label || '',
                lat: m.lat || m.Lat || 0,
                lng: m.lng || m.Lng || 0,
                color: m.color || m.Color || null
            };
        });
        if (markers.length > 1) {
            var bounds = new mapboxgl.LngLatBounds();
            markers.forEach(function (m) {
                bounds.extend([m.lng, m.lat]);
            });
            map.fitBounds(bounds, { padding: 40, maxZoom: 10 });
        }
        var dotEls = [];
        var markerObjs = [];
        markers.forEach(function (m, i) {
            var el = document.createElement('div');
            el.className = 'mapbox-marker';
            el.style.width = '20px';
            el.style.height = '20px';
            el.style.display = 'flex';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';

            var dot = document.createElement('div');
            var markerColor = m.color || m.Color || '#4f46e5';
            dot.dataset.color = markerColor;
            dot.style.width = '12px';
            dot.style.height = '12px';
            dot.style.borderRadius = '50%';
            dot.style.backgroundColor = markerColor;
            dot.style.border = '2px solid white';
            dot.style.boxShadow = '0 1px 2px rgba(0,0,0,0.3)';
            dot.style.transition = 'width 0.15s, height 0.15s, background-color 0.15s';
            el.appendChild(dot);

            var popup = m.label ? new mapboxgl.Popup({ offset: 12 }).setText(m.label) : null;
            var marker = new mapboxgl.Marker(el).setLngLat([m.lng, m.lat]).setPopup(popup).addTo(map);
            dotEls.push(dot);
            markerObjs.push(marker);
        });
        this._maps[mapId] = { map: map, dotEls: dotEls, markerObjs: markerObjs };
    },
    highlight: function (mapId, index) {
        var entry = this._maps[mapId];
        if (!entry) return;
        var dot = entry.dotEls[index];
        if (!dot) return;
        dot.style.width = '22px';
        dot.style.height = '22px';
        dot.style.backgroundColor = '#f59e0b';
        dot.parentElement.style.zIndex = '10';
        var marker = entry.markerObjs[index];
        if (marker && marker.getPopup() && !marker.getPopup().isOpen()) marker.togglePopup();
    },
    unhighlight: function (mapId, index) {
        var entry = this._maps[mapId];
        if (!entry) return;
        var dot = entry.dotEls[index];
        if (!dot) return;
        dot.style.width = '12px';
        dot.style.height = '12px';
        dot.style.backgroundColor = dot.dataset.color || '#4f46e5';
        dot.parentElement.style.zIndex = '';
        var marker = entry.markerObjs[index];
        if (marker && marker.getPopup() && marker.getPopup().isOpen()) marker.togglePopup();
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
