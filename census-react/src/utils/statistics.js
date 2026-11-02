
const getValue = (obj, ...keys) => {
    for (const key of keys) {
        const value = obj?.[key];

        if (
            value !== undefined &&
            value !== null &&
            value !== ''
        ) {
            return value;
        }
    }

    return '';
};

const isYes = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;

    return [
        'yes',
        'true',
        '1',
        'on'
    ].includes(String(value ?? '').trim().toLowerCase());
};

const getFullName = (person = {}) => {
    const existingName = getValue(
        person,
        'fullName',
        'full_name',
        'name'
    );

    if (
        existingName &&
        !/^\d+$/.test(String(existingName).trim())
    ) {
        return String(existingName).trim();
    }

    return [
        getValue(person, 'firstName', 'first_name'),
        getValue(person, 'middleName', 'middle_name'),
        getValue(person, 'lastName', 'last_name'),
        getValue(person, 'suffix')
    ]
        .filter(Boolean)
        .filter((value) => value !== '—')
        .join(' ')
        .trim();
};

const normalizeName = (name) =>
    String(name || '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLowerCase();

const getAge = (person = {}) => {
    const age = getValue(person, 'age');

    if (age !== '') return age;

    const birthDateValue = getValue(
        person,
        'dateOfBirth',
        'date_of_birth'
    );

    if (!birthDateValue) return '';

    const birthDate = new Date(birthDateValue);

    if (Number.isNaN(birthDate.getTime())) return '';

    const today = new Date();

    let calculatedAge =
        today.getFullYear() - birthDate.getFullYear();

    const birthdayNotReached =
        today.getMonth() < birthDate.getMonth() ||
        (
            today.getMonth() === birthDate.getMonth() &&
            today.getDate() < birthDate.getDate()
        );

    if (birthdayNotReached) calculatedAge--;

    return calculatedAge >= 0 ? calculatedAge : '';
};

/*
 * Support household records stored directly
 * or inside a JSON payload.
 */
function getHouseholdData(household = {}) {
    let payload = household.payload;

    if (typeof payload === 'string') {
        try {
            payload = JSON.parse(payload);
        } catch {
            payload = {};
        }
    }

    return {
        ...(payload && typeof payload === 'object' ? payload : {}),
        ...household
    };
}

/*
 * Get the real Household Head name.
 * Do not use a numeric householdHead value as a person's name.
 */
function getHouseholdHeadName(household = {}) {
    const personalName = [
        getValue(household, 'firstName', 'first_name'),
        getValue(household, 'middleName', 'middle_name'),
        getValue(household, 'lastName', 'last_name'),
        getValue(household, 'suffix')
    ]
        .filter(Boolean)
        .filter((value) => value !== '—')
        .join(' ')
        .trim();

    if (personalName) return personalName;

    const storedHead = getValue(
        household,
        'householdHead',
        'household_head'
    );

    if (
        storedHead &&
        !/^\d+$/.test(String(storedHead).trim())
    ) {
        return String(storedHead).trim();
    }

    return '';
}

const normalizeResident = (
    person = {},
    household = {},
    isHouseholdHead = false
) => {
    const data = getHouseholdData(household);

    const address =
        person.address && typeof person.address === 'object'
            ? person.address
            : data.address || {};

    const education =
        person.education && typeof person.education === 'object'
            ? person.education
            : {};

    const employment =
        person.employment && typeof person.employment === 'object'
            ? person.employment
            : {};

    const fullName = getFullName(person);

    const householdHeadName =
        getHouseholdHeadName(data);

    return {
        ...person,

        id:
            person.id ||
            person.residentId ||
            person.resident_id ||
            '',

        fullName: fullName || 'Name not available',

        householdNumber: getValue(
            data,
            'householdNumber',
            'household_number'
        ) || '—',

        householdHead: householdHeadName || '—',

        relationship:
            isHouseholdHead
                ? 'Household Head'
                : getValue(person, 'relationship') || 'Household Member',

        isHouseholdHead,

        sitio:
            getValue(person, 'sitio') ||
            getValue(address, 'sitio') ||
            getValue(data, 'sitio', 'sitio_name') ||
            '—',

        censusYear: getValue(
            data,
            'censusYear',
            'census_year'
        ),

        address,

        sex: getValue(person, 'sex', 'gender') || '—',

        age: getAge(person),

        dateOfBirth: getValue(
            person,
            'dateOfBirth',
            'date_of_birth'
        ),

        civilStatus: getValue(
            person,
            'civilStatus',
            'civil_status'
        ) || '—',

        seniorCitizen: isYes(
            getValue(person, 'seniorCitizen', 'senior_citizen')
        ),

        pwd: isYes(
            getValue(person, 'pwd')
        ),

        fourPs: isYes(
            getValue(person, 'fourPs', 'four_ps')
        ),

        fourPsHousehold: isYes(
            getValue(data, 'fourPsHousehold', 'four_ps_household')
        ),

        occupation:
            getValue(person, 'occupation') ||
            getValue(employment, 'occupation') ||
            '—',

        educationalAttainment:
            getValue(
                person,
                'educationalAttainment',
                'educational_attainment'
            ) ||
            getValue(education, 'attainment') ||
            '—'
    };
};

export function getAllResidents(records = []) {
    const safeRecords = Array.isArray(records)
        ? records
        : [];

    return safeRecords.flatMap((originalHousehold) => {
        if (
            !originalHousehold ||
            typeof originalHousehold !== 'object'
        ) {
            return [];
        }

        const household = getHouseholdData(originalHousehold);

        const members = Array.isArray(household.members)
            ? household.members
            : [];

        const headName = getHouseholdHeadName(household);
        const normalizedHeadName = normalizeName(headName);

        const normalizedMembers = members.map((member) => {
            const memberName = normalizeName(
                getFullName(member)
            );

            return normalizeResident(
                member,
                household,
                normalizedHeadName !== '' &&
                memberName === normalizedHeadName
            );
        });

        const headIndex = normalizedMembers.findIndex(
            (resident) =>
                normalizeName(resident.fullName) === normalizedHeadName &&
                normalizedHeadName !== ''
        );

        if (headName) {
            const headDetails = {
                ...household,
                fullName: headName,
                relationship: 'Household Head',
                isHouseholdHead: true
            };

            const normalizedHead = normalizeResident(
                headDetails,
                household,
                true
            );

            if (headIndex >= 0) {
                const existing = normalizedMembers[headIndex];

                normalizedMembers[headIndex] = {
                    ...normalizedHead,
                    ...existing,
                    fullName: headName,
                    householdHead: headName,
                    relationship: 'Household Head',
                    isHouseholdHead: true,

                    seniorCitizen:
                        existing.seniorCitizen ||
                        normalizedHead.seniorCitizen,

                    pwd:
                        existing.pwd ||
                        normalizedHead.pwd,

                    fourPs:
                        existing.fourPs ||
                        normalizedHead.fourPs
                };
            } else {
                normalizedMembers.unshift(normalizedHead);
            }
        }

        return normalizedMembers;
    });
}

export function getStats(records = []) {
    const safeRecords = Array.isArray(records)
        ? records
        : [];

    const residents = getAllResidents(safeRecords);

    const sitios = [
        ...new Set(
            safeRecords
                .map((original) => {
                    const record = getHouseholdData(original);

                    return (
                        record.address?.sitio ||
                        record.sitio ||
                        record.sitio_name ||
                        ''
                    );
                })
                .filter(Boolean)
        )
    ];

    return {
        households: safeRecords.length,

        population: residents.length,

        senior: residents.filter(
            (resident) => resident.seniorCitizen
        ).length,

        pwd: residents.filter(
            (resident) => resident.pwd
        ).length,

        fourPs: residents.filter(
            (resident) => resident.fourPs
        ).length,

        fourPsHouseholds: safeRecords.filter((original) => {
            const record = getHouseholdData(original);

            return isYes(
                getValue(
                    record,
                    'fourPsHousehold',
                    'four_ps_household'
                )
            );
        }).length,

        sitios: sitios.length,
        residents,
        sitioList: sitios,
        sitiosList: sitios
    };
}

export function getSitioStats(records = []) {
    const safeRecords = Array.isArray(records)
        ? records
        : [];

    const residents = getAllResidents(safeRecords);

    const sitios = [
        ...new Set(
            residents
                .map((resident) => resident.sitio)
                .filter((sitio) => sitio && sitio !== '—')
        )
    ];

    return sitios.map((sitio) => {
        const sitioResidents = residents.filter(
            (resident) => resident.sitio === sitio
        );

        const sitioHouseholds = safeRecords.filter((original) => {
            const record = getHouseholdData(original);

            return (
                record.address?.sitio ||
                record.sitio ||
                record.sitio_name ||
                ''
            ) === sitio;
        });

        return {
            sitio,

            households: sitioHouseholds.length,

            population: sitioResidents.length,

            male: sitioResidents.filter(
                (resident) =>
                    String(resident.sex).toLowerCase() === 'male'
            ).length,

            female: sitioResidents.filter(
                (resident) =>
                    String(resident.sex).toLowerCase() === 'female'
            ).length,

            senior: sitioResidents.filter(
                (resident) => resident.seniorCitizen
            ).length,

            pwd: sitioResidents.filter(
                (resident) => resident.pwd
            ).length,

            fourPs: sitioResidents.filter(
                (resident) => resident.fourPs
            ).length,

            fourPsHouseholds: sitioHouseholds.filter((original) => {
                const record = getHouseholdData(original);

                return isYes(
                    getValue(
                        record,
                        'fourPsHousehold',
                        'four_ps_household'
                    )
                );
            }).length
        };
    });
}
