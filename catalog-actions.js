
// Keep the reaction flow identical on Home, Discover, and the detail sheet.
export async function rateCatalogBottle(catalogId, dispatchNav, { client, openRating } = {}) {
  client ||= (await import('./api.js')).api;
  openRating ||= (await import('./log-pour.js')).openLogPourSheet;
  const result = await client.catalogAdopt({ catalog_id: catalogId, status_tags: ['tried'] });
  if (!result.bottle_id) throw new Error('Could not open this bottle for rating. Please try again.');
  const { bottle } = await client.bottle(result.bottle_id);
  await openRating(bottle, { onSaved: () => dispatchNav('bottle', result.bottle_id) });
  return result;
}
