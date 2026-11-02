
import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useCensus } from '../context/CensusContext';
import { auth } from '../components/firebase';
import {
    getAllResidents,
    getSitioStats
} from '../utils/statistics';
import * as XLSX from 'xlsx';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const valueAt = (source, path) =>
    String(path || '')
        .split('.')
        .filter(Boolean)
        .reduce(
            (value, key) => value == null ? undefined : value[key],
            source
        );

const display = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return value;
};

/* Use the same exclusions as Reports.jsx */
function isExcludedField(section, field) {
    const sectionTitle = String(section?.title || '').toLowerCase().trim();
    const label = String(field?.label || '').toLowerCase().trim();
    const key = String(field?.key || '').toLowerCase().trim();
    const path = String(field?.path || '').toLowerCase().trim();

    const excludedSection =
        sectionTitle.includes('declaration') ||
        sectionTitle.includes('certification');

    const excludedLabel =
        label.includes('i certify') ||
        label.includes('certify that') ||
        label.includes('certification') ||
        label.includes('name of declarant') ||
        label.includes('declarant') ||
        label === 'date';

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

    return excludedSection || excludedLabel || excludedKey || excludedPath;
}

function getAnswer(record, section, field) {
    const key = field.key || field.path || '';

    if (section.repeatable) {
        const rows = Array.isArray(record?.[section.repeatable])
            ? record[section.repeatable]
            : [];

        return rows
            .map((row) => {
                const value = field.path
                    ? valueAt(row, field.path)
                    : row?.[key];

                return display(value);
            })
            .filter((value) => value !== '')
            .join('; ');
    }

    let answer = field.path
        ? valueAt(record, field.path)
        : undefined;

    if (answer === undefined && field.key) {
        answer =
            record?.customFields?.[field.key] ??
            record?.[field.key];
    }

    if (
        answer === undefined &&
        field.path?.startsWith('customFields.')
    ) {
        answer = record?.customFields?.[
            field.path.slice('customFields.'.length)
        ];
    }

    return display(answer);
}

export default function ExportData() {
    const {
        records = [],
        addLog,
        recordsLoading = false
    } = useCensus();

    const [schema, setSchema] = useState({ sections: [] });
    const [schemaError, setSchemaError] = useState('');
    const [loadingSchema, setLoadingSchema] = useState(true);

    useEffect(() => {
        let active = true;

        async function loadSchema() {
            try {
                const token = await auth.currentUser?.getIdToken();

                const response = await fetch(
                    `${API_BASE}/api/form-schema`,
                    {
                        headers: token
                            ? { Authorization: `Bearer ${token}` }
                            : {}
                    }
                );

                const body = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(
                        body.message || 'Unable to load form schema.'
                    );
                }

                if (active) {
                    setSchema(
                        body && Array.isArray(body.sections)
                            ? body
                            : { sections: [] }
                    );
                    setSchemaError('');
                }
            } catch (error) {
                if (active) {
                    setSchemaError(
                        error.message || 'Unable to load form schema.'
                    );
                }
            } finally {
                if (active) setLoadingSchema(false);
            }
        }

        loadSchema();

        return () => {
            active = false;
        };
    }, []);

    // Only export active questions that are not excluded.
    const allFields = useMemo(() => {
        return (schema.sections || []).flatMap((section) =>
            (section.fields || [])
                .filter((field) => !isExcludedField(section, field))
                .map((field) => ({ section, field }))
        );
    }, [schema]);

    function excel() {
        if (!records.length) {
            window.alert('No census records available to export.');
            return;
        }

        const summary = getSitioStats(records).map((row) => ({
            Sitio: row.sitio,
            Households: row.households,
            Population: row.population,
            Male: row.male,
            Female: row.female,
            'Senior Citizens': row.senior,
            PWD: row.pwd,
            '4Ps': row.fourPs
        }));

        const households = records.map((record) => {
            const row = {
                'Household Number':
                    record.householdNumber ||
                    record.household_number ||
                    '',

                'Household Head':
                    record.householdHead ||
                    record.household_head ||
                    '',

                Sitio:
                    record.address?.sitio ||
                    record.sitio ||
                    '',

                'Census Year':
                    record.censusYear ||
                    record.census_year ||
                    '',

                'Date Interviewed':
                    record.dateInterviewed ||
                    record.date_interviewed ||
                    '',

                Status: record.status || '',

                'Date Submitted':
                    record.submittedAt ||
                    record.created_at ||
                    ''
            };

            allFields.forEach(({ section, field }) => {
                const heading = `${section.title} - ${field.label}`;
                row[heading] = getAnswer(record, section, field);
            });

            return row;
        });

        const residents = getAllResidents(records).map((resident) => ({
            'Household Number': resident.householdNumber,
            'Household Head': resident.householdHead,
            'Resident Name': resident.fullName,
            Sex: resident.sex,
            Age: resident.age,
            'Date of Birth': resident.dateOfBirth,
            Sitio: resident.sitio,
            'Civil Status': resident.civilStatus,
            'Senior Citizen': resident.seniorCitizen ? 'Yes' : 'No',
            PWD: resident.pwd ? 'Yes' : 'No',
            '4Ps': resident.fourPs ? 'Yes' : 'No',
            Occupation: resident.occupation,
            'Educational Attainment': resident.educationalAttainment
        }));

        const social = summary.map((row) => ({
            Sitio: row.Sitio,
            'Senior Citizens': row['Senior Citizens'],
            PWD: row.PWD,
            '4Ps': row['4Ps']
        }));

        const workbook = XLSX.utils.book_new();

        function addSheet(name, rows, headers) {
            const worksheet = rows.length
                ? XLSX.utils.json_to_sheet(rows)
                : XLSX.utils.aoa_to_sheet([headers]);

            worksheet['!cols'] = headers.map((header) => ({
                wch: Math.min(
                    Math.max(String(header).length + 3, 14),
                    36
                )
            }));

            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                name
            );
        }

        addSheet(
            'SUMMARY',
            summary,
            [
                'Sitio',
                'Households',
                'Population',
                'Male',
                'Female',
                'Senior Citizens',
                'PWD',
                '4Ps'
            ]
        );

        addSheet(
            'HOUSEHOLDS - DYNAMIC',
            households,
            [
                'Household Number',
                'Household Head',
                'Sitio',
                'Census Year',
                'Date Interviewed',
                'Status',
                'Date Submitted',
                ...allFields.map(
                    ({ section, field }) =>
                        `${section.title} - ${field.label}`
                )
            ]
        );

        addSheet(
            'RESIDENTS',
            residents,
            [
                'Household Number',
                'Household Head',
                'Resident Name',
                'Sex',
                'Age',
                'Date of Birth',
                'Sitio',
                'Civil Status',
                'Senior Citizen',
                'PWD',
                '4Ps',
                'Occupation',
                'Educational Attainment'
            ]
        );

        addSheet(
            'SOCIAL PROGRAMS',
            social,
            [
                'Sitio',
                'Senior Citizens',
                'PWD',
                '4Ps'
            ]
        );

        XLSX.writeFile(
            workbook,
            `Barangay_Census_Report_${new Date().getFullYear()}.xlsx`
        );

        if (typeof addLog === 'function') {
            addLog(
                'Admin exported dynamic Excel report',
                'Export Data',
                `${records.length} households`
            );
        }
    }

    return (
        <AdminLayout
            active="/admin/export"
            title="Export Data"
            subtitle="Download census information for reporting and administrative use."
        >
            {schemaError && (
                <div className="alert alert-danger">
                    {schemaError}
                </div>
            )}

            {(recordsLoading || loadingSchema) && (
                <div className="alert alert-info">
                    Loading census data and form questions...
                </div>
            )}

            <div className="row g-3">

                {/* EXCEL WORKBOOK */}
                <div className="col-md-4">
                    <div className="data-card h-100">
                        <i className="bi bi-file-earmark-spreadsheet display-6 text-success" />

                        <h4 className="mt-3">
                            Excel Workbook
                        </h4>

                        <p className="text-secondary">
                            Export household records, residents,
                            Sitio summaries and active Form Builder
                            questions with their submitted answers.
                        </p>

                        <div className="small text-secondary mb-3">
                            <div>{records.length} households</div>
                            <div>{allFields.length} active questions</div>
                        </div>

                        <button
                            type="button"
                            className="btn btn-success"
                            onClick={excel}
                            disabled={
                                recordsLoading ||
                                loadingSchema ||
                                !!schemaError ||
                                records.length === 0
                            }
                        >
                            EXPORT TO EXCEL
                        </button>
                    </div>
                </div>

                {/* PDF */}
                <div className="col-md-4">
                    <div className="data-card h-100">
                        <i className="bi bi-file-earmark-pdf display-6 text-danger" />

                        <h4 className="mt-3">
                            PDF / Print
                        </h4>

                        <p className="text-secondary">
                            Use the browser print dialog to save
                            a report as PDF.
                        </p>

                        <button
                            type="button"
                            className="btn btn-outline-danger"
                            onClick={() => window.print()}
                        >
                            EXPORT PDF
                        </button>
                    </div>
                </div>

                {/* PRINT REPORT */}
                <div className="col-md-4">
                    <div className="data-card h-100">
                        <i className="bi bi-printer display-6 text-primary" />

                        <h4 className="mt-3">
                            Print Report
                        </h4>

                        <p className="text-secondary">
                            Print the current page or report preview.
                        </p>

                        <button
                            type="button"
                            className="btn btn-outline-primary"
                            onClick={() => window.print()}
                        >
                            PRINT REPORT
                        </button>
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}
