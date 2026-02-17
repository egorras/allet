window.alletMap = {
    _maps: {},
    _tableListeners: {}, // Store listeners by tableId instead of in map entry
    _tableToMapId: {}, // Track which mapId each table is bound to

    // Helper to wait for element to be in DOM
    _waitForElement: function (selector, callback) {
        console.log('[Mapbox] Waiting for element:', selector);
        var element = document.getElementById(selector);
        if (element) {
            console.log('[Mapbox] Element found immediately:', selector);
            callback(element);
            return;
        }

        console.log('[Mapbox] Element not found, setting up observer for:', selector);
        // Use MutationObserver to wait for element
        var observer = new MutationObserver(function (mutations, obs) {
            var el = document.getElementById(selector);
            if (el) {
                console.log('[Mapbox] Element found via observer:', selector);
                obs.disconnect();
                callback(el);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    },

    // Helper to wait for map to be initialized
    _waitForMap: function (mapId, callback) {
        var self = this;
        console.log('[Mapbox] Waiting for map:', mapId);

        if (this._maps[mapId]) {
            console.log('[Mapbox] Map found immediately:', mapId);
            callback(this._maps[mapId]);
            return;
        }

        // Poll for map to be ready
        var attempts = 0;
        var maxAttempts = 50; // 5 seconds max
        var interval = setInterval(function () {
            attempts++;
            if (self._maps[mapId]) {
                console.log('[Mapbox] Map found after', attempts, 'attempts:', mapId);
                clearInterval(interval);
                callback(self._maps[mapId]);
            } else if (attempts >= maxAttempts) {
                console.warn('[Mapbox] Map not found after', attempts, 'attempts:', mapId);
                clearInterval(interval);
            }
        }, 100);
    },

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
            el.style.width = '18px';
            el.style.height = '18px';
            el.style.borderRadius = '50%';
            el.style.backgroundColor = markerData.color;
            el.style.border = '2px solid white';
            el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
            el.style.cursor = 'pointer';
            el.style.transition = 'box-shadow 0.2s ease';
            el.dataset.index = index;

            // Create popup for this marker
            var popup = new mapboxgl.Popup({
                closeButton: false,
                closeOnClick: false,
                offset: 25
            }).setText(markerData.label);

            // Create marker with custom element and popup
            var marker = new mapboxgl.Marker({
                element: el,
                scale: 1
            })
                .setLngLat([markerData.lng, markerData.lat])
                .setPopup(popup)
                .addTo(map);

            // Add hover events for visual effects and popup
            el.addEventListener('mouseenter', function () {
                // Use CSS class for scaling instead of inline transform
                el.classList.add('marker-hover');
                el.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
                el.style.zIndex = '10';

                var p = marker.getPopup();
                if (p && !p.isOpen()) {
                    marker.togglePopup();
                }
            });

            el.addEventListener('mouseleave', function () {
                // Remove CSS class
                el.classList.remove('marker-hover');
                el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
                el.style.zIndex = '';

                var p = marker.getPopup();
                if (p && p.isOpen()) {
                    marker.togglePopup();
                }
            });

            markerObjects.push(marker);
        });

        entry.markers = markers;
    },

    highlight: function (mapId, index) {
        console.log('[Mapbox] highlight called for mapId:', mapId, 'index:', index);
        var entry = this._maps[mapId];
        if (!entry) {
            console.warn('[Mapbox] No entry found for mapId:', mapId);
            return;
        }
        var marker = entry.markerObjects[index];
        if (!marker) {
            console.warn('[Mapbox] No marker found at index:', index, 'total markers:', entry.markerObjects.length);
            return;
        }

        var el = marker.getElement();
        el.classList.add('marker-hover');
        el.style.boxShadow = '0 4px 8px rgba(0,0,0,0.4)';
        el.style.zIndex = '10';

        var popup = marker.getPopup();
        if (popup && !popup.isOpen()) {
            marker.togglePopup();
        }
    },

    unhighlight: function (mapId, index) {
        var entry = this._maps[mapId];
        if (!entry) return;
        var marker = entry.markerObjects[index];
        if (!marker) return;

        var el = marker.getElement();
        el.classList.remove('marker-hover');
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
        el.style.zIndex = '';

        var popup = marker.getPopup();
        if (popup && popup.isOpen()) {
            marker.togglePopup();
        }
    },

    bindTableHover: function (mapId, tableId) {
        var self = this;

        console.log('[Mapbox] bindTableHover called for mapId:', mapId, 'tableId:', tableId);

        // Wait for both map and table to be ready
        this._waitForMap(mapId, function (entry) {
            self._waitForElement(tableId, function (table) {
                console.log('[Mapbox] Both map and table ready, binding events');

                // Remove old listeners if they exist for this table
                if (self._tableListeners[tableId]) {
                    console.log('[Mapbox] Removing old listeners for table:', tableId);
                    table.removeEventListener('mouseover', self._tableListeners[tableId].mouseover);
                    table.removeEventListener('mouseleave', self._tableListeners[tableId].mouseleave);
                    table.removeEventListener('click', self._tableListeners[tableId].click);
                }

                // Store the current mapId for this table
                self._tableToMapId[tableId] = mapId;
                console.log('[Mapbox] Bound table', tableId, 'to map', mapId);

                var currentRow = null;

                var mouseoverHandler = function (e) {
                    var row = e.target.closest('tr[data-marker]');
                    if (row === currentRow) return;
                    if (currentRow) {
                        var oldIdx = parseInt(currentRow.dataset.marker, 10);
                        var currentMapId = self._tableToMapId[tableId];
                        if (!isNaN(oldIdx) && oldIdx >= 0 && currentMapId) {
                            window.alletMap.unhighlight(currentMapId, oldIdx);
                        }
                    }
                    currentRow = row;
                    if (row) {
                        var idx = parseInt(row.dataset.marker, 10);
                        var currentMapId = self._tableToMapId[tableId];
                        if (!isNaN(idx) && idx >= 0 && currentMapId) {
                            window.alletMap.highlight(currentMapId, idx);
                        }
                    }
                };

                var mouseleaveHandler = function () {
                    if (currentRow) {
                        var idx = parseInt(currentRow.dataset.marker, 10);
                        var currentMapId = self._tableToMapId[tableId];
                        if (!isNaN(idx) && idx >= 0 && currentMapId) {
                            window.alletMap.unhighlight(currentMapId, idx);
                        }
                        currentRow = null;
                    }
                };

                var clickHandler = function (e) {
                    var row = e.target.closest('tr[data-marker]');
                    if (row && entry) {
                        var idx = parseInt(row.dataset.marker, 10);
                        if (!isNaN(idx) && idx >= 0) {
                            var marker = entry.markers[idx];
                            if (marker) {
                                // Just highlight, don't zoom
                                console.log('[Mapbox] Row clicked, marker:', idx);
                            }
                        }
                    }
                };

                // Store listeners globally by tableId so we can remove them later
                self._tableListeners[tableId] = {
                    mouseover: mouseoverHandler,
                    mouseleave: mouseleaveHandler,
                    click: clickHandler
                };

                // Add new listeners
                table.addEventListener('mouseover', mouseoverHandler);
                table.addEventListener('mouseleave', mouseleaveHandler);
                table.addEventListener('click', clickHandler);
                console.log('[Mapbox] Event listeners attached successfully');
            });
        });
    }
};
