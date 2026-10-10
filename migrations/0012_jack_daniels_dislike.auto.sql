-- Justin does not like Jack Daniel's. A negative brand signal keeps every Jack Daniel's bottle out of his
-- recommendations (see brand-avoid.js) and labels it with the reason wherever it still appears.
-- Safe to run more than once.
INSERT INTO brand_signals (brand, sentiment, notes)
SELECT 'Jack Daniel''s', 'negative', 'Justin does not like Jack Daniel''s (his own words). Treated as a brand-wide dislike: no Jack Daniel''s bottle is recommended to him.'
WHERE NOT EXISTS (SELECT 1 FROM brand_signals WHERE lower(brand) = lower('Jack Daniel''s'));
