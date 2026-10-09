"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

const PORTO: [number, number] = [41.1496, -8.611];

/**
 * Click the map (or drag the pin) to set the venue's coordinates.
 * Calls onChange; the parent keeps the latitude/longitude inputs in sync.
 */
export function MapPicker({
  latitude,
  longitude,
  onChange,
  label,
}: {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
  label: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const api = useRef<{ setView: (lat: number, lng: number) => void } | null>(null);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let cancelled = false;
    let map: import("leaflet").Map | undefined;
    import("leaflet").then((L) => {
      if (cancelled || !container.current) return;
      const start: [number, number] = latitude !== null && longitude !== null ? [latitude, longitude] : PORTO;
      map = L.map(container.current, { scrollWheelZoom: false }).setView(start, latitude !== null ? 17 : 13);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      const pin = L.circleMarker(start, { radius: 12, color: "#fff", weight: 4, fillColor: "#D9653B", fillOpacity: 1 });
      if (latitude !== null) pin.addTo(map);
      const place = (lat: number, lng: number) => {
        pin.setLatLng([lat, lng]);
        if (map && !map.hasLayer(pin)) pin.addTo(map);
      };
      map.on("click", (e) => {
        const lat = Number(e.latlng.lat.toFixed(6));
        const lng = Number(e.latlng.lng.toFixed(6));
        place(lat, lng);
        onChangeRef.current(lat, lng);
      });
      api.current = {
        setView: (lat, lng) => {
          place(lat, lng);
          map?.setView([lat, lng], 17);
        },
      };
    });
    return () => {
      cancelled = true;
      map?.remove();
    };
    // The map is created once; later coordinates come through api.current.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (latitude !== null && longitude !== null) api.current?.setView(latitude, longitude);
  }, [latitude, longitude]);

  return <div ref={container} role="application" aria-label={label} className="relative z-0 h-[320px] overflow-hidden rounded-2xl bg-tile" />;
}
