// Recorded preferences take precedence over predicted fit and outside reviews.
export function personalRating(bottle) {
  if (bottle.avg_rating != null && Number.isFinite(Number(bottle.avg_rating))) return Number(bottle.avg_rating);
  const tags = bottle.status_tags || [];
  if (tags.includes("dislike") || tags.includes("avoid")) return 2;
  if (tags.includes("favorite")) return 9;
  return null;
}

export function comparePersonalRank(a, b) {
  const ar = personalRating(a), br = personalRating(b);
  if (ar != null || br != null) {
    if (ar == null) return 1;
    if (br == null) return -1;
    if (ar !== br) return br - ar;
  } else {
    const fit = (b.palate_match ?? -1) - (a.palate_match ?? -1);
    if (fit) return fit;
  }
  return (a.name || "").localeCompare(b.name || "") || a.id - b.id;
}
