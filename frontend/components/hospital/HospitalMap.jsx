import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Creates custom crisp SVG Leaflet DivIcon with Shewwina emerald branding
 */
function createHospitalMarkerIcon(isSelected = false) {
  const bgClass = isSelected ? 'bg-rose-600 text-white shadow-rose-600/40' : 'bg-emerald-600 text-white shadow-emerald-600/30';
  const size = isSelected ? 38 : 32;

  const html = `
    <div style="transform: translate(-50%, -100%);">
      <div class="relative flex items-center justify-center rounded-2xl ${bgClass} shadow-lg transition-transform duration-200 border-2 border-white hover:scale-110" style="width: ${size}px; height: ${size}px;">
        <svg style="width: 18px; height: 18px;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid ${isSelected ? '#e11d48' : '#059669'}; margin: -2px auto 0 auto;"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-hospital-marker',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -size - 4],
  });
}

function createUserLocationIcon() {
  const html = `
    <div style="transform: translate(-50%, -50%);">
      <span class="relative flex h-5 w-5">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-5 w-5 bg-sky-600 border-2 border-white shadow-md"></span>
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
      <div class="relative flex items-center justify-center rounded-2xl bg-amber-500 text-white shadow-lg border-2 border-white animate-bounce" style="width: 36px; height: 36px;">
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

export default function HospitalMap({
  hospitals = [],
  selectedHospital = null,
  onSelectHospital = null,
  isPickerMode = false, // When true, allows clicking/dragging to pick coordinates for hospital registration
  pickerLocation = null, // { lat, lng }
  onPickLocation = null, // callback(lat, lng, addressInfo)
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

  // Address search inside map
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [searchingMap, setSearchingMap] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Default center: Mumbai / Central India coordinates
  const defaultCenter = [19.0760, 72.8777];
  const defaultZoom = 12;

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Prevent double initialization

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: defaultZoom,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | Shewwina OPD',
      maxZoom: 19,
    }).addTo(map);

    // Layer group for hospital markers
    markersLayerRef.current = L.layerGroup().addTo(map);

    // Picker Mode: Click map to place marker
    if (isPickerMode) {
      map.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        handlePlacePickerMarker(lat, lng, map);
      });
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [isPickerMode]);

  // Handle location picker placement & reverse geocoding via Nominatim
  const handlePlacePickerMarker = useCallback(
    async (lat, lng, mapInstance = mapInstanceRef.current) => {
      if (!mapInstance || !onPickLocation) return;

      const roundedLat = Math.round(lat * 1000000) / 1000000;
      const roundedLng = Math.round(lng * 1000000) / 1000000;

      if (pickerMarkerRef.current) {
        pickerMarkerRef.current.setLatLng([roundedLat, roundedLng]);
      } else {
        const pickerMarker = L.marker([roundedLat, roundedLng], {
          icon: createPickerMarkerIcon(),
          draggable: true,
        }).addTo(mapInstance);

        pickerMarker.on('dragend', (evt) => {
          const pos = evt.target.getLatLng();
          handlePlacePickerMarker(pos.lat, pos.lng, mapInstance);
        });

        pickerMarkerRef.current = pickerMarker;
      }

      // Reverse geocode via Nominatim (Free OpenStreetMap Geocoding API)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${roundedLat}&lon=${roundedLng}&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'Shewwina-Healthcare-Platform/1.0',
            },
          }
        );
        const data = await res.json().catch(() => null);
        const address = data?.display_name || '';
        const city =
          data?.address?.city ||
          data?.address?.town ||
          data?.address?.suburb ||
          data?.address?.district ||
          '';
        const pincode = data?.address?.postcode || '';
        const state = data?.address?.state || '';

        onPickLocation(roundedLat, roundedLng, { address, city, pincode, state });
      } catch (err) {
        onPickLocation(roundedLat, roundedLng, { address: '', city: '', pincode: '', state: '' });
      }
    },
    [onPickLocation]
  );

  // Sync external picker location props
  useEffect(() => {
    if (isPickerMode && pickerLocation?.lat && pickerLocation?.lng && mapInstanceRef.current) {
      handlePlacePickerMarker(pickerLocation.lat, pickerLocation.lng, mapInstanceRef.current);
      mapInstanceRef.current.setView([pickerLocation.lat, pickerLocation.lng], 15);
    }
  }, [isPickerMode, pickerLocation, handlePlacePickerMarker]);

  // Render Hospital Markers on Map
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    if (isPickerMode) return; // In picker mode, do not clutter with directory markers

    markersLayerRef.current.clearLayers();

    const validHospitals = hospitals.filter((h) => h.latitude && h.longitude);

    validHospitals.forEach((hospital) => {
      const isSelected = selectedHospital && selectedHospital.id === hospital.id;
      const marker = L.marker([hospital.latitude, hospital.longitude], {
        icon: createHospitalMarkerIcon(isSelected),
      });

      // Direction link
      const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`;

      // Custom Popup HTML
      const popupContent = `
        <div style="font-family: inherit; font-size: 12px; min-width: 220px; max-width: 280px; padding: 4px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <span style="font-size: 16px;">🏥</span>
            <strong style="font-size: 13px; color: #0f172a; line-height: 1.2;">${hospital.name}</strong>
          </div>
          <div style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 700; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; margin-bottom: 6px;">
            ${hospital.hospitalType || 'Multi-Specialty'}
          </div>
          <p style="margin: 0 0 6px 0; color: #475569; font-size: 11px; line-height: 1.4;">
            ${hospital.address}, ${hospital.city} - ${hospital.pincode}
          </p>
          <div style="font-size: 11px; color: #0f172a; margin-bottom: 8px;">
            📞 <strong>${hospital.phone}</strong>
          </div>
          <div style="display: flex; gap: 6px; padding-top: 6px; border-top: 1px solid #f1f5f9;">
            <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer" style="flex: 1; text-align: center; background: #059669; color: white; padding: 5px 8px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 11px;">
              Directions ↗
            </a>
            <a href="/hospital/${hospital.slug || hospital.id}" style="flex: 1; text-align: center; background: #f8fafc; color: #0f172a; padding: 5px 8px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 11px; border: 1px solid #e2e8f0;">
              View OPD
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        if (onSelectHospital) {
          onSelectHospital(hospital);
        }
      });

      markersLayerRef.current.addLayer(marker);
    });

    // If a hospital is selected, zoom to it
    if (selectedHospital?.latitude && selectedHospital?.longitude) {
      mapInstanceRef.current.setView([selectedHospital.latitude, selectedHospital.longitude], 15, {
        animate: true,
      });
    } else if (validHospitals.length > 0 && !userLocation) {
      // Fit bounds to show all hospitals
      const bounds = L.latLngBounds(validHospitals.map((h) => [h.latitude, h.longitude]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [hospitals, selectedHospital, onSelectHospital, isPickerMode, userLocation]);

  // Request Browser Geolocation
  const handleDetectLocation = () => {
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

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 14, { animate: true });

          // Add or move user marker
          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng([latitude, longitude]);
          } else {
            userMarkerRef.current = L.marker([latitude, longitude], {
              icon: createUserLocationIcon(),
            })
              .addTo(mapInstanceRef.current)
              .bindPopup('<strong style="font-size: 12px;">📍 Your Current Location</strong>');
          }
        }

        if (isPickerMode) {
          handlePlacePickerMarker(latitude, longitude);
        }
      },
      (error) => {
        setLocatingUser(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGeoError('Location permission denied. You can manually search for your city or PIN code below.');
        } else {
          setGeoError('Unable to detect location. Please use manual address search.');
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Search Address / City on Map using Nominatim
  const handleSearchOnMap = async (e) => {
    e.preventDefault();
    if (!mapSearchQuery.trim()) return;

    setSearchingMap(true);
    setSearchError(null);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          mapSearchQuery.trim() + ', India'
        )}&limit=1`,
        {
          headers: {
            'User-Agent': 'Shewwina-Healthcare-Platform/1.0',
          },
        }
      );
      const data = await res.json().catch(() => null);

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lon], 14, { animate: true });
        }

        if (isPickerMode) {
          handlePlacePickerMarker(lat, lon);
        }
      } else {
        setSearchError(`No coordinates found for "${mapSearchQuery}". Try a nearby city or PIN code.`);
      }
    } catch (err) {
      setSearchError('Search failed. Please check network connection.');
    } finally {
      setSearchingMap(false);
    }
  };

  return (
    <div className={`relative rounded-3xl overflow-hidden border border-slate-200/90 shadow-xs bg-slate-100 ${className}`}>
      {/* Map Control Overlay Toolbar */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pointer-events-none">
        {/* Search input for map location */}
        <form
          onSubmit={handleSearchOnMap}
          className="pointer-events-auto flex items-center bg-white/95 backdrop-blur-md rounded-2xl shadow-md border border-slate-200/80 px-3 py-1.5 max-w-sm w-full"
        >
          <svg className="w-4 h-4 text-slate-400 shrink-0 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={mapSearchQuery}
            onChange={(e) => setMapSearchQuery(e.target.value)}
            placeholder="Search map (e.g. Andheri, 400058)..."
            className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={searchingMap}
            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 px-2 py-0.5 rounded-lg hover:bg-emerald-50 transition-colors shrink-0"
          >
            {searchingMap ? '...' : 'Go'}
          </button>
        </form>

        {/* GPS Geolocation Button */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={locatingUser}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/95 backdrop-blur-md text-slate-700 hover:text-emerald-800 font-semibold text-xs shadow-md border border-slate-200/80 hover:bg-emerald-50/70 transition-all active:scale-95"
            title="Locate my position on map"
          >
            <span className={`w-2 h-2 rounded-full ${locatingUser ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`} />
            <span>{locatingUser ? 'Detecting...' : 'Near Me'}</span>
          </button>
        </div>
      </div>

      {/* Geolocation Notice / Error Banner */}
      {geoError && (
        <div className="absolute bottom-3 left-3 right-3 z-[1000] p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs shadow-lg flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{geoError}</span>
          </div>
          <button
            type="button"
            onClick={() => setGeoError(null)}
            className="text-amber-800 hover:text-amber-950 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search Error Banner */}
      {searchError && (
        <div className="absolute bottom-3 left-3 right-3 z-[1000] p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs shadow-lg flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span>ℹ️</span>
            <span>{searchError}</span>
          </div>
          <button
            type="button"
            onClick={() => setSearchError(null)}
            className="text-rose-800 hover:text-rose-950 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Picker Mode Instruction Pill */}
      {isPickerMode && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2 rounded-full bg-slate-900/90 text-white text-xs font-semibold shadow-xl border border-white/20 backdrop-blur-sm pointer-events-none text-center">
          📍 Click on map to place or drag hospital pin
        </div>
      )}

      {/* Actual Leaflet Container */}
      <div ref={mapContainerRef} style={{ height, width: '100%' }} className="z-0" />
    </div>
  );
}

