-- Preserve existing profile IDs and all historical ratings/statuses.
UPDATE profiles SET slug='jdad', display_name='JDAD', person='JDAD', focus='both' WHERE id=1;
UPDATE profiles SET slug='lady', display_name='Lady', person='Lady', focus='both' WHERE id=2;
ALTER TABLE tastings ADD COLUMN questionnaire_version INTEGER;
ALTER TABLE tastings ADD COLUMN questionnaire_answers TEXT DEFAULT '{}';
ALTER TABLE tastings ADD COLUMN tasting_style TEXT;
CREATE INDEX IF NOT EXISTS idx_tastings_profile ON tastings(profile_id, tasted_at);
ALTER TABLE tastings ADD COLUMN client_request_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_tastings_client_request ON tastings(profile_id, client_request_id) WHERE client_request_id IS NOT NULL;
