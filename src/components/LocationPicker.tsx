/// <reference types="google.maps" />
import React, { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, Search, X, AlertCircle, Compass } from "lucide-react";
import type { JournalLocation } from "../types";
import { loadGoogleMaps } from "../lib/googleMapsLoader";

interface LocationPickerProps {
  location: JournalLocation | null | undefined;
  onChange: (location: JournalLocation | null) => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({ location, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingMap, setLoadingMap] = useState(false);
  const [mapsAvailable, setMapsAvailable] = useState<boolean | null>(null);
  const [geolocating, setGeolocating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Manual fallback state if Google Maps key missing
  const [manualAddress, setManualAddress] = useState(location?.address || "");

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const googleMapsRef = useRef<typeof google.maps | null>(null);

  // Load Google Maps SDK on toggle open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setLoadingMap(true);
    setErrorMsg(null);

    loadGoogleMaps().then((gMaps) => {
      if (!isMounted) return;
      setLoadingMap(false);
      if (gMaps) {
        googleMapsRef.current = gMaps;
        setMapsAvailable(true);
      } else {
        setMapsAvailable(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Initialize Map container when available
  useEffect(() => {
    if (!isOpen || !mapsAvailable || !mapRef.current || !googleMapsRef.current) return;

    const gMaps = googleMapsRef.current;
    const initialLat = location?.lat ?? 28.6139; // Default center (New Delhi / Global baseline)
    const initialLng = location?.lng ?? 77.2090;

    if (!mapInstanceRef.current) {
      const map = new gMaps.Map(mapRef.current, {
        center: { lat: initialLat, lng: initialLng },
        zoom: location ? 14 : 4,
        styles: [
          { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
          {
            featureType: "administrative.locality",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
          },
          {
            featureType: "poi",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#38414e" }],
          },
          {
            featureType: "road",
            elementType: "geometry.stroke",
            stylers: [{ color: "#212a37" }],
          },
          {
            featureType: "road.highway",
            elementType: "geometry",
            stylers: [{ color: "#746855" }],
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#17263c" }],
          },
        ],
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
      });

      mapInstanceRef.current = map;

      // Click listener to pick location
      map.addListener("click", (e: google.maps.MapMouseEvent) => {
        if (!e.latLng) return;
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        updateLocationFromCoords(lat, lng);
      });
    }

    // Marker setup
    if (location) {
      const position = { lat: location.lat, lng: location.lng };
      if (!markerRef.current) {
        markerRef.current = new gMaps.Marker({
          position,
          map: mapInstanceRef.current,
          animation: gMaps.Animation.DROP,
        });
      } else {
        markerRef.current.setPosition(position);
        markerRef.current.setMap(mapInstanceRef.current);
      }
      mapInstanceRef.current.setCenter(position);
    } else if (markerRef.current) {
      markerRef.current.setMap(null);
    }
  }, [isOpen, mapsAvailable, location]);

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    if (!googleMapsRef.current) return `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
    try {
      const geocoder = new googleMapsRef.current.Geocoder();
      const response = await geocoder.geocode({ location: { lat, lng } });
      if (response.results && response.results[0]) {
        return response.results[0].formatted_address;
      }
    } catch (err) {
      console.warn("Geocoding failed:", err);
    }
    return `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  };

  const updateLocationFromCoords = async (lat: number, lng: number, placeName?: string) => {
    setErrorMsg(null);
    const address = await reverseGeocode(lat, lng);
    const newLoc: JournalLocation = {
      lat,
      lng,
      address,
      name: placeName || address.split(",")[0],
    };
    onChange(newLoc);

    if (mapInstanceRef.current && googleMapsRef.current) {
      mapInstanceRef.current.panTo({ lat, lng });
      mapInstanceRef.current.setZoom(14);
    }
  };

  // Browser Geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser.");
      return;
    }

    setGeolocating(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setGeolocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        if (mapsAvailable && googleMapsRef.current) {
          await updateLocationFromCoords(lat, lng, "Current Location");
        } else {
          // Fallback if maps API key missing
          const fallbackLoc: JournalLocation = {
            lat,
            lng,
            address: `Current Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
            name: "Current Location",
          };
          onChange(fallbackLoc);
        }
      },
      (err) => {
        setGeolocating(false);
        console.warn("Geolocation error:", err);
        setErrorMsg("Unable to access location. Please check browser permissions or search manually.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Search Place
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (!googleMapsRef.current || !mapsAvailable) {
      // Manual fallback
      const fallbackLoc: JournalLocation = {
        lat: 0,
        lng: 0,
        address: searchQuery.trim(),
        name: searchQuery.trim(),
      };
      onChange(fallbackLoc);
      return;
    }

    setSearching(true);
    setErrorMsg(null);

    try {
      const geocoder = new googleMapsRef.current.Geocoder();
      const response = await geocoder.geocode({ address: searchQuery });
      if (response.results && response.results[0]) {
        const res = response.results[0];
        const lat = res.geometry.location.lat();
        const lng = res.geometry.location.lng();
        const address = res.formatted_address;
        const name = res.address_components?.[0]?.long_name || searchQuery;

        const newLoc: JournalLocation = {
          lat,
          lng,
          address,
          name,
          placeId: res.place_id,
        };
        onChange(newLoc);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo({ lat, lng });
          mapInstanceRef.current.setZoom(14);
        }
      } else {
        setErrorMsg("No results found for that place.");
      }
    } catch (err: any) {
      console.error("Place search error:", err);
      setErrorMsg("Place search failed. Please try again or click directly on the map.");
    } finally {
      setSearching(false);
    }
  };

  // Manual fallback save
  const handleManualSave = () => {
    if (!manualAddress.trim()) {
      onChange(null);
      return;
    }
    onChange({
      lat: location?.lat || 0,
      lng: location?.lng || 0,
      address: manualAddress.trim(),
      name: manualAddress.trim(),
    });
  };

  return (
    <div className="w-full">
      {/* Attached Location Badge / Toggle Button */}
      <div className="flex items-center justify-between">
        {location ? (
          <div className="flex items-center gap-2 rounded-xl border border-gold/40 bg-[#141414] px-3.5 py-2 text-xs text-white font-sans">
            <MapPin className="h-4 w-4 text-gold shrink-0 animate-bounce" />
            <div className="flex flex-col">
              <span className="font-medium text-gold line-clamp-1">
                {location.name || location.address}
              </span>
              {location.lat !== 0 && (
                <span className="text-[10px] text-stone-400 font-mono">
                  {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="ml-2 rounded-md bg-[#0D0D0D] px-2 py-1 text-[10px] uppercase font-sans text-stone-300 hover:text-white border border-sep cursor-pointer"
            >
              {isOpen ? "Hide Map" : "Edit Map"}
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="rounded-md p-1 text-stone-400 hover:text-rose-400 cursor-pointer"
              title="Remove location"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            id="btn-toggle-location-picker"
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center gap-2 rounded-xl border border-sep bg-[#0D0D0D] px-3.5 py-2 text-xs text-stone-300 hover:border-gold hover:text-white transition-all cursor-pointer font-sans"
          >
            <Compass className="h-4 w-4 text-gold" />
            <span>Add Location to Entry</span>
          </button>
        )}
      </div>

      {/* Expanded Location Picker Modal / Panel */}
      {isOpen && (
        <div className="mt-3 rounded-2xl border border-sep bg-[#0A0A0A] p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-sep pb-2">
            <span className="text-[10px] uppercase tracking-[0.2em] font-sans font-bold text-gold flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-gold" />
              <span>Location Memory Pin</span>
            </span>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-stone-500 hover:text-white text-xs cursor-pointer"
            >
              Close
            </button>
          </div>

          {/* Search Bar & Geolocation Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search place, city, or landmark..."
                className="w-full rounded-xl border border-sep bg-[#050505] py-2 pl-3.5 pr-9 text-xs text-white placeholder:text-stone-600 focus:border-gold focus:outline-none font-sans"
              />
              <button
                type="submit"
                disabled={searching}
                className="absolute right-2 text-stone-400 hover:text-gold cursor-pointer"
              >
                {searching ? (
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-stone-600 border-t-gold" />
                ) : (
                  <Search className="h-3.5 w-3.5" />
                )}
              </button>
            </form>

            <button
              type="button"
              id="btn-use-geolocation"
              onClick={handleUseCurrentLocation}
              disabled={geolocating}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-sep bg-[#141414] px-3 py-2 text-xs font-sans text-stone-200 hover:border-gold hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              {geolocating ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-stone-600 border-t-gold" />
              ) : (
                <Navigation className="h-3.5 w-3.5 text-gold" />
              )}
              <span>{geolocating ? "Locating..." : "Use Current Location"}</span>
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-950/40 border border-rose-800 p-2.5 text-xs text-rose-300 font-sans">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Google Maps View or Fallback */}
          {loadingMap ? (
            <div className="h-56 rounded-xl border border-sep bg-[#050505] flex items-center justify-center text-xs text-stone-400 font-sans">
              <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-stone-700 border-t-gold mr-2"></div>
              <span>Initializing Google Maps...</span>
            </div>
          ) : mapsAvailable === false ? (
            /* Manual Location Input when Maps SDK Key is not active */
            <div className="rounded-2xl border border-amber-500/30 bg-black/40 p-4 text-xs text-stone-300 font-sans space-y-3 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-amber-400 shrink-0" />
                  <span className="font-bold text-amber-300">Record Place or Memory Location</span>
                </div>
                <span className="text-[10px] uppercase tracking-widest text-stone-400 font-mono">Spatial Metadata</span>
              </div>
              <p className="text-[11px] text-stone-400">
                Enter the name of the place, landmark, or city associated with this entry:
              </p>
              <div className="flex items-center gap-2.5">
                <input
                  type="text"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  placeholder="e.g. Kyoto Gardens, Japan or Home Studio"
                  className="flex-1 rounded-xl glass-input px-3.5 py-2.5 text-xs text-white placeholder:text-stone-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleManualSave}
                  className="rounded-xl bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 px-4 py-2.5 text-xs font-bold text-black hover:shadow-lg hover:shadow-amber-500/20 transition-all cursor-pointer shadow-md"
                >
                  Save Location
                </button>
              </div>
            </div>
          ) : (
            /* Interactive Google Map */
            <div>
              <div
                ref={mapRef}
                className="h-56 w-full rounded-xl border border-sep overflow-hidden shadow-inner"
              />
              <p className="mt-1.5 text-[10px] text-stone-500 font-sans text-center">
                Click anywhere on the map to set pin location.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
