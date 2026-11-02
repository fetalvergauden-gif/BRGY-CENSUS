-- WARNING: This permanently deletes all census submissions and related records.
-- It preserves user accounts, form builder schema, and application settings.
USE barangay_census_db;
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE custom_field_answers;
TRUNCATE TABLE character_references;
TRUNCATE TABLE household_details;
TRUNCATE TABLE residents;
TRUNCATE TABLE households;
TRUNCATE TABLE activity_logs;
SET FOREIGN_KEY_CHECKS = 1;
