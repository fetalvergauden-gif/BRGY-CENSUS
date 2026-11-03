
import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useCensus } from '../context/CensusContext';
import { auth } from '../components/firebase';

import {
    getStats,
    getAllResidents,
    getSitioStats
} from '../utils/statistics';

import { API_ENDPOINTS } from '../config/api';

// ==========================================
// HELPERS
// ==========================================

const safe = (value) =>
    value === null || value === undefined || value === ''
        ? '—'
        : value;

const pathValue = (source, path) =>
    String(path || '')
        .split('.')
        .filter(Boolean)
        .reduce(
            (value, key) =>
                value == null ? undefined : value[key],
            source
        );

const yesNo = (value) =>
    typeof value === 'boolean'
        ? value ? 'Yes' : 'No'
        : value;

// Get the actual household data, including JSON payloads.
function getRecordData(record) {
    let payload = record?.payload;

    if (typeof payload === 'string') {
        try {
            payload = JSON.parse(payload);
        } catch {
            payload = {};
        }
    }

    return {
        ...(payload && typeof payload === 'object' ? payload : {}),
        ...record
    };
}

// ==========================================
// EXCLUDE DECLARATION AND CERTIFICATION
// ==========================================

function isExcludedField(section, field) {
    const sectionTitle = String(
        section?.title || ''
    ).toLowerCase().trim();

    const label = String(
        field?.label || ''
    ).toLowerCase().trim();

    const key = String(
        field?.key || ''
    ).toLowerCase().trim();

    const path = String(
        field?.path || ''
    ).toLowerCase().trim();

    const excludedSection =
        sectionTitle.includes('declaration') ||
        sectionTitle.includes('certification');

    const excludedLabel =
        label.includes('i certify') ||
        label.includes('certify that') ||
        label.includes('certification') ||
        label.includes('name of declarant') ||
        label.includes('declarant');

    const excludedKey = [
        'certified',
        'certification',
        'declarant',
        'declarantname'
    ].includes(key);

    const excludedPath = [
        'declaration.certified',
        'declaration.name',
        'declaration.date',
        'certified'
    ].includes(path);

    return (
        excludedSection ||
        excludedLabel ||
        excludedKey ||
        excludedPath
    );
}

// ==========================================
// DYNAMIC REPORT COLUMNS
// ==========================================

function schemaColumns(schema) {
    return (schema?.sections || []).flatMap((section) =>
        (section.fields || [])
            .filter(
                (field) => !isExcludedField(section, field)
            )
            .map((field) => ({
                id: `${section.id || section.title}-${field.id || field.key || field.path}`,
                sectionTitle:
                    section.title || 'Additional Information',
                label:
                    field.label ||
                    field.key ||
                    field.path ||
                    'Question',
                field,
                repeatable: section.repeatable || ''
            }))
    );
}

// ==========================================
// GET ANSWERS FROM HOUSEHOLD RECORD
// ==========================================

function answerFor(record, column) {
    const data = getRecordData(record);
    const { field, repeatable } = column;
    const key = field.key || field.path || '';

    if (repeatable) {
        const rows = Array.isArray(data?.[repeatable])
            ? data[repeatable]
            : [];

        const values = rows.map((row) => {
            const value = field.path
                ? pathValue(row, field.path)
                : row?.[key];

            return value === true
                ? 'Yes'
                : value === false
                    ? 'No'
                    : value;
        }).filter((value) =>
            value !== undefined &&
            value !== null &&
            value !== ''
        );

        return values.length
            ? values.join('; ')
            : '—';
    }

    let value;

    if (field.path) {
        value = pathValue(data, field.path);
    }

    if (value === undefined && field.key) {
        value =
            data?.customFields?.[field.key] ??
            data?.[field.key];
    }

    if (
        value === undefined &&
        field.path?.startsWith('customFields.')
    ) {
        value = data?.customFields?.[
            field.path.slice('customFields.'.length)
        ];
    }

    if (Array.isArray(value)) {
        value = value.join(', ');
    }

    if (typeof value === 'boolean') {
        value = yesNo(value);
    }

    if (value && typeof value === 'object') {
        value = JSON.stringify(value);
    }

    return safe(value);
}

// ==========================================
// HOUSEHOLD HEAD NAME
// ==========================================

function getNameParts(record) {
    const data = getRecordData(record);

    const householdHead =
        data.householdHead ||
        data.household_head ||
        '';

    const firstName =
        data.firstName ||
        data.first_name ||
        householdHead.trim().split(/\s+/)[0] ||
        '';

    const lastName =
        data.lastName ||
        data.last_name ||
        householdHead.trim().split(/\s+/).filter(Boolean).pop() ||
        '';

    return {
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim()
    };
}

// ==========================================
// SORT HOUSEHOLD NUMBERS
// ==========================================

function compareHouseholdNumbers(a, b) {
    return String(a || '').localeCompare(
        String(b || ''),
        undefined,
        {
            numeric: true,
            sensitivity: 'base'
        }
    );
}

// ==========================================
// BUILD HOUSEHOLD REPORT ROW
// ==========================================

function householdRow(record, columns) {
    const data = getRecordData(record);
    const address = data.address || {};

    return {
        id: data.id,

        householdNumber:
            data.householdNumber ||
            data.household_number ||
            '—',

        householdHead:
            data.householdHead ||
            data.household_head ||
            '—',

        sitio:
            address.sitio ||
            data.sitio ||
            data.sitio_name ||
            '—',

        censusYear:
            data.censusYear ||
            data.census_year ||
            '—',

        submittedAt:
            data.submittedAt ||
            data.created_at ||
            data.dateInterviewed ||
            '—',

        answers: columns.map((column) =>
            answerFor(record, column)
        )
    };
}

// ==========================================
// REPORTS COMPONENT
// ==========================================

export default function Reports() {
    const {
        records = [],
        recordsLoading,
        recordsError
    } = useCensus();

    const [schema, setSchema] = useState({
        sections: []
    });

    const [schemaError, setSchemaError] = useState('');

    const [view, setView] = useState('submissions');
    const [sitio, setSitio] = useState('All');
    const [year, setYear] = useState('All');
    const [search, setSearch] = useState('');

    // Default: Last Name A-Z
    const [sortBy, setSortBy] = useState('lastNameAsc');

    // ==========================================
    // LOAD ACTIVE FORM SCHEMA
    // ==========================================

    useEffect(() => {
        let alive = true;

        async function loadSchema() {
            try {
                const token = await auth.currentUser?.getIdToken();

                const response = await fetch(
                    API_ENDPOINTS.formSchema,
                    {
                        headers: token
                            ? {
                                Authorization: `Bearer ${token}`
                            }
                            : {}
                    }
                );

                const body = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(
                        body.message ||
                        'Unable to load the active census form schema.'
                    );
                }

                if (alive) {
                    setSchema(
                        body && Array.isArray(body.sections)
                            ? body
                            : { sections: [] }
                    );

                    setSchemaError('');
                }

            } catch (error) {
                if (alive) {
                    setSchemaError(
                        error.message ||
                        'Unable to load form questions.'
                    );
                }
            }
        }

        loadSchema();

        return () => {
            alive = false;
        };
    }, []);

    // ==========================================
    // DYNAMIC COLUMNS
    // ==========================================

    const columns = useMemo(
        () => schemaColumns(schema),
        [schema]
    );

    // ==========================================
    // SEARCH AND FILTER RECORDS
    // ==========================================

    const filtered = useMemo(() => {
        return records.filter((record) => {
            const data = getRecordData(record);
            const address = data.address || {};

            const recordSitio =
                address.sitio ||
                data.sitio ||
                data.sitio_name ||
                '';

            const recordYear = String(
                data.censusYear ||
                data.census_year ||
                ''
            );

            const nameParts = getNameParts(record);

            const text = [
                data.householdNumber ||
                data.household_number ||
                '',

                data.householdHead ||
                data.household_head ||
                '',

                nameParts.firstName,
                nameParts.lastName,
                recordSitio
            ].join(' ').toLowerCase();

            return (
                (sitio === 'All' || recordSitio === sitio) &&
                (year === 'All' || recordYear === year) &&
                (
                    !search ||
                    text.includes(search.toLowerCase().trim())
                )
            );
        });
    }, [records, sitio, year, search]);

    // ==========================================
    // SORT HOUSEHOLD RECORDS
    // ==========================================

    const sortedRecords = useMemo(() => {
        const result = [...filtered];

        result.sort((recordA, recordB) => {
            const dataA = getRecordData(recordA);
            const dataB = getRecordData(recordB);

            const nameA = getNameParts(recordA);
            const nameB = getNameParts(recordB);

            switch (sortBy) {
                case 'firstNameAsc':
                    return nameA.firstName.localeCompare(
                        nameB.firstName,
                        undefined,
                        { sensitivity: 'base' }
                    );

                case 'firstNameDesc':
                    return nameB.firstName.localeCompare(
                        nameA.firstName,
                        undefined,
                        { sensitivity: 'base' }
                    );

                case 'lastNameAsc':
                    return nameA.lastName.localeCompare(
                        nameB.lastName,
                        undefined,
                        { sensitivity: 'base' }
                    );

                case 'lastNameDesc':
                    return nameB.lastName.localeCompare(
                        nameA.lastName,
                        undefined,
                        { sensitivity: 'base' }
                    );

                case 'householdAsc':
                    return compareHouseholdNumbers(
                        dataA.householdNumber ||
                        dataA.household_number,

                        dataB.householdNumber ||
                        dataB.household_number
                    );

                case 'householdDesc':
                    return compareHouseholdNumbers(
                        dataB.householdNumber ||
                        dataB.household_number,

                        dataA.householdNumber ||
                        dataA.household_number
                    );

                default:
                    return 0;
            }
        });

        return result;
    }, [filtered, sortBy]);

    // ==========================================
    // STATISTICS
    // ==========================================

    const stats = getStats(filtered);
    const residents = getAllResidents(filtered);

    const reportRows = useMemo(
        () => sortedRecords.map(
            (record) => householdRow(record, columns)
        ),
        [sortedRecords, columns]
    );

    // ==========================================
    // AVAILABLE SITIOS
    // ==========================================

    const sitios = [
        ...new Set(
            records.map((record) => {
                const data = getRecordData(record);

                return (
                    data.address?.sitio ||
                    data.sitio ||
                    data.sitio_name
                );
            }).filter(Boolean)
        )
    ].sort();

    // ==========================================
    // AVAILABLE CENSUS YEARS
    // ==========================================

    const years = [
        ...new Set(
            records.map((record) => {
                const data = getRecordData(record);

                return String(
                    data.censusYear ||
                    data.census_year ||
                    ''
                );
            }).filter(Boolean)
        )
    ].sort().reverse();

    // ==========================================
    // RESIDENT DISTRIBUTION
    // ==========================================

    const distribution = (key) =>
        Object.entries(
            residents.reduce((acc, resident) => {
                const value =
                    resident[key] === true
                        ? 'Yes'
                        : resident[key] === false
                            ? 'No'
                            : resident[key] || 'Not specified';

                acc[value] = (acc[value] || 0) + 1;

                return acc;
            }, {})
        );

    // ==========================================
    // REPORT SUMMARY DATA
    // ==========================================

    const summaryRows =
        view === 'sitio'
            ? getSitioStats(filtered).map((row) => ({
                Category: row.sitio,
                Households: row.households,
                Population: row.population,
                Male: row.male,
                Female: row.female,
                'Senior Citizens': row.senior,
                PWD: row.pwd,
                '4Ps': row.fourPs
            }))
            : view === 'sex'
                ? distribution('sex').map(
                    ([Category, Count]) => ({
                        Category,
                        Count
                    })
                )
                : view === 'age'
                    ? distribution('age').map(
                        ([Category, Count]) => ({
                            Category,
                            Count
                        })
                    )
                    : view === 'civil'
                        ? distribution('civilStatus').map(
                            ([Category, Count]) => ({
                                Category,
                                Count
                            })
                        )
                        : view === 'education'
                            ? distribution('educationalAttainment').map(
                                ([Category, Count]) => ({
                                    Category,
                                    Count
                                })
                            )
                            : view === 'occupation'
                                ? distribution('occupation').map(
                                    ([Category, Count]) => ({
                                        Category,
                                        Count
                                    })
                                )
                                : [
                                    {
                                        Category: 'Households',
                                        Count: stats.households
                                    },
                                    {
                                        Category: 'Residents',
                                        Count: stats.population
                                    },
                                    {
                                        Category: 'Senior Citizens',
                                        Count: stats.senior
                                    },
                                    {
                                        Category: 'PWD',
                                        Count: stats.pwd
                                    },
                                    {
                                        Category: '4Ps Beneficiaries',
                                        Count: stats.fourPs
                                    }
                                ];

    const summaryHeaders = summaryRows.length
        ? Object.keys(summaryRows[0])
        : ['Category', 'Count'];

    // ==========================================
    // USER INTERFACE
    // ==========================================

    return (
        <AdminLayout
            active="/admin/reports"
            title="Reports"
            subtitle="View submitted census answers and generate reports using the active Form Builder questions."
        >
            {/* SEARCH AND FILTERS */}

            <div className="data-card mb-3">
                <div className="d-flex flex-wrap align-items-end gap-3">

                    <div
                        className="flex-grow-1"
                        style={{ minWidth: 220 }}
                    >
                        <label className="form-label fw-semibold">
                            Search household
                        </label>

                        <input
                            className="form-control"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Household number, first name, last name or sitio"
                        />
                    </div>

                    <div style={{ minWidth: 160 }}>
                        <label className="form-label fw-semibold">
                            Sitio
                        </label>

                        <select
                            className="form-select"
                            value={sitio}
                            onChange={(event) =>
                                setSitio(event.target.value)
                            }
                        >
                            <option value="All">All</option>

                            {sitios.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ minWidth: 140 }}>
                        <label className="form-label fw-semibold">
                            Census Year
                        </label>

                        <select
                            className="form-select"
                            value={year}
                            onChange={(event) =>
                                setYear(event.target.value)
                            }
                        >
                            <option value="All">All</option>

                            {years.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ minWidth: 230 }}>
                        <label className="form-label fw-semibold">
                            Sort By
                        </label>

                        <select
                            className="form-select"
                            value={sortBy}
                            onChange={(event) =>
                                setSortBy(event.target.value)
                            }
                        >
                            <optgroup label="First Name">
                                <option value="firstNameAsc">
                                    First Name (A–Z)
                                </option>

                                <option value="firstNameDesc">
                                    First Name (Z–A)
                                </option>
                            </optgroup>

                            <optgroup label="Last Name">
                                <option value="lastNameAsc">
                                    Last Name (A–Z)
                                </option>

                                <option value="lastNameDesc">
                                    Last Name (Z–A)
                                </option>
                            </optgroup>

                            <optgroup label="Household Number">
                                <option value="householdAsc">
                                    Lowest to Highest
                                </option>

                                <option value="householdDesc">
                                    Highest to Lowest
                                </option>
                            </optgroup>
                        </select>
                    </div>

                </div>
            </div>

            {/* STATISTICS CARDS */}

            <div className="row g-3 mb-3">
                {[
                    ['Households', stats.households],
                    ['Residents', stats.population],
                    ['Senior Citizens', stats.senior],
                    ['PWD', stats.pwd],
                    ['4Ps Beneficiaries', stats.fourPs]
                ].map(([label, value]) => (
                    <div
                        className="col-6 col-md-4 col-xl"
                        key={label}
                    >
                        <div className="stat-card census-stat h-100 d-flex justify-content-between align-items-center">
                            <span>{label}</span>
                            <b className="ms-auto">{value}</b>
                        </div>
                    </div>
                ))}
            </div>

            {/* REPORT TABLE */}

            <div className="data-card mb-3">

                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                    <div>
                        <h5 className="mb-1">
                            Report Table
                        </h5>

                        <p className="text-secondary mb-0">
                            Dynamic columns are taken from the active Census Form Builder.
                        </p>
                    </div>

                    <span className="badge text-bg-primary">
                        {filtered.length} household records
                    </span>
                </div>

                {/* REPORT VIEW BUTTONS */}

                <div className="d-flex flex-wrap gap-2 mb-3">
                    {[
                        ['submissions', 'Submitted Census Answers'],
                        ['summary', 'Overview'],
                        ['sitio', 'Sitio'],
                        ['sex', 'Sex'],
                        ['age', 'Age'],
                        ['civil', 'Civil Status'],
                        ['education', 'Education'],
                        ['occupation', 'Occupation']
                    ].map(([key, label]) => (
                        <button
                            key={key}
                            type="button"
                            className={`btn btn-sm ${
                                view === key
                                    ? 'btn-primary'
                                    : 'btn-outline-primary'
                            }`}
                            onClick={() => setView(key)}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* LOADING AND ERROR STATES */}

                {recordsLoading ? (
                    <div className="text-center py-5">
                        Loading census records…
                    </div>
                ) : recordsError ? (
                    <div className="alert alert-danger">
                        {recordsError}
                    </div>
                ) : schemaError ? (
                    <div className="alert alert-warning">
                        Form schema could not be loaded: {schemaError}
                    </div>
                ) : view === 'submissions' ? (

                    /* SUBMITTED CENSUS ANSWERS */

                    <div className="table-responsive">
                        <table className="table table-hover table-bordered align-middle report-dynamic-table">

                            <thead className="table-light">
                                <tr>
                                    <th>Household No.</th>
                                    <th>Household Head</th>
                                    <th>Sitio</th>
                                    <th>Year</th>

                                    {columns.map((column) => (
                                        <th key={column.id}>
                                            <span>{column.label}</span>

                                            {column.repeatable && (
                                                <small className="d-block text-secondary">
                                                    {column.sectionTitle}
                                                </small>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {reportRows.length ? (
                                    reportRows.map((row) => (
                                        <tr
                                            key={
                                                row.id ||
                                                row.householdNumber
                                            }
                                        >
                                            <td>{row.householdNumber}</td>
                                            <td>{row.householdHead}</td>
                                            <td>{row.sitio}</td>
                                            <td>{row.censusYear}</td>

                                            {row.answers.map(
                                                (answer, index) => (
                                                    <td
                                                        key={`${row.id}-${columns[index].id}`}
                                                    >
                                                        {answer}
                                                    </td>
                                                )
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={4 + columns.length}
                                            className="text-center text-secondary py-4"
                                        >
                                            No census submissions match the selected filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>

                        </table>
                    </div>

                ) : (

                    /* SUMMARY REPORTS */

                    <div className="table-responsive">
                        <table className="table table-hover table-bordered align-middle">

                            <thead className="table-light">
                                <tr>
                                    {summaryHeaders.map((header) => (
                                        <th key={header}>
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody>
                                {summaryRows.length ? (
                                    summaryRows.map((row, index) => (
                                        <tr
                                            key={`${row.Category || 'row'}-${index}`}
                                        >
                                            {summaryHeaders.map((header) => (
                                                <td key={header}>
                                                    {safe(row[header])}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan={summaryHeaders.length}
                                            className="text-center text-secondary"
                                        >
                                            No report data available.
                                        </td>
                                    </tr>
                                )}
                            </tbody>

                        </table>
                    </div>
                )}

                {view === 'submissions' && (
                    <small className="text-secondary d-block mt-2">
                        Repeatable section answers are displayed as semicolon-separated values for each household.
                    </small>
                )}

            </div>
        </AdminLayout>
    );
}
