/// <reference types="google.maps" />
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

let mapsPromise: Promise<typeof google.maps | null> | null = null;
let cachedApiKey: string | null = null;

export async function fetchGoogleMapsApiKey(): Promise<string> {
  if (cachedApiKey !== null) return cachedApiKey;

  // First check Vite client env
  const viteKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
  if (viteKey && viteKey !== "MY_GOOGLE_MAPS_API_KEY") {
    cachedApiKey = viteKey;
    return viteKey;
  }

  // Fallback to backend config API
  try {
    const res = await fetch("/api/config");
    if (res.ok) {
      const data = await res.json();
      const apiKey = data.googleMapsApiKey || "";
      cachedApiKey = apiKey;
      return apiKey;
    }
  } catch (err) {
    console.warn("Could not fetch API config for Google Maps:", err);
  }

  cachedApiKey = "";
  return "";
}

export async function loadGoogleMaps(): Promise<typeof google.maps | null> {
  if (mapsPromise) return mapsPromise;

  mapsPromise = (async () => {
    try {
      const apiKey = await fetchGoogleMapsApiKey();
      if (!apiKey || apiKey === "MY_GOOGLE_MAPS_API_KEY") {
        console.warn("Google Maps API key is missing or default dummy key.");
        return null;
      }

      setOptions({
        key: apiKey,
        v: "weekly",
      });

      await importLibrary("maps");
      await importLibrary("places");
      await importLibrary("marker");
      return (window as any).google?.maps || null;
    } catch (err) {
      console.error("Failed to load Google Maps SDK:", err);
      return null;
    }
  })();

  return mapsPromise;
}
