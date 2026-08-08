-- Seed: Justin's known palate data (favorites/dislikes) + initial discovery queue.
-- Every fact here is either (a) what Justin explicitly stated, or (b) publicly known
-- distillery/product metadata marked with a confidence level. No ratings or tasting
-- notes are fabricated beyond what was actually said (see AGENTS/README for the rule).

INSERT INTO distilleries (name, producer, city, state_region, country, lat, lon, is_sourced_whiskey, notes, source, confidence) VALUES
('Angel''s Envy Distillery', 'Angel''s Envy (Bacardi/Brown-Forman-adjacent, independent craft distillery)', 'Louisville', 'Kentucky', 'USA', 38.2527, -85.7585, 0, 'Own working distillery in downtown Louisville.', 'researched', 'high'),
('Penelope Bourbon (bottler)', 'Penelope Bourbon', 'Lawrenceburg', 'Kentucky', 'USA', 38.0409, -84.9024, 1, 'Penelope is a non-distiller producer that sources and blends whiskey (historically Indiana-distilled stock via MGP, aged/finished/blended by Penelope); exact distillation origin per batch is not publicly guaranteed, so treat as sourced whiskey with low confidence on precise origin.', 'researched', 'low'),
('Jim Beam Distillery (Clermont)', 'Beam Suntory', 'Clermont', 'Kentucky', 'USA', 37.9209, -85.6602, 0, 'Home distillery for the Jim Beam family of bourbons.', 'researched', 'high'),
('Rabbit Hole Distillery', 'Rabbit Hole (Pernod Ricard)', 'Louisville', 'Kentucky', 'USA', 38.2599, -85.7526, 0, 'Own working distillery in Louisville''s NuLu district.', 'researched', 'high'),
('J. Rieger & Co. Distillery', 'J. Rieger & Co.', 'Kansas City', 'Missouri', 'USA', 39.1012, -94.5844, 0, 'Own distillery in Kansas City''s East Bottoms.', 'researched', 'high'),
('Heaven Hill Distillery', 'Heaven Hill Brands', 'Bardstown', 'Kentucky', 'USA', 37.8106, -85.4669, 0, 'Distiller of the Rittenhouse Rye line.', 'researched', 'high'),
('Maker''s Mark Distillery', 'Beam Suntory', 'Loretto', 'Kentucky', 'USA', 37.6109, -85.3958, 0, 'Own working distillery in Loretto, KY.', 'researched', 'high'),
('Four Roses Distillery', 'Kirin (Four Roses)', 'Lawrenceburg', 'Kentucky', 'USA', 38.0356, -84.8996, 0, 'Own working distillery on the Kentucky River in Lawrenceburg.', 'researched', 'high'),
('Woodford Reserve Distillery', 'Brown-Forman', 'Versailles', 'Kentucky', 'USA', 37.9401, -84.7238, 0, 'Own working distillery near Versailles, KY.', 'researched', 'high'),
('Ben Holladay Distillery', 'Ben Holladay Distillery', 'Weston', 'Missouri', 'USA', 39.4053, -94.8697, 0, 'Own distillery in Weston, MO, revival of the historic Weston/McCormick distilling site.', 'researched', 'medium'),
('Buffalo Trace Distillery', 'Sazerac', 'Frankfort', 'Kentucky', 'USA', 38.2098, -84.8716, 0, 'Distiller of Eagle Rare and the Stagg (formerly Stagg Jr / George T. Stagg) lines.', 'researched', 'high'),
('Widow Jane Distillery (bottler)', 'Widow Jane', 'Brooklyn', 'New York', 'USA', 40.6892, -73.9709, 1, 'Widow Jane bottles and (for some lines) distills in Brooklyn, but has historically sourced aged whiskey stock; the exact distillation origin of any specific bottling is not always disclosed, so treat with low confidence until confirmed on the bottle.', 'researched', 'low'),
('Tom''s Town Distilling Co.', 'Tom''s Town Distilling Co.', 'Kansas City', 'Missouri', 'USA', 39.1006, -94.5836, 0, 'Own distillery in the Kansas City Crossroads Arts District.', 'researched', 'medium');

INSERT INTO bottles (name, brand, expression, category, subcategory, distillery_id, origin_country, origin_state, proof, abv, release_type, status_tags, description, category_attrs, data_source, source_confidence) VALUES
('Angel''s Envy Rye', 'Angel''s Envy', 'Rye', 'rye', 'finished_rye', 1, 'USA', 'Kentucky', 100, 50, 'standard', '["tried","favorite","like"]', 'One of Justin''s favorites, and an important palate marker: it shows he does not simply dislike rye. He enjoys rye when it leans rich, sweet, rounded, finished, dessert-like, and vanilla/caramel oriented — this bottle (finished in port wine barrels) fits that profile.', '{}', 'seed_known_favorite', 'medium'),
('Penelope Toasted', 'Penelope Bourbon', 'Toasted', 'bourbon', 'toasted_barrel_finish', 2, 'USA', 'Kentucky', NULL, NULL, 'standard', '["tried","favorite","like"]', 'One of Justin''s favorites and an important palate marker. Hypothesis (not yet confirmed by a written tasting note): its toasted-oak finishing likely signals a preference for toasted oak, caramelization, vanilla, brown sugar, barrel sweetness, richer oak, and a rounded finish. Penelope is a non-distiller producer — see the linked distillery record for sourcing caveats.', '{}', 'seed_known_favorite', 'medium'),
('Jim Beam Green Label', 'Jim Beam', 'Green Label', 'bourbon', NULL, 3, 'USA', 'Kentucky', NULL, NULL, 'standard', '["tried","favorite","like"]', 'Favorite / strong positive, named directly by Justin. Exact current formulation/availability of this specific label was not independently verified — confirm details against the physical bottle when logging a pour.', '{}', 'seed_known_favorite', 'low'),
('J. Rieger Rye', 'J. Rieger & Co.', 'Rye', 'rye', NULL, 5, 'USA', 'Missouri', 90, 45, 'standard', '["tried","dislike","avoid"]', 'Strong dislike. Justin''s own description: it reminded him of cough syrup. Treated as an important negative palate signal for medicinal / syrupy-cherry / herbal-medicinal / sharp herbal-rye combinations — not a general dislike of rye (compare Angel''s Envy Rye, a favorite).', '{}', 'seed_known_dislike', 'medium'),
('Rittenhouse Rye', 'Rittenhouse', 'Bottled-in-Bond', 'rye', 'bottled_in_bond', 6, 'USA', 'Kentucky', 100, 50, 'standard', '["tried","dislike"]', 'Not a favorite (Justin''s own framing — softer than a strong dislike, but grouped with his negative signals).', '{}', 'seed_known_dislike', 'medium'),
('Maker''s Mark', 'Maker''s Mark', 'Original', 'bourbon', NULL, 7, 'USA', 'Kentucky', 90, 45, 'standard', '["tried","dislike"]', 'Do not like. (Justin''s own words.)', '{}', 'seed_known_dislike', 'medium'),
('Four Roses', 'Four Roses', 'Yellow Label', 'bourbon', NULL, 8, 'USA', 'Kentucky', NULL, NULL, 'standard', '["tried","dislike"]', 'Do not like. Justin also reports a general negative association with the Four Roses house style; individual expressions should still be evaluated independently.', '{}', 'seed_known_dislike', 'low'),
('Woodford Reserve Double Oaked', 'Woodford Reserve', 'Double Oaked', 'bourbon', 'double_oaked', 9, 'USA', 'Kentucky', 90.4, 45.2, 'standard', '["want_to_try"]', 'Highest-priority discovery item: double-oaked (re-barreled in a second, deeply toasted/charred barrel), which lines up strongly with Justin''s toasted-oak/caramel/vanilla hypothesis.', '{"discovery_priority":"highest"}', 'seed_discovery', 'medium'),
('Ben Holladay Soft Red Wheat Bottled-in-Bond', 'Ben Holladay Distillery', 'Soft Red Wheat, Bottled-in-Bond', 'bourbon', 'wheated_bottled_in_bond', 10, 'USA', 'Missouri', 100, 50, 'bottled_in_bond', '["want_to_try"]', 'Highest-priority discovery item: a wheated, bottled-in-bond bourbon from a Missouri distillery.', '{"discovery_priority":"highest"}', 'seed_discovery', 'medium'),
('Knob Creek 12 Year', 'Knob Creek', '12 Year', 'bourbon', NULL, 3, 'USA', 'Kentucky', 100, 50, 'standard', '["want_to_try"]', 'Highest-priority discovery item: an older-age, full-proof Beam-family bourbon.', '{"discovery_priority":"highest"}', 'seed_discovery', 'medium'),
('Eagle Rare 10', 'Eagle Rare', '10 Year', 'bourbon', NULL, 11, 'USA', 'Kentucky', 90, 45, 'standard', '["want_to_try"]', 'Profile experiment: a well-aged, balanced Buffalo Trace mashbill bourbon.', '{"discovery_priority":"experiment"}', 'seed_discovery', 'medium'),
('Widow Jane 10', 'Widow Jane', '10 Year', 'bourbon', NULL, 12, 'USA', 'New York', 91, 45.5, 'standard', '["want_to_try"]', 'Profile experiment. Widow Jane has historically sourced aged whiskey; treat the distillation origin as unconfirmed until checked against the specific bottle.', '{"discovery_priority":"experiment"}', 'seed_discovery', 'low'),
('Tom''s Town Rum Cask Bourbon', 'Tom''s Town Distilling Co.', 'Rum Cask Finish', 'bourbon', 'rum_cask_finish', 13, 'USA', 'Missouri', NULL, NULL, 'standard', '["want_to_try"]', 'Profile experiment: rum-cask finishing on a Kansas City-distilled bourbon.', '{"discovery_priority":"experiment"}', 'seed_discovery', 'low'),
('Stagg', 'Stagg', 'Barrel Proof', 'bourbon', 'barrel_proof', 11, 'USA', 'Kentucky', NULL, NULL, 'limited', '["want_to_try"]', 'Major future benchmark. Uncut, barrel-proof bourbon (proof varies by batch/release) — an important test of whether Justin enjoys high proof, dark sweetness, and mature oak, or whether that combination tips into the medicinal/dark-cherry territory he dislikes (see J. Rieger Rye).', '{"discovery_priority":"benchmark"}', 'seed_discovery', 'low');

INSERT INTO brand_signals (brand, sentiment, notes) VALUES
('Rabbit Hole', 'positive', 'Justin generally likes Rabbit Hole products. Treat as a positive brand signal, but do not assume every individual expression will be liked — evaluate each bottle on its own tastings too.'),
('Four Roses', 'negative', 'General negative association with the Four Roses house style, in addition to disliking the standard Yellow Label. Individual expressions (e.g. single barrel, small batch selects) should still be evaluated independently.');

INSERT INTO bottle_flavor_tags (bottle_id, flavor_tag_id) VALUES
(1,60),(1,63),(1,62),(1,2),(1,1),
(2,10),(2,1),(2,2),(2,3),(2,62),
(4,47),(4,18),(4,46);

INSERT INTO tastings (bottle_id, tasted_at, rating, notes, would_drink_again, would_order_again, would_buy_bottle, data_source) VALUES
(1, NULL, NULL, 'One of my favorites.', 1, 1, 1, 'seed_user_statement'),
(2, NULL, NULL, 'One of my favorites.', 1, 1, 1, 'seed_user_statement'),
(3, NULL, NULL, 'Favorite / strong positive.', 1, 1, 1, 'seed_user_statement'),
(4, NULL, NULL, 'Reminded me of cough syrup.', 0, 0, 0, 'seed_user_statement'),
(5, NULL, NULL, 'Not a favorite.', NULL, NULL, 0, 'seed_user_statement'),
(6, NULL, NULL, 'Do not like.', 0, 0, 0, 'seed_user_statement'),
(7, NULL, NULL, 'Do not like.', 0, 0, 0, 'seed_user_statement');

INSERT INTO tasting_flavor_tags (tasting_id, flavor_tag_id) VALUES
(1,60),(1,63),(1,62),(1,2),(1,1),
(2,10),(2,1),(2,2),(2,3),(2,62),
(4,47),(4,18),(4,46);
