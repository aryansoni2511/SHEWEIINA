import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Compass } from 'lucide-react';
import { isValidCoordinate, getProviderCoords } from '../../utils/geo';

export { isValidCoordinate, getProviderCoords };

// Approximate city center coordinates for realistic initial map viewport
const CITY_COORDS = {
  Mumbai: [19.076, 72.8777],
  Delhi: [28.6139, 77.209],
  Bengaluru: [12.9716, 77.5946],
  Pune: [18.5204, 73.8567],
  Hyderabad: [17.385, 78.4867],
  Chennai: [13.0827, 80.2707],
};

function createCleanBlueMarkerIcon(category, isSelected = false) {
  let iconEmoji = '📍';
  if (category === 'hospital') iconEmoji = '🩺';
  else if (category === 'clinic') iconEmoji = '🩺';
  else if (category === 'salon') iconEmoji = '✂️';
  else if (category === 'government') iconEmoji = '🏛️';

  const bgClass = isSelected
    ? 'bg-[#1D4ED8] ring-4 ring-[#93C5FD] shadow-lg scale-125'
    : 'bg-[#2563EB] hover:bg-[#1D4ED8] shadow-md hover:scale-110';

  const html = `
    <div style="transform: translate(-50%, -100%);">
      <div class="flex items-center justify-center rounded-2xl ${bgClass} text-white border-2 border-white transition-all duration-150" style="width: 32px; height: 32px; font-size: 14px;">
        ${iconEmoji}
      </div>
      <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid #2563EB; margin: -1px auto 0 auto;"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-explore-marker',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
    popupAnchor: [0, -36],
  });
}

function createUserLocationIcon() {
  const html = `
    <div style="transform: translate(-50%, -50%);">
      <div class="relative flex items-center justify-center">
        <span class="absolute w-7 h-7 rounded-full bg-blue-500/40 animate-ping"></span>
        <span class="w-4 h-4 rounded-full bg-[#2563EB] border-2 border-white shadow-md block"></span>
      </div>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'custom-user-marker',
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

export default function ExploreMap({
  providers = [],
  selectedProvider = null,
  onSelectProvider = null,
  activeCity = 'All Cities',
  userLocation = null,
  onRequestLocation = null,
  locating = false,
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // If providers with valid coordinates exist, initialize center to the first valid provider coordinate
      const firstValidProvider = providers.find((p) => isValidCoordinate(p?.latitude, p?.longitude));
      const fallbackCenter = firstValidProvider
        ? [Number(firstValidProvider.latitude), Number(firstValidProvider.longitude)]
        : CITY_COORDS[activeCity] || CITY_COORDS.Mumbai;

      const center = userLocation || fallbackCenter;
      const map = L.map(mapContainerRef.current, {
        center,
        zoom: 13,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update center when city filter changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (activeCity !== 'All Cities' && CITY_COORDS[activeCity]) {
      mapInstanceRef.current.setView(CITY_COORDS[activeCity], 13);
    }
  }, [activeCity]);

  // Update User Location Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation && Array.isArray(userLocation) && userLocation.length === 2) {
      const marker = L.marker(userLocation, {
        icon: createUserLocationIcon(),
        title: 'Your Location',
        zIndexOffset: 1000,
      });
      marker.addTo(map);
      marker.bindPopup('<strong style="font-size:12px;color:#1D4ED8;">📍 You Are Here</strong>');
      userMarkerRef.current = marker;
    }
  }, [userLocation]);

  // Update Provider Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const bounds = L.latLngBounds([]);
    let mappedCount = 0;

    providers.forEach((p) => {
      const coords = getProviderCoords(p);
      if (!coords) return; // Only eligible providers with valid finite GPS coordinates get markers

      mappedCount += 1;
      const isSelected = selectedProvider?.id === p.id;
      const marker = L.marker(coords, {
        icon: createCleanBlueMarkerIcon(p.category, isSelected),
        title: p.title,
      });

      marker.on('click', () => {
        if (onSelectProvider) {
          onSelectProvider(p);
        }
      });

      marker.addTo(map);
      markersRef.current.push(marker);
      bounds.extend(coords);
    });

    if (userLocation && Array.isArray(userLocation) && userLocation.length === 2 && isValidCoordinate(userLocation[0], userLocation[1])) {
      bounds.extend(userLocation);
    }

    if (mappedCount > 0 && bounds.isValid() && !selectedProvider) {
      if (mappedCount === 1) {
        // For a single point, center and set an appropriate street-level zoom
        map.setView(bounds.getCenter(), 14);
      } else {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
      }
    }
  }, [providers, selectedProvider, onSelectProvider, activeCity, userLocation]);

  // Pan to selected provider when selected
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedProvider) return;
    const coords = getProviderCoords(selectedProvider);
    if (!coords) {
      // Do not call map.flyTo() with invalid/missing coordinates
      return;
    }
    map.flyTo(coords, Math.max(map.getZoom(), 14), { duration: 0.8 });
  }, [selectedProvider]);

  const handleLocateClick = () => {
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(userLocation, 15, { duration: 0.8 });
    } else if (onRequestLocation) {
      onRequestLocation();
    }
  };

  const eligibleProviders = providers.filter((p) => isValidCoordinate(p?.latitude, p?.longitude));
  const hasEligibleMarkers = eligibleProviders.length > 0;

  return (
    <div className="relative w-full h-full min-h-[260px] rounded-3xl overflow-hidden border border-[#E7E3DC] shadow-sm bg-[#F4F0E8]">
      <div ref={mapContainerRef} className="w-full h-full min-h-[260px] z-10" />

      {/* Map Category Legend Overlay */}
      {hasEligibleMarkers && (
        <div className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#E7E3DC] text-[11px] font-semibold text-[#171717] shadow-xs flex items-center gap-2 pointer-events-none">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
            <span>{eligibleProviders.length} Mapped</span>
          </span>
          <span className="text-[#A8A29E]">•</span>
          <span>🩺 OPD</span>
          <span>•</span>
          <span>✂️ Salon</span>
          <span>•</span>
          <span>🏛️ Kendra</span>
        </div>
      )}

      {/* Clean Map Empty State when providers exist but none have coordinates */}
      {providers.length > 0 && !hasEligibleMarkers && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 bg-white/80 backdrop-blur-[2px] text-center pointer-events-none">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 text-[#2563EB] flex items-center justify-center mb-2 shadow-xs">
            <Compass className="w-5 h-5 text-[#2563EB]" />
          </div>
          <p className="text-xs font-bold text-[#171717]">GPS locations not available for these providers</p>
          <p className="text-[11px] text-[#78716C] max-w-[260px] mt-0.5">
            Browse the services directly from the nearby cards list below.
          </p>
        </div>
      )}

      {/* Locate Me Button Overlay */}
      {onRequestLocation && (
        <button
          type="button"
          onClick={handleLocateClick}
          disabled={locating}
          title={userLocation ? 'Center to My Location' : 'Detect My Location'}
          className="absolute bottom-3 left-3 z-20 bg-white hover:bg-[#F5F2EB] active:scale-95 text-[#2563EB] p-2.5 rounded-xl border border-[#E7E3DC] shadow-md transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          aria-label="Locate me"
        >
          <Navigation className={`w-4 h-4 ${locating ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{userLocation ? 'My Location' : 'Locate Me'}</span>
        </button>
      )}
    </div>
  );
}
