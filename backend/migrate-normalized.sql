-- Run this in phpMyAdmin after selecting barangay_census_db.
-- Safe schema upgrade: preserves existing household and resident payload JSON.
ALTER TABLE residents
 ADD COLUMN IF NOT EXISTS relationship_to_head VARCHAR(100) NOT NULL DEFAULT '',
 ADD COLUMN IF NOT EXISTS sex VARCHAR(30) NOT NULL DEFAULT '',
 ADD COLUMN IF NOT EXISTS date_of_birth DATE NULL,
 ADD COLUMN IF NOT EXISTS age SMALLINT NULL,
 ADD COLUMN IF NOT EXISTS civil_status VARCHAR(60) NOT NULL DEFAULT '',
 ADD COLUMN IF NOT EXISTS occupation VARCHAR(160) NOT NULL DEFAULT '',
 ADD COLUMN IF NOT EXISTS educational_attainment VARCHAR(160) NOT NULL DEFAULT '',
 ADD COLUMN IF NOT EXISTS senior_citizen TINYINT(1) NOT NULL DEFAULT 0,
 ADD COLUMN IF NOT EXISTS pwd TINYINT(1) NOT NULL DEFAULT 0,
 ADD COLUMN IF NOT EXISTS four_ps TINYINT(1) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS household_details (
 household_id VARCHAR(80) PRIMARY KEY, date_interviewed DATE NULL,
 first_name VARCHAR(100) NOT NULL DEFAULT '', middle_name VARCHAR(100) NOT NULL DEFAULT '', last_name VARCHAR(100) NOT NULL DEFAULT '', suffix VARCHAR(30) NOT NULL DEFAULT '',
 sex VARCHAR(30) NOT NULL DEFAULT '', date_of_birth DATE NULL, age SMALLINT NULL, birthplace VARCHAR(180) NOT NULL DEFAULT '', civil_status VARCHAR(60) NOT NULL DEFAULT '', citizenship VARCHAR(100) NOT NULL DEFAULT '', religion VARCHAR(120) NOT NULL DEFAULT '',
 house_number VARCHAR(80) NOT NULL DEFAULT '', street VARCHAR(180) NOT NULL DEFAULT '', barangay VARCHAR(160) NOT NULL DEFAULT '', municipality VARCHAR(160) NOT NULL DEFAULT '', province VARCHAR(160) NOT NULL DEFAULT '',
 educational_attainment VARCHAR(160) NOT NULL DEFAULT '', school VARCHAR(180) NOT NULL DEFAULT '', attending VARCHAR(30) NOT NULL DEFAULT '', occupation VARCHAR(160) NOT NULL DEFAULT '', employment_status VARCHAR(80) NOT NULL DEFAULT '', employer VARCHAR(180) NOT NULL DEFAULT '', income_range VARCHAR(100) NOT NULL DEFAULT '',
 declaration_certified TINYINT(1) NOT NULL DEFAULT 0, declaration_name VARCHAR(180) NOT NULL DEFAULT '', declaration_date DATE NULL,
 CONSTRAINT fk_household_details_household FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS character_references (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, household_id VARCHAR(80) NOT NULL,
 full_name VARCHAR(180) NOT NULL DEFAULT '', address VARCHAR(255) NOT NULL DEFAULT '', contact_number VARCHAR(40) NOT NULL DEFAULT '', relationship VARCHAR(100) NOT NULL DEFAULT '',
 CONSTRAINT fk_references_household FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS custom_field_answers (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, household_id VARCHAR(80) NOT NULL, field_key VARCHAR(160) NOT NULL, field_value JSON NULL,
 CONSTRAINT fk_custom_household FOREIGN KEY (household_id) REFERENCES households(id) ON DELETE CASCADE, INDEX idx_custom_key (field_key)
);
