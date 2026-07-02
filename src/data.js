// Ciudades de la prueba inicial: Madrid, Córdoba y El Puerto de Santa María.
export const CITIES = [
  { id: "madrid", name: "Madrid" },
  { id: "cordoba", name: "Córdoba" },
  { id: "puerto", name: "El Puerto" },
];

// Vista del mapa por ciudad (MapLibre usa [lng, lat]).
export const CITY_VIEW = {
  madrid: { center: [-3.7038, 40.4168], zoom: 13.4 },
  cordoba: { center: [-4.7794, 37.8845], zoom: 14.2 },
  puerto: { center: [-6.2330, 36.5945], zoom: 13.6 },
};

// Filtros del feed / mapa por tipo de local.
export const FILTERS = [
  { key: "all", label: "Todo" },
  { key: "disco", label: "Discotecas" },
  { key: "bar", label: "Bares" },
  { key: "pub", label: "Pubs" },
  { key: "terraza", label: "Terrazas" },
];

export const cityName = (id) => CITIES.find((c) => c.id === id)?.name || "";
