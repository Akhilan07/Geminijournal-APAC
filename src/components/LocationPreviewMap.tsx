/// <reference types="google.maps" />
import React, { useEffect, useRef, useState } from "react";
import { MapPin, ExternalLink, Compass } from "lucide-react";
import type { JournalLocation } from "../types";
import { loadGoogleMaps } from "../lib/googleMapsLoader";

interface LocationPreviewMapProps {
  location: JournalLocation;
  compact?: boolean;
}

export const LocationPreviewMap: React.FC<LocationPreviewMapProps> = ({ location, compact = false }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapsLoaded, setMapsLoaded] = useState<boolean | null>(null);

  useEffect(() => {
    if (!location || location.lat === 0 && location.lng === 0) {
      setMapsLoaded(false);
      return;
    }

    let isMounted = true;
    loadGoogleMaps().then((gMaps) => {
      if (!isMounted) return;
      if (gMaps && mapRef.current) {
        setMapsLoaded(true);

        const position = { lat: location.lat, lng: location.lng };
        const map = new gMaps.Map(mapRef.current, {
          center: position,
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: false,
          gestureHandling: "cooperative",
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
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#17263c" }],
            },
          ],
        });

        new gMaps.Marker({
          position,
          map,
          title: location.name || location.address,
        });
      } else {
        setMapsLoaded(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [location]);

  const mapsUrl = location.lat !== 0 && location.lng !== 0
    ? `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}`;

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-md border border-gold/30 bg-[#141414] px-2.5 py-1 text-xs text-gold font-sans">
        <MapPin className="h-3.5 w-3.5 text-gold shrink-0" />
        <span className="font-medium truncate max-w-[200px]">{location.name || location.address}</span>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-stone-400 hover:text-white ml-1"
          title="Open in Google Maps"
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-sep bg-[#0D0D0D] p-3 shadow-md space-y-2 font-sans">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#050505] border border-gold/40 text-gold">
            <Compass className="h-3.5 w-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-white">
              {location.name || "Memory Location"}
            </span>
            <span className="text-[10px] text-stone-400 line-clamp-1">
              {location.address}
            </span>
          </div>
        </div>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 rounded-md border border-sep bg-[#050505] px-2 py-1 text-[10px] uppercase font-sans text-stone-300 hover:border-gold hover:text-white transition-colors"
        >
          <span>Google Maps</span>
          <ExternalLink className="h-3 w-3 text-gold" />
        </a>
      </div>

      {/* Mini-map element or fallback */}
      {mapsLoaded === true ? (
        <div
          ref={mapRef}
          className="h-32 w-full rounded-lg border border-sep overflow-hidden shadow-inner"
        />
      ) : (
        <div className="flex items-center justify-between rounded-lg border border-sep bg-[#050505] px-3 py-2 text-xs text-stone-400">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gold shrink-0" />
            <span className="text-[11px] italic">{location.address}</span>
          </div>
          {location.lat !== 0 && (
            <span className="text-[10px] font-mono text-stone-500">
              {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
