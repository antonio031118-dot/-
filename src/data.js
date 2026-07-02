// Ciudades y locales de la prueba inicial: Madrid, Córdoba y El Puerto de Santa María.
export const CITIES = [
  { id: "madrid", name: "Madrid" },
  { id: "cordoba", name: "Córdoba" },
  { id: "puerto", name: "El Puerto" },
];

export const CLUBS = {
  madrid: [
    { id: "mad-kapital", name: "Teatro Kapital", genres: ["Comercial", "Reggaeton"], area: "Atocha", terraza: false },
    { id: "mad-fabrik", name: "Fabrik", genres: ["Techno", "Electrónica"], area: "Humanes", terraza: false },
    { id: "mad-joy", name: "Joy Madrid", genres: ["Comercial"], area: "Sol", terraza: false },
    { id: "mad-mondo", name: "Mondo Disko", genres: ["Techno"], area: "Goya", terraza: false },
    { id: "mad-independance", name: "Independance", genres: ["Indie"], area: "Chueca", terraza: false },
    { id: "mad-shoko", name: "Shôko", genres: ["Comercial", "Reggaeton"], area: "Lavapiés", terraza: false },
    { id: "mad-ocho", name: "Ocho y Medio", genres: ["Indie"], area: "Gran Vía", terraza: false },
  ],
  cordoba: [
    { id: "cor-longrock", name: "Long Rock", genres: ["Indie", "Comercial"], area: "La Ribera", terraza: true },
    { id: "cor-hangar", name: "Hangar", genres: ["Comercial", "Electrónica"], area: "Polígono", terraza: false },
    { id: "cor-aduana", name: "Aduana", genres: ["Comercial", "Reggaeton"], area: "La Ribera", terraza: false },
    { id: "cor-sojo", name: "Sojo Ribera", genres: ["Comercial"], area: "La Ribera", terraza: true },
    { id: "cor-gongora", name: "Sala Góngora", genres: ["Indie"], area: "Centro", terraza: false },
  ],
  puerto: [
    { id: "pto-momart", name: "Momart Theatre", genres: ["Techno", "Electrónica"], area: "Ctra. Sanlúcar", terraza: false },
    { id: "pto-valde", name: "Chiringuito Valdelagrana", genres: ["Comercial", "Reggaeton"], area: "Valdelagrana", terraza: true },
    { id: "pto-sherry", name: "Puerto Sherry", genres: ["Comercial"], area: "Marina", terraza: true },
    { id: "pto-bahia", name: "Sala Bahía", genres: ["Comercial", "Reggaeton"], area: "Centro", terraza: false },
  ],
};

export const GENRES = ["Todas", "Reggaeton", "Techno", "Comercial", "Indie"];

export const cityName = (id) => CITIES.find((c) => c.id === id)?.name || "";
