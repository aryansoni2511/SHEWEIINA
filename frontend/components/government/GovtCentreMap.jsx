import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Creates custom crisp SVG Leaflet DivIcon with Institutional Navy / Saffron branding
 */
function createCentreMarkerIcon(isSelected = false) {
  const bgClass = isSelected ? 'bg-amber-600 text-white shadow-amber-600/40' : 'bg-slate-900 text-white shadow-slate-900/30';
  const size = isSelected ? 38 : 32;

  const html = `
    <div style="transform: translate(-50%, -100%);">
      <div class="relative flex items-center justify-center rounded-2xl ${bgClass} shadow-lg transition-transform duration-200 border-2 border-white hover:scale-110" style="width: ${size}px; height: ${size}px;">
        <svg style="width: 18px; height: 18px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
      <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid ${isSelected ? '#d97706' : '#0f172a'}; margin: -2px auto 0 auto;"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-govt-marker',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -size - 4],
  });
}

function createUserLocationIcon() {
  const html = `
    <div style="transform: translate(-50%, -50%);">
      <span class="relative flex h-5 w-5">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-5 w-5 bg-blue-600 border-2 border-white shadow-md"></span>
      </span>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-user-marker',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function createPickerMarkerIcon() {
  const html = `
    <div style="transform: translate(-50%, -100%);">
      <div class="relative flex items-center justify-center rounded-2xl bg-amber-600 text-white shadow-lg border-2 border-white animate-bounce" style="width: 36px; height: 36px;">
        <svg style="width: 20px; height: 20px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </div>
      <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid #d97706; margin: -2px auto 0 auto;"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-picker-marker',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

export default function GovtCentreMap({
  centres = [],
  selectedCentre = null,
  onSelectCentre = null,
  isPickerMode = false,
  pickerLocation = null,
  onPickLocation = null,
  height = '500px',
  className = '',
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const pickerMarkerRef = useRef(null);

  const [userLocation, setUserLocation] = useState(null);
  const [locatingUser, setLocatingUser] = useState(false);
  const [geoError, setGeoError] = useState(null);

  const defaultCenter = [19.0760, 72.8777]; // Mumbai
  const defaultZoom = 12;

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialCenter = pickerLocation
      ? [pickerLocation.lat, pickerLocation.lng]
      : selectedCentre?.latitude && selectedCentre?.longitude
      ? [selectedCentre.latitude, selectedCentre.longitude]
      : defaultCenter;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: defaultZoom,
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Location Picker Mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (isPickerMode) {
      const handleMapClick = (e) => {
        const { lat, lng } = e.latlng;
        if (onPickLocation) {
          onPickLocation(lat, lng);
        }
      };

      map.on('click', handleMapClick);

      return () => {
        map.off('click', handleMapClick);
      };
    }
  }, [isPickerMode, onPickLocation]);

  // Update Picker Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (isPickerMode && pickerLocation) {
      if (!pickerMarkerRef.current) {
        const marker = L.marker([pickerLocation.lat, pickerLocation.lng], {
          icon: createPickerMarkerIcon(),
          draggable: true,
        }).addTo(map);

        marker.on('dragend', (e) => {
          const { lat, lng } = e.target.getLatLng();
          if (onPickLocation) {
            onPickLocation(lat, lng);
          }
        });

        pickerMarkerRef.current = marker;
      } else {
        pickerMarkerRef.current.setLatLng([pickerLocation.lat, pickerLocation.lng]);
      }
      map.panTo([pickerLocation.lat, pickerLocation.lng]);
    } else if (pickerMarkerRef.current) {
      pickerMarkerRef.current.remove();
      pickerMarkerRef.current = null;
    }
  }, [isPickerMode, pickerLocation, onPickLocation]);

  // Render Centres Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup || isPickerMode) return;

    markersGroup.clearLayers();

    const validCentres = centres.filter(
      (c) => c.latitude && c.longitude && !isNaN(c.latitude) && !isNaN(c.longitude)
    );

    if (validCentres.length === 0) return;

    const bounds = [];

    validCentres.forEach((centre) => {
      const isSelected = selectedCentre?.id === centre.id;
      const marker = L.marker([centre.latitude, centre.longitude], {
        icon: createCentreMarkerIcon(isSelected),
      });

      const popupContent = `
        <div style="font-family: inherit; font-size: 13px; min-width: 200px;">
          <div style="font-weight: 700; color: #0f172a; font-size: 14px; margin-bottom: 2px;">
            ${centre.name}
          </div>
          <div style="color: #64748b; font-size: 11px; margin-bottom: 6px;">
            ${centre.centre_type || 'Citizen Facilitation Centre'}
          </div>
          <div style="color: #334155; font-size: 12px; margin-bottom: 6px;">
            📍 ${centre.address}, ${centre.city} — ${centre.pincode}
          </div>
          <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 8px;">
            ${(centre.supported_categories || []).map(cat => `
              <span style="background: #eff6ff; color: #1e3a8a; font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; border: 1px solid #bfdbfe;">
                ${cat}
              </span>
            `).join('')}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 6px;">
            <span style="color: #059669; font-weight: 600; font-size: 11px;">
              ● Open for tokens
            </span>
            <a href="/government-services#centre-${centre.id}" style="color: #1e3a8a; font-weight: 700; text-decoration: none; font-size: 11px;">
              View Details →
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        if (onSelectCentre) {
          onSelectCentre(centre);
        }
      });

      markersGroup.addLayer(marker);
      bounds.push([centre.latitude, centre.longitude]);
    });

    if (selectedCentre?.latitude && selectedCentre?.longitude) {
      map.setView([selectedCentre.latitude, selectedCentre.longitude], 14, { animate: true });
    } else if (bounds.length > 0 && !selectedCentre) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [centres, selectedCentre, onSelectCentre, isPickerMode]);

  // Geolocation Handler
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }

    setLocatingUser(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocatingUser(false);

        const map = mapInstanceRef.current;
        if (map) {
          map.setView([latitude, longitude], 14, { animate: true });

          if (!userMarkerRef.current) {
            userMarkerRef.current = L.marker([latitude, longitude], {
              icon: createUserLocationIcon(),
            }).addTo(map);
          } else {
            userMarkerRef.current.setLatLng([latitude, longitude]);
          }
        }
      },
      (err) => {
        setLocatingUser(false);
        setGeoError('Unable to detect location. Please check location permissions.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, []);

  return (
    <div className={`relative rounded-3xl overflow-hidden border border-slate-200 shadow-sm ${className}`} style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Map Controls Overlay */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locatingUser}
          className="bg-white/95 backdrop-blur-sm p-2.5 rounded-xl border border-slate-200 shadow-md text-slate-700 hover:text-blue-900 hover:bg-slate-50 transition-all disabled:opacity-50 text-xs font-semibold flex items-center gap-1.5"
          title="Detect my location"
        >
          {locatingUser ? (
            <span className="w-4 h-4 border-2 border-blue-900 border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4 text-blue-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.364-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414M16.95 16.95l1.414 1.414M7.05 7.05L5.636 5.636M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          )}
          <span className="hidden sm:inline">Near Me</span>
        </button>
      </div>

      {geoError && (
        <div className="absolute bottom-4 left-4 right-4 z-10 bg-amber-500/90 text-white text-xs px-3 py-1.5 rounded-lg shadow-md backdrop-blur-sm flex items-center justify-between">
          <span>{geoError}</span>
          <button onClick={() => setGeoError(null)} className="ml-2 font-bold text-white hover:text-amber-200">&times;</button>
        </div>
      )}
    </div>
  );
}
