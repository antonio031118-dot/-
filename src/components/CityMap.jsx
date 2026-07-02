import React, { useRef, useEffect } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { CITY_VIEW } from "../data.js";

// Estilo oscuro de Carto: gratuito, sin API key, pega con el tema de la app.
const STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

export default function CityMap({ city, venues, attendance, me, onOpen }) {
  const ref = useRef(null);
  const map = useRef(null);
  const openRef = useRef(onOpen);
  openRef.current = onOpen;

  function geojson() {
    return {
      type: "FeatureCollection",
      features: venues
        .filter((v) => v.lat != null && v.lng != null)
        .map((v) => {
          const list = attendance[v.id] || [];
          const mine = list.some((x) => x.id === me?.id);
          return {
            type: "Feature",
            geometry: { type: "Point", coordinates: [v.lng, v.lat] },
            properties: { id: v.id, name: v.name, count: list.length, mine: mine ? 1 : 0 },
          };
        }),
    };
  }

  // init una sola vez
  useEffect(() => {
    if (map.current || !ref.current) return;
    const view = CITY_VIEW[city] || CITY_VIEW.madrid;
    const m = new maplibregl.Map({
      container: ref.current, style: STYLE,
      center: view.center, zoom: view.zoom, attributionControl: false,
    });
    map.current = m;
    m.addControl(new maplibregl.AttributionControl({ compact: true }));
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    if (navigator.geolocation) {
      m.addControl(new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }), "top-right");
    }

    m.on("load", () => {
      m.addSource("venues", { type: "geojson", data: geojson() });
      m.addLayer({
        id: "v-glow", type: "circle", source: "venues", filter: [">", ["get", "count"], 0],
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "count"], 1, 12, 20, 26, 60, 40],
          "circle-color": "#FF3D8B", "circle-opacity": 0.16, "circle-blur": 0.7,
        },
      });
      m.addLayer({
        id: "v-dot", type: "circle", source: "venues",
        paint: {
          "circle-radius": ["case", [">", ["get", "count"], 0], 7, 5],
          "circle-color": ["case",
            ["==", ["get", "mine"], 1], "#FF3D8B",
            [">", ["get", "count"], 0], "#8B5CF6", "#6E6885"],
          "circle-stroke-width": 2, "circle-stroke-color": "#0B0A12",
        },
      });
      m.addLayer({
        id: "v-count", type: "symbol", source: "venues", filter: [">", ["get", "count"], 0],
        layout: {
          "text-field": ["to-string", ["get", "count"]], "text-size": 11,
          "text-offset": [0, -1.5], "text-font": ["Open Sans Bold"], "text-allow-overlap": true,
        },
        paint: { "text-color": "#F4F1FA", "text-halo-color": "#0B0A12", "text-halo-width": 1.3 },
      });

      m.on("click", "v-dot", (e) => {
        const f = e.features?.[0];
        if (f) openRef.current?.(f.properties.id);
      });
      m.on("mouseenter", "v-dot", () => { m.getCanvas().style.cursor = "pointer"; });
      m.on("mouseleave", "v-dot", () => { m.getCanvas().style.cursor = ""; });
    });

    return () => { m.remove(); map.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // cambio de ciudad
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const view = CITY_VIEW[city] || CITY_VIEW.madrid;
    m.easeTo({ center: view.center, zoom: view.zoom, duration: 700 });
  }, [city]);

  // datos (locales / asistencia)
  useEffect(() => {
    const m = map.current;
    const src = m && m.getSource("venues");
    if (src) src.setData(geojson());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venues, attendance]);

  return <div ref={ref} style={{ position: "absolute", inset: 0 }} />;
}
