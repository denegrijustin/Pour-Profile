-- Profiles are now named after the drink family they cover rather than the
-- person, because that is how the app is actually used: one for spirits, one
-- for wine. The person is preserved in `person` so attribution isn't lost and
-- the profiles could be split per-person again later without data loss.
--
-- The important behavioural change is that `focus` is now ENFORCED. Previously
-- it was only descriptive: the browse list returned every bottle regardless of
-- the active profile, so the spirits view listed wine. Status and palate were
-- already correctly isolated; the catalog listing was not.
ALTER TABLE profiles ADD COLUMN person TEXT;

UPDATE profiles SET slug='spirits', display_name='Spirits', focus='spirits', person='Justin' WHERE id=1;
UPDATE profiles SET slug='wine',    display_name='Wine',    focus='wine',    person='Lady'   WHERE id=2;
