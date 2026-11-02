
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import admin from 'firebase-admin';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
const PORT = Number(process.env.PORT || 8080);

app.use(cors({
  origin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),
  credentials: true
}));

app.use(express.json({ limit: '5mb' }));

// ==========================================
// FIREBASE ADMIN INITIALIZATION
// ==========================================

const BACKEND_DIR = path.dirname(fileURLToPath(import.meta.url));

function loadFirebaseServiceAccount() {
  const configuredPath =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    './serviceAccountKey.json';

  const resolved = path.isAbsolute(configuredPath)
    ? configuredPath
    : path.resolve(BACKEND_DIR, configuredPath);

  if (fs.existsSync(resolved)) {
    const parsed = JSON.parse(
      fs.readFileSync(resolved, 'utf8')
    );

    if (
      !parsed.project_id ||
      !parsed.client_email ||
      !parsed.private_key
    ) {
      throw new Error(
        'serviceAccountKey.json is missing required Firebase credentials.'
      );
    }

    return parsed;
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
    const parsed = JSON.parse(raw);

    if (
      !parsed.project_id ||
      !parsed.client_email ||
      !parsed.private_key
    ) {
      throw new Error(
        'FIREBASE_SERVICE_ACCOUNT is missing required credentials.'
      );
    }

    return parsed;
  }

  throw new Error(
    `Firebase Admin key not found. Put the downloaded JSON key at: ${resolved}`
  );
}

let FIREBASE_PROJECT_ID;

try {
  if (!admin.apps.length) {
    const serviceAccount = loadFirebaseServiceAccount();

    FIREBASE_PROJECT_ID =
      process.env.FIREBASE_PROJECT_ID ||
      serviceAccount.project_id;

    if (FIREBASE_PROJECT_ID !== serviceAccount.project_id) {
      throw new Error(
        'Firebase project mismatch between .env and service account.'
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: FIREBASE_PROJECT_ID
    });

    console.log(
      `Firebase Admin initialized for project: ${FIREBASE_PROJECT_ID}`
    );
  } else {
    FIREBASE_PROJECT_ID = admin.app().options.projectId;
  }
} catch (error) {
  console.error(
    'Firebase Admin initialization failed:',
    error.message
  );

  process.exit(1);
}

// ==========================================
// MYSQL DATABASE CONNECTION
// ==========================================

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'barangay_census_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// ==========================================
// GENERAL HELPERS
// ==========================================

const parseJson = (value, fallback = {}) => {
  try {
    return typeof value === 'string'
      ? JSON.parse(value)
      : (value ?? fallback);
  } catch {
    return fallback;
  }
};

const asDate = (value) =>
  value ? String(value).slice(0, 10) || null : null;

const asFlag = (value) => {
  if (
    value === true ||
    value === 1 ||
    value === '1'
  ) {
    return 1;
  }

  if (
    typeof value === 'string' &&
    ['yes', 'true', 'on'].includes(value.trim().toLowerCase())
  ) {
    return 1;
  }

  return 0;
};

const firstValue = (...values) => {
  return values.find(value =>
    value !== undefined &&
    value !== null &&
    value !== ''
  );
};

// ==========================================
// PERSON NAME HELPERS
// ==========================================

function getPersonName(person = {}) {
  const possibleName = firstValue(
    person.fullName,
    person.full_name,
    person.name
  );

  if (
    typeof possibleName === 'string' &&
    possibleName.trim() &&
    !/^\d+$/.test(possibleName.trim())
  ) {
    return possibleName.trim();
  }

  return [
    firstValue(person.firstName, person.first_name),
    firstValue(person.middleName, person.middle_name),
    firstValue(person.lastName, person.last_name),
    person.suffix
  ]
    .filter(value =>
      value &&
      String(value).trim() &&
      String(value).trim() !== '—'
    )
    .map(value => String(value).trim())
    .join(' ')
    .trim();
}

// ==========================================
// HOUSEHOLD HEAD NORMALIZATION
// ==========================================

function ensureHouseholdHeadInMembers(inputRecord = {}) {
  const record = { ...inputRecord };

  const members = Array.isArray(record.members)
    ? [...record.members]
    : [];

  // Get the actual name from the household's personal information.
  const personalName = getPersonName(record);

  const existingHead = String(
    record.householdHead ||
    record.household_head ||
    ''
  ).trim();

  const householdHead =
    personalName ||
    (
      existingHead && !/^\d+$/.test(existingHead)
        ? existingHead
        : ''
    );

  // Keep the original record if no valid head name exists.
  if (!householdHead) {
    record.members = members;
    return record;
  }

  record.householdHead = householdHead;

  // Find whether the head is already inside members.
  const existingIndex = members.findIndex(member =>
    getPersonName(member).toLowerCase() ===
    householdHead.toLowerCase()
  );

  if (existingIndex >= 0) {
    // Update the existing head instead of inserting a duplicate.
    members[existingIndex] = {
      ...members[existingIndex],
      fullName: householdHead,
      relationship: 'Household Head',
      isHouseholdHead: true
    };
  } else {
    // Create the household head from the main census form fields.
    const head = {
      fullName: householdHead,

      firstName: firstValue(
        record.firstName,
        record.first_name,
        ''
      ),

      middleName: firstValue(
        record.middleName,
        record.middle_name,
        ''
      ),

      lastName: firstValue(
        record.lastName,
        record.last_name,
        ''
      ),

      suffix: record.suffix || '',

      relationship: 'Household Head',
      isHouseholdHead: true,

      sex: firstValue(
        record.sex,
        record.gender,
        ''
      ),

      dateOfBirth: firstValue(
        record.dateOfBirth,
        record.date_of_birth,
        ''
      ),

      age: firstValue(
        record.age,
        null
      ),

      birthplace: record.birthplace || '',

      civilStatus: firstValue(
        record.civilStatus,
        record.civil_status,
        ''
      ),

      citizenship: record.citizenship || '',
      religion: record.religion || '',

      seniorCitizen: firstValue(
        record.seniorCitizen,
        record.senior_citizen,
        false
      ),

      pwd: firstValue(
        record.pwd,
        record.isPWD,
        record.is_pwd,
        false
      ),

      fourPs: firstValue(
        record.fourPs,
        record.four_ps,
        record.fourPsBeneficiary,
        record.four_ps_beneficiary,
        false
      ),

      occupation: firstValue(
        record.occupation,
        record.employment?.occupation,
        ''
      ),

      employmentStatus:
        record.employment?.status || '',

      educationalAttainment: firstValue(
        record.educationalAttainment,
        record.educational_attainment,
        record.education?.attainment,
        ''
      ),

      school:
        record.education?.school || '',

      attending:
        record.education?.attending || '',

      address: record.address || {}
    };

    members.unshift(head);
  }

  record.members = members;

  return record;
}

// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================

async function authenticate(req, res, next) {
  try {
    const token = (
      req.headers.authorization || ''
    ).replace(/^Bearer\s+/i, '');

    if (!token) {
      return res.status(401).json({
        message: 'Authentication token is required.'
      });
    }

    req.firebaseUser = await admin
      .auth()
      .verifyIdToken(token);

    const [rows] = await pool.execute(
      'SELECT role FROM users WHERE firebase_uid = ? LIMIT 1',
      [req.firebaseUser.uid]
    );

    req.userRole = rows[0]?.role || 'user';

    next();
  } catch (error) {
    console.error(
      'Firebase authentication failed:',
      error.code || 'AUTH_ERROR',
      error.message
    );

    return res.status(401).json({
      message: 'Firebase authentication failed.',
      code: error.code || 'AUTH_ERROR'
    });
  }
}

const requireAdmin = (req, res, next) => {
  return req.userRole === 'admin'
    ? next()
    : res.status(403).json({
        message: 'Administrator access required.'
      });
};

// ==========================================
// AUTH PROFILE SYNC
// ==========================================

app.post('/api/auth/sync', authenticate, async (req, res) => {
  const {
    displayName = '',
    email = ''
  } = req.body || {};

  await pool.execute(
    `INSERT INTO users
      (firebase_uid, display_name, email, role)
     VALUES (?, ?, ?, 'user')
     ON DUPLICATE KEY UPDATE
      display_name = VALUES(display_name),
      email = VALUES(email)`,
    [
      req.firebaseUser.uid,
      displayName || req.firebaseUser.name || '',
      email || req.firebaseUser.email || ''
    ]
  );

  const [rows] = await pool.execute(
    `SELECT firebase_uid, display_name, email, role
     FROM users
     WHERE firebase_uid = ?`,
    [req.firebaseUser.uid]
  );

  res.json(rows[0]);
});

// ==========================================
// GET ALL CENSUS RECORDS
// ==========================================

app.get('/api/census', authenticate, requireAdmin, async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT id, household_number, payload, status,
            created_at, updated_at
     FROM households
     ORDER BY created_at DESC`
  );

  res.json(
    rows.map(row => {
      const record = parseJson(row.payload, {});

      // Normalize old records when they are read.
      const normalized = ensureHouseholdHeadInMembers(record);

      return {
        ...normalized,
        id: row.id,
        householdNumber: row.household_number,
        status: row.status,
        submittedAt: row.created_at,
        updatedAt: row.updated_at
      };
    })
  );
});

// ==========================================
// GET SINGLE CENSUS RECORD
// ==========================================

app.get('/api/census/:id', authenticate, requireAdmin, async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT id, household_number, payload, status,
            created_at, updated_at
     FROM households
     WHERE id = ?`,
    [req.params.id]
  );

  if (!rows.length) {
    return res.status(404).json({
      message: 'Census record not found.'
    });
  }

  const row = rows[0];

  const record = ensureHouseholdHeadInMembers(
    parseJson(row.payload, {})
  );

  res.json({
    ...record,
    id: row.id,
    householdNumber: row.household_number,
    status: row.status,
    submittedAt: row.created_at,
    updatedAt: row.updated_at
  });
});

// ==========================================
// SAVE NORMALIZED HOUSEHOLD AND RESIDENT DATA
// ==========================================

async function saveNormalizedDetails(conn, householdId, inputRecord) {
  // Always normalize the household head before saving.
  const record = ensureHouseholdHeadInMembers(inputRecord);

  const address = record.address || {};
  const education = record.education || {};
  const employment = record.employment || {};
  const declaration = record.declaration || {};

  // ------------------------------------------
  // SAVE HOUSEHOLD DETAILS
  // ------------------------------------------

  await conn.execute(
    `INSERT INTO household_details (
      household_id,
      date_interviewed,
      first_name,
      middle_name,
      last_name,
      suffix,
      sex,
      date_of_birth,
      age,
      birthplace,
      civil_status,
      citizenship,
      religion,
      house_number,
      street,
      barangay,
      municipality,
      province,
      educational_attainment,
      school,
      attending,
      occupation,
      employment_status,
      employer,
      income_range,
      declaration_certified,
      declaration_name,
      declaration_date
    )
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ON DUPLICATE KEY UPDATE
      date_interviewed=VALUES(date_interviewed),
      first_name=VALUES(first_name),
      middle_name=VALUES(middle_name),
      last_name=VALUES(last_name),
      suffix=VALUES(suffix),
      sex=VALUES(sex),
      date_of_birth=VALUES(date_of_birth),
      age=VALUES(age),
      birthplace=VALUES(birthplace),
      civil_status=VALUES(civil_status),
      citizenship=VALUES(citizenship),
      religion=VALUES(religion),
      house_number=VALUES(house_number),
      street=VALUES(street),
      barangay=VALUES(barangay),
      municipality=VALUES(municipality),
      province=VALUES(province),
      educational_attainment=VALUES(educational_attainment),
      school=VALUES(school),
      attending=VALUES(attending),
      occupation=VALUES(occupation),
      employment_status=VALUES(employment_status),
      employer=VALUES(employer),
      income_range=VALUES(income_range),
      declaration_certified=VALUES(declaration_certified),
      declaration_name=VALUES(declaration_name),
      declaration_date=VALUES(declaration_date)`,
    [
      householdId,
      asDate(record.dateInterviewed),
      record.firstName || '',
      record.middleName || '',
      record.lastName || '',
      record.suffix || '',
      record.sex || '',
      asDate(record.dateOfBirth),
      Number(record.age) || null,
      record.birthplace || '',
      record.civilStatus || '',
      record.citizenship || '',
      record.religion || '',
      address.houseNumber || '',
      address.street || '',
      address.barangay || '',
      address.municipality || '',
      address.province || '',
      education.attainment || '',
      education.school || '',
      education.attending || '',
      employment.occupation || '',
      employment.status || '',
      employment.employer || '',
      employment.incomeRange || '',
      asFlag(declaration.certified),
      declaration.name || '',
      asDate(declaration.date)
    ]
  );

  // ------------------------------------------
  // REBUILD NORMALIZED RESIDENTS
  // ------------------------------------------

  await conn.execute(
    'DELETE FROM residents WHERE household_id = ?',
    [householdId]
  );

  const members = Array.isArray(record.members)
    ? record.members
    : [];

  for (const member of members) {
    const fullName = getPersonName(member);

    if (!fullName) continue;

    await conn.execute(
      `INSERT INTO residents (
        household_id,
        full_name,
        relationship_to_head,
        sex,
        date_of_birth,
        age,
        civil_status,
        occupation,
        educational_attainment,
        senior_citizen,
        pwd,
        four_ps,
        payload
      )
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        householdId,
        fullName,
        member.relationship || '',
        member.sex || '',
        asDate(member.dateOfBirth || member.date_of_birth),
        Number(member.age) || null,
        member.civilStatus || member.civil_status || '',
        member.occupation || '',
        member.educationalAttainment ||
          member.educational_attainment ||
          '',
        asFlag(
          member.seniorCitizen ??
          member.senior_citizen
        ),
        asFlag(
          member.pwd ??
          member.isPWD ??
          member.is_pwd
        ),
        asFlag(
          member.fourPs ??
          member.four_ps ??
          member.fourPsBeneficiary
        ),
        JSON.stringify(member)
      ]
    );
  }

  // ------------------------------------------
  // CHARACTER REFERENCES
  // ------------------------------------------

  await conn.execute(
    'DELETE FROM character_references WHERE household_id = ?',
    [householdId]
  );

  for (const reference of (
    Array.isArray(record.characterReferences)
      ? record.characterReferences
      : []
  )) {
    if (
      ![
        reference.name,
        reference.address,
        reference.contactNumber,
        reference.relationship
      ].some(Boolean)
    ) {
      continue;
    }

    await conn.execute(
      `INSERT INTO character_references
       (household_id, full_name, address, contact_number, relationship)
       VALUES (?, ?, ?, ?, ?)`,
      [
        householdId,
        reference.name || '',
        reference.address || '',
        reference.contactNumber || '',
        reference.relationship || ''
      ]
    );
  }

  // ------------------------------------------
  // CUSTOM FIELD ANSWERS
  // ------------------------------------------

  await conn.execute(
    'DELETE FROM custom_field_answers WHERE household_id = ?',
    [householdId]
  );

  const customFields =
    record.customFields &&
    typeof record.customFields === 'object'
      ? record.customFields
      : {};

  for (const [key, value] of Object.entries(customFields)) {
    await conn.execute(
      `INSERT INTO custom_field_answers
       (household_id, field_key, field_value)
       VALUES (?, ?, ?)`,
      [householdId, key, JSON.stringify(value)]
    );
  }

  return record;
}

// ==========================================
// CREATE CENSUS RECORD
// ==========================================

app.post('/api/census', authenticate, async (req, res) => {
  const body = req.body || {};

  // Normalize before inserting into MySQL.
  const id = body.id || `HH-${Date.now()}`;

  let record = {
    ...body,
    id,
    status: body.status || 'Submitted',
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  record = ensureHouseholdHeadInMembers(record);

  if (
    !record.householdNumber ||
    !record.householdHead ||
    !record.address?.sitio
  ) {
    return res.status(400).json({
      message:
        'Household number, household head name, and sitio are required.'
    });
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [duplicate] = await conn.execute(
      'SELECT id FROM households WHERE household_number = ?',
      [record.householdNumber]
    );

    if (duplicate.length) {
      await conn.rollback();

      return res.status(409).json({
        message: 'That household number already exists.'
      });
    }

    // Save the normalized household payload.
    await conn.execute(
      `INSERT INTO households (
        id,
        household_number,
        household_head,
        sitio,
        census_year,
        status,
        payload
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        record.householdNumber,
        record.householdHead,
        record.address.sitio,
        Number(record.censusYear) || new Date().getFullYear(),
        record.status,
        JSON.stringify(record)
      ]
    );

    // Save normalized details and all residents.
    record = await saveNormalizedDetails(
      conn,
      id,
      record
    );

    await conn.execute(
      `INSERT INTO activity_logs
       (firebase_uid, user_label, action, module_name, record_ref, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.firebaseUser.uid,
        req.firebaseUser.name ||
          req.firebaseUser.email ||
          'User',
        'Submitted census',
        'Census Form',
        record.householdNumber,
        'Success'
      ]
    );

    await conn.commit();

    return res.status(201).json(record);

  } catch (error) {
    await conn.rollback();

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Household number already exists.'
      });
    }

    console.error('Create census error:', error);

    return res.status(500).json({
      message: 'Unable to save census record.',
      error: error.message
    });

  } finally {
    conn.release();
  }
});

// ==========================================
// UPDATE CENSUS RECORD
// ==========================================

app.put('/api/census/:id', authenticate, requireAdmin, async (req, res) => {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [rows] = await conn.execute(
      'SELECT payload FROM households WHERE id = ? FOR UPDATE',
      [req.params.id]
    );

    if (!rows.length) {
      await conn.rollback();

      return res.status(404).json({
        message: 'Census record not found.'
      });
    }

    const oldRecord = parseJson(rows[0].payload, {});
    const body = req.body || {};

    let merged = {
      ...oldRecord,
      ...body,
      id: req.params.id,

      address: {
        ...(oldRecord.address || {}),
        ...(body.address || {})
      },

      updatedAt: new Date().toISOString()
    };

    // Normalize the head before updating the payload.
    merged = ensureHouseholdHeadInMembers(merged);

    if (
      !merged.householdNumber ||
      !merged.householdHead ||
      !merged.address?.sitio
    ) {
      await conn.rollback();

      return res.status(400).json({
        message:
          'Household number, household head name, and sitio are required.'
      });
    }

    await conn.execute(
      `UPDATE households
       SET household_number = ?,
           household_head = ?,
           sitio = ?,
           census_year = ?,
           status = ?,
           payload = ?
       WHERE id = ?`,
      [
        merged.householdNumber,
        merged.householdHead,
        merged.address.sitio,
        Number(merged.censusYear) || new Date().getFullYear(),
        merged.status || 'Submitted',
        JSON.stringify(merged),
        req.params.id
      ]
    );

    merged = await saveNormalizedDetails(
      conn,
      req.params.id,
      merged
    );

    await conn.execute(
      `INSERT INTO activity_logs
       (firebase_uid, user_label, action, module_name, record_ref, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.firebaseUser.uid,
        req.firebaseUser.name ||
          req.firebaseUser.email ||
          'Admin',
        'Edited census',
        'Census Records',
        merged.householdNumber,
        'Success'
      ]
    );

    await conn.commit();

    return res.json(merged);

  } catch (error) {
    await conn.rollback();

    console.error('Update census error:', error);

    return res.status(500).json({
      message: 'Unable to update census record.',
      error: error.message
    });

  } finally {
    conn.release();
  }
});

// ==========================================
// DELETE ONE RESIDENT ONLY
// ==========================================

app.delete(
  '/api/census/:id/residents/:memberIndex',
  authenticate,
  requireAdmin,
  async (req, res) => {
    const householdId = req.params.id;
    const memberIndex = Number(req.params.memberIndex);

    if (
      !Number.isInteger(memberIndex) ||
      memberIndex < 0
    ) {
      return res.status(400).json({
        message: 'Invalid resident index.'
      });
    }

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [rows] = await conn.execute(
        `SELECT household_number, household_head, payload
         FROM households
         WHERE id = ?
         FOR UPDATE`,
        [householdId]
      );

      if (!rows.length) {
        await conn.rollback();

        return res.status(404).json({
          message: 'Household record not found.'
        });
      }

      const household = rows[0];

      let record = ensureHouseholdHeadInMembers(
        parseJson(household.payload, {})
      );

      const members = [...record.members];

      if (memberIndex >= members.length) {
        await conn.rollback();

        return res.status(404).json({
          message: 'Resident not found in this household.'
        });
      }

      const resident = members[memberIndex];
      const residentName = getPersonName(resident);

      const headName = String(
        record.householdHead ||
        household.household_head ||
        ''
      ).trim();

      const isHouseholdHead =
        resident.isHouseholdHead === true ||
        resident.is_household_head === true ||
        (
          residentName &&
          headName &&
          residentName.toLowerCase() ===
            headName.toLowerCase()
        );

      if (isHouseholdHead) {
        await conn.rollback();

        return res.status(400).json({
          message:
            'The household head cannot be deleted. Assign another household head before deleting this resident.'
        });
      }

      // Remove only the selected household member.
      members.splice(memberIndex, 1);

      let updatedRecord = {
        ...record,
        members,
        id: householdId,
        updatedAt: new Date().toISOString()
      };

      updatedRecord = ensureHouseholdHeadInMembers(
        updatedRecord
      );

      await conn.execute(
        `UPDATE households
         SET payload = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          JSON.stringify(updatedRecord),
          householdId
        ]
      );

      await saveNormalizedDetails(
        conn,
        householdId,
        updatedRecord
      );

      await conn.execute(
        `INSERT INTO activity_logs
         (firebase_uid, user_label, action, module_name, record_ref, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          req.firebaseUser.uid,
          req.firebaseUser.name ||
            req.firebaseUser.email ||
            'Admin',
          'Deleted resident',
          'Residents',
          `${residentName || 'Resident'} - ${household.household_number}`,
          'Success'
        ]
      );

      await conn.commit();

      return res.json({
        message: 'Resident deleted successfully.',
        householdId,
        householdNumber: household.household_number,
        residentName,
        remainingResidents: updatedRecord.members.length
      });

    } catch (error) {
      await conn.rollback();

      console.error(
        'Resident deletion error:',
        error
      );

      return res.status(500).json({
        message:
          'Unable to delete resident. Check the backend logs.'
      });

    } finally {
      conn.release();
    }
  }
);

// ==========================================
// DELETE ENTIRE HOUSEHOLD CENSUS RECORD
// ==========================================

app.delete('/api/census/:id', authenticate, requireAdmin, async (req, res) => {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [rows] = await conn.execute(
      'SELECT household_number FROM households WHERE id = ?',
      [req.params.id]
    );

    if (!rows.length) {
      await conn.rollback();

      return res.status(404).json({
        message: 'Census record not found.'
      });
    }

    await conn.execute(
      'DELETE FROM households WHERE id = ?',
      [req.params.id]
    );

    await conn.execute(
      `INSERT INTO activity_logs
       (firebase_uid, user_label, action, module_name, record_ref, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.firebaseUser.uid,
        req.firebaseUser.name ||
          req.firebaseUser.email ||
          'Admin',
        'Deleted census',
        'Census Records',
        rows[0].household_number,
        'Success'
      ]
    );

    await conn.commit();

    return res.json({
      message: 'Census record deleted successfully.',
      id: req.params.id
    });

  } catch (error) {
    await conn.rollback();

    console.error('Delete household error:', error);

    return res.status(500).json({
      message: 'Unable to delete census record.'
    });

  } finally {
    conn.release();
  }
});

// ==========================================
// GET CENSUS FORM SCHEMA
// ==========================================

app.get('/api/form-schema', authenticate, async (req, res) => {
  const defaultPath = path.join(
    BACKEND_DIR,
    'default-form-schema.json'
  );

  const defaults = fs.existsSync(defaultPath)
    ? JSON.parse(fs.readFileSync(defaultPath, 'utf8'))
    : {
        version: 2,
        sections: []
      };

  const [rows] = await pool.execute(
    `SELECT schema_json
     FROM form_schema
     WHERE schema_key = ?
     LIMIT 1`,
    ['main']
  );

  if (!rows.length) {
    return res.json(defaults);
  }

  const saved = parseJson(
    rows[0].schema_json,
    { sections: [] }
  );

  const savedSections = Array.isArray(saved.sections)
    ? saved.sections
    : [];

  const savedById = new Map(
    savedSections.map(section => [section.id, section])
  );

  const defaultIds = new Set(
    (defaults.sections || []).map(section => section.id)
  );

  const mergedSections = (defaults.sections || []).map(
    section => savedById.get(section.id) || section
  );

  mergedSections.push(
    ...savedSections.filter(
      section => !defaultIds.has(section.id)
    )
  );

  res.json({
    ...defaults,
    ...saved,
    sections: mergedSections
  });
});

// ==========================================
// UPDATE CENSUS FORM SCHEMA
// ==========================================

app.put('/api/form-schema', authenticate, requireAdmin, async (req, res) => {
  const schema = req.body || {};

  if (!Array.isArray(schema.sections)) {
    return res.status(400).json({
      message: 'Schema sections must be an array.'
    });
  }

  await pool.execute(
    `INSERT INTO form_schema
     (schema_key, schema_json, updated_by)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       schema_json = VALUES(schema_json),
       updated_by = VALUES(updated_by)`,
    [
      'main',
      JSON.stringify(schema),
      req.firebaseUser.uid
    ]
  );

  await pool.execute(
    `INSERT INTO activity_logs
     (firebase_uid, user_label, action, module_name, record_ref, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      req.firebaseUser.uid,
      req.firebaseUser.name ||
        req.firebaseUser.email ||
        'Admin',
      'Updated census form layout',
      'Form Builder',
      'main',
      'Success'
    ]
  );

  res.json(schema);
});

// ==========================================
// ACTIVITY LOGS
// ==========================================

app.get('/api/activity-logs', authenticate, requireAdmin, async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT id, created_at, user_label, action,
            module_name, record_ref, status
     FROM activity_logs
     ORDER BY created_at DESC
     LIMIT 500`
  );

  res.json(
    rows.map(row => ({
      id: row.id,
      date: new Date(row.created_at).toLocaleDateString('en-CA'),
      time: new Date(row.created_at).toLocaleTimeString(
        [],
        {
          hour: '2-digit',
          minute: '2-digit'
        }
      ),
      user: row.user_label,
      action: row.action,
      module: row.module_name,
      record: row.record_ref,
      status: row.status
    }))
  );
});

// ==========================================
// SETTINGS
// ==========================================

app.get('/api/settings', authenticate, requireAdmin, async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT settings_json
     FROM app_settings
     WHERE settings_key = ?`,
    ['main']
  );

  res.json(
    rows.length
      ? parseJson(rows[0].settings_json, {})
      : {}
  );
});

app.put('/api/settings', authenticate, requireAdmin, async (req, res) => {
  await pool.execute(
    `INSERT INTO app_settings
     (settings_key, settings_json)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE
       settings_json = VALUES(settings_json)`,
    [
      'main',
      JSON.stringify(req.body || {})
    ]
  );

  res.json({
    message: 'Settings saved.'
  });
});

// ==========================================
// HEALTH CHECK
// ==========================================

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');

    res.json({
      status: 'ok',
      service: 'Barangay Census API',
      database: 'MySQL connected',
      firebaseAdmin: admin.apps.length
        ? 'initialized'
        : 'not initialized',
      firebaseProject:
        FIREBASE_PROJECT_ID ||
        admin.app().options.projectId ||
        null
    });

  } catch (error) {
    console.error(
      'Health check failed:',
      error.message
    );

    res.status(503).json({
      status: 'error',
      service: 'Barangay Census API',
      database: 'MySQL disconnected',
      message: error.message
    });
  }
});

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================

app.use((error, req, res, next) => {
  console.error('Server error:', error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    message:
      'Server error. Check backend logs and MySQL connection.'
  });
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(
    `Barangay Census API running at http://localhost:${PORT}`
  );
});
