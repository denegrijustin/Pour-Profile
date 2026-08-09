// Fixed list of outside-opinion sources. A closed enum rather than a text field
// so scores stay groupable and comparable — "Vivino" and "vivino " and "Vivino app"
// would otherwise be three different sources and nothing could be aggregated.
//
// Each source declares its native scale, so the entry form can't record a
// 4.2 as if it were out of 100.
export const RATING_SOURCES = [
  { id: "vivino", label: "Vivino", scale: "5", kind: "wine" },
  { id: "wine_spectator", label: "Wine Spectator", scale: "100", kind: "wine" },
  { id: "wine_enthusiast", label: "Wine Enthusiast", scale: "100", kind: "wine" },
  { id: "james_suckling", label: "James Suckling", scale: "100", kind: "wine" },
  { id: "wine_advocate", label: "Wine Advocate", scale: "100", kind: "wine" },
  { id: "decanter", label: "Decanter", scale: "100", kind: "wine" },
  { id: "whisky_advocate", label: "Whisky Advocate", scale: "100", kind: "spirits" },
  { id: "distiller", label: "Distiller", scale: "5", kind: "spirits" },
  { id: "whiskybase", label: "Whiskybase", scale: "100", kind: "spirits" },
  { id: "breaking_bourbon", label: "Breaking Bourbon", scale: "100", kind: "spirits" },
  { id: "shelf_talker", label: "Shelf talker", scale: "100", kind: "any" },
  { id: "back_label", label: "Back label", scale: "100", kind: "any" },
  { id: "staff_pick", label: "Store staff recommendation", scale: "100", kind: "any" }
];

export function sourcesFor(category) {
  const kind = category === "wine" ? "wine" : "spirits";
  return RATING_SOURCES.filter((s) => s.kind === kind || s.kind === "any");
}

export function sourceLabel(id) {
  return RATING_SOURCES.find((s) => s.id === id)?.label || id;
}

export function sourceScale(id) {
  return RATING_SOURCES.find((s) => s.id === id)?.scale || "100";
}
