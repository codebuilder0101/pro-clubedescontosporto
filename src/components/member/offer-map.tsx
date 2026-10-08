"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

/**
 * Interactive OpenStreetMap view of the venue (Leaflet, loaded on the client
 * only). The marker is a circle so no marker image assets are needed.
 */
export function OfferMap({ latitude, longitude, label }: { latitude: number; longitude: number; label: string }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let map: import("leaflet").Map | undefined;
    import("leaflet").then((L) => {
      if (cancelled || !container.current) return;
      map = L.map(container.current, { scrollWheelZoom: false, zoomControl: true }).setView([latitude, longitude], 16);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      L.circleMarker([latitude, longitude], {
        radius: 13,
        color: "#ffffff",
        weight: 5,
        fillColor: "#D9653B",
        fillOpacity: 1,
      }).addTo(map);
    });
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [latitude, longitude]);

  return <div ref={container} className="map-canvas relative z-0" role="img" aria-label={label} />;
}
