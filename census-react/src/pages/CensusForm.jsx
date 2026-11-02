import { useEffect, useMemo, useState } from 'react';
import { auth } from '../components/firebase';
import { useNavigate } from 'react-router-dom';
import { useCensus } from '../context/CensusContext';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/form-schema`;

const today = () => new Date().toISOString().slice(0, 10);

const uid = () =>
    globalThis.crypto?.randomUUID?.() ||
    `row_${Date.now()}_${Math.random().toString(36).slice(2)}`;

const initial = {
    householdNumber: '',
    householdHead: '',
    censusYear: String(new Date().getFullYear()),
    dateInterviewed: today(),

    firstName: '',
    middleName: '',
    lastName: '',
    suffix: '',
    sex: '',
    dateOfBirth: '',
    age: '',
    birthplace: '',
    civilStatus: '',
    citizenship: 'Filipino',
    religion: '',

    seniorCitizen: false,
    pwd: false,
    fourPs: false,
    fourPsHousehold: false,

    address: {
        houseNumber: '',
        street: '',
        sitio: '',
        barangay: 'Barangay San Isidro',
        municipality: '',
        province: ''
    },

    education: {
        attainment: '',
        school: '',
        attending: 'No'
    },

    employment: {
        occupation: '',
        status: '',
        employer: '',
        incomeRange: ''
    },

    members: [],

    declaration: {
        certified: false,
        name: '',
        date: today()
    },

    customFields: {}
};

function getPath(obj, path) {
    return String(path || '')
        .split('.')
        .filter(Boolean)
        .reduce((value, key) => value?.[key], obj);
}

function setPath(obj, path, value) {
    const keys = String(path || '').split('.').filter(Boolean);

    if (!keys.length) return obj;

    const copy = { ...obj };
    let target = copy;
    let source = obj;

    keys.forEach((key, index) => {
        if (index === keys.length - 1) {
            target[key] = value;
        } else {
            target[key] = { ...(source?.[key] || {}) };
            target = target[key];
            source = source?.[key] || {};
        }
    });

    return copy;
}

function makeRow(section) {
    const row = { id: uid() };

    (section.fields || []).forEach((field) => {
        const key = field.key || field.path;

        if (!key) return;

        row[key] = field.type === 'checkbox' ? false : '';
    });

    return row;
}

const fieldPath = (field) =>
    field.path || `customFields.${field.key}`;

function isCharacterReferenceSection(section) {
    const title = String(section?.title || '').toLowerCase();
    const repeatable = String(section?.repeatable || '').toLowerCase();

    return (
        repeatable === 'characterreferences' ||
        repeatable === 'character_references' ||
        repeatable === 'character-references' ||
        title.includes('character reference')
    );
}

function Field({ field, value, onChange }) {
    const id = `field-${field.id || field.key || field.path}`;
    const required = !!field.required;

    return (
        <div className={
            field.type === 'textarea'
                ? 'col-12 mb-3'
                : 'col-12 col-md-6 col-xl-4 mb-3'
        }>
            <label className="form-label fw-semibold" htmlFor={id}>
                {field.label}
                {required && <span className="text-danger"> *</span>}
            </label>

            {field.type === 'checkbox' ? (
                <div className="form-check form-switch pt-1">
                    <input
                        id={id}
                        className="form-check-input"
                        type="checkbox"
                        checked={!!value}
                        onChange={(event) =>
                            onChange(event.target.checked)
                        }
                    />
                    <label className="form-check-label" htmlFor={id}>
                        {value ? 'Yes' : 'No'}
                    </label>
                </div>
            ) : field.type === 'textarea' ? (
                <textarea
                    id={id}
                    className="form-control"
                    rows="3"
                    value={value ?? ''}
                    required={required}
                    onChange={(event) => onChange(event.target.value)}
                />
            ) : field.type === 'select' ? (
                <select
                    id={id}
                    className="form-select"
                    value={value ?? ''}
                    required={required}
                    onChange={(event) => onChange(event.target.value)}
                >
                    <option value="">Select...</option>
                    {(field.options || []).map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            ) : (
                <input
                    id={id}
                    className="form-control"
                    type={
                        ['text', 'number', 'date', 'email', 'tel']
                            .includes(field.type)
                            ? field.type
                            : 'text'
                    }
                    value={value ?? ''}
                    required={required}
                    onChange={(event) => onChange(event.target.value)}
                />
            )}
        </div>
    );
}

export default function CensusForm({ onExit }) {
    const navigate = useNavigate();
    const { addRecord } = useCensus();

    const [form, setForm] = useState(initial);
    const [schema, setSchema] = useState({ sections: [] });
    const [loadingSchema, setLoadingSchema] = useState(true);
    const [schemaError, setSchemaError] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState([]);

    useEffect(() => {
        let active = true;

        (async () => {
            try {
                const token = await auth.currentUser?.getIdToken();

                const response = await fetch(API, {
                    headers: token
                        ? { Authorization: `Bearer ${token}` }
                        : {}
                });

                const data = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(
                        data.message || 'Could not load census form.'
                    );
                }

                if (active) {
                    const sections = (data.sections || [])
                        .filter(
                            (section) =>
                                !isCharacterReferenceSection(section)
                        );

                    setSchema({
                        ...data,
                        sections
                    });
                }
            } catch (error) {
                if (active) setSchemaError(error.message);
            } finally {
                if (active) setLoadingSchema(false);
            }
        })();

        return () => {
            active = false;
        };
    }, []);

    const setField = (path, value) => {
        setForm((current) => setPath(current, path, value));
    };

    const updateRepeat = (section, rowId, key, value) => {
        setForm((current) => ({
            ...current,
            [section.repeatable]: (current[section.repeatable] || [])
                .map((row) =>
                    row.id === rowId
                        ? { ...row, [key]: value }
                        : row
                )
        }));
    };

    const addRepeat = (section) => {
        setForm((current) => ({
            ...current,
            [section.repeatable]: [
                ...(current[section.repeatable] || []),
                makeRow(section)
            ]
        }));
    };

    const removeRepeat = (section, rowId) => {
        setForm((current) => ({
            ...current,
            [section.repeatable]: (
                current[section.repeatable] || []
            ).filter((row) => row.id !== rowId)
        }));
    };

    const fullName = useMemo(
        () =>
            [
                form.firstName,
                form.middleName,
                form.lastName,
                form.suffix
            ].filter(Boolean).join(' ').trim(),
        [
            form.firstName,
            form.middleName,
            form.lastName,
            form.suffix
        ]
    );

    const submit = async (event) => {
        event.preventDefault();

        const issues = [];

        schema.sections.forEach((section) => {
            if (section.repeatable) {
                (form[section.repeatable] || []).forEach(
                    (row, index) => {
                        section.fields.forEach((field) => {
                            const key = field.key || field.path;

                            if (
                                field.required &&
                                field.type !== 'checkbox' &&
                                !String(row[key] ?? '').trim()
                            ) {
                                issues.push(
                                    `${section.title} – ${field.label} (entry ${index + 1}) is required.`
                                );
                            }
                        });
                    }
                );
            } else {
                section.fields.forEach((field) => {
                    if (field.required) {
                        const value = getPath(
                            form,
                            fieldPath(field)
                        );

                        if (
                            field.type === 'checkbox'
                                ? !value
                                : (
                                    value === undefined ||
                                    value === null ||
                                    String(value).trim() === ''
                                )
                        ) {
                            issues.push(
                                `${field.label} is required.`
                            );
                        }
                    }
                });
            }
        });

        if (!form.householdNumber.trim()) {
            issues.push('Household Number is required.');
        }

        if (!form.householdHead.trim()) {
            issues.push('Household Head is required.');
        }

        if (!fullName) {
            issues.push('Complete the household head name.');
        }

        if (!form.address.sitio.trim()) {
            issues.push('Sitio is required.');
        }

        if (!form.declaration.certified) {
            issues.push('Certification is required.');
        }

        setErrors([...new Set(issues)]);

        if (issues.length) return;

        setSubmitting(true);

        try {
            const payload = {
                ...form,

                householdHead: form.householdHead || fullName,

                seniorCitizen: !!form.seniorCitizen,
                pwd: !!form.pwd,
                fourPs: !!form.fourPs,
                fourPsHousehold: !!form.fourPsHousehold,

                members: (form.members || []).map((member) => ({
                    ...member,
                    seniorCitizen: !!member.seniorCitizen,
                    pwd: !!member.pwd,
                    fourPs: !!member.fourPs
                })),

                customFields: form.customFields || {},
                formSchemaVersion: schema.version || 1
            };

            // Do not include old Character Reference data in submissions.
            delete payload.characterReferences;

            await addRecord(payload);
            setSubmitted(true);
        } catch (error) {
            setErrors([
                error.message || 'Unable to submit census.'
            ]);
        } finally {
            setSubmitting(false);
        }
    };

    const exit = () =>
        onExit
            ? onExit()
            : navigate('/login', { replace: true });

    const resetForm = () => {
        setForm({
            ...initial,
            address: { ...initial.address },
            education: { ...initial.education },
            employment: { ...initial.employment },
            declaration: {
                ...initial.declaration,
                date: today()
            }
        });

        setErrors([]);
        setSubmitted(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="census-user-shell">
            <div
                className="container py-4 py-lg-5"
                style={{ maxWidth: 1120 }}
            >
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={exit}
                    >
                        <i className="bi bi-arrow-left me-2" />
                        Back / Exit
                    </button>
                </div>

                <header className="form-intro mb-4">
                    <span className="section-kicker">
                        BARANGAY CENSUS
                    </span>
                    <h1>Barangay Census Form</h1>
                    <p>
                        Please provide accurate household information.
                        Fields marked <b>*</b> are required.
                    </p>
                </header>

                {loadingSchema && (
                    <div className="alert alert-info">
                        Loading the latest census form...
                    </div>
                )}

                {schemaError && (
                    <div className="alert alert-danger">
                        {schemaError}
                    </div>
                )}

                {errors.length > 0 && (
                    <div className="alert alert-danger">
                        <b>Please review the form:</b>
                        <ul className="mb-0 mt-2">
                            {errors.map((error, index) => (
                                <li key={`${index}-${error}`}>
                                    {error}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {!loadingSchema &&
                    !schemaError &&
                    schema.sections.length === 0 && (
                        <div className="alert alert-warning">
                            Wala pang active form schema. Pakiusap sa
                            administrator na i-save muna ang Census Form Builder.
                        </div>
                    )}

                <form onSubmit={submit}>
                    {schema.sections.map((section, index) => (
                        <section
                            className="census-form-card mb-3"
                            key={section.id}
                        >
                            <div className="section-number">
                                {index + 1}
                            </div>

                            <div className="flex-grow-1 min-w-0">
                                <h2>{section.title}</h2>

                                {section.description && (
                                    <p className="text-secondary">
                                        {section.description}
                                    </p>
                                )}

                                {section.repeatable ? (
                                    <>
                                        {(form[section.repeatable] || [])
                                            .map((row, rowIndex) => (
                                                <div
                                                    className="member-card border rounded-3 p-3 mb-3"
                                                    key={row.id}
                                                >
                                                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                                                        <h6 className="mb-0">
                                                            {section.repeatable === 'members'
                                                                ? 'Household Member'
                                                                : `${section.title} Entry`}{' '}
                                                            {rowIndex + 1}
                                                        </h6>

                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() =>
                                                                removeRepeat(section, row.id)
                                                            }
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>

                                                    <div className="row">
                                                        {section.fields.map((field) => (
                                                            <Field
                                                                key={field.id}
                                                                field={field}
                                                                value={
                                                                    row[
                                                                        field.key || field.path
                                                                    ]
                                                                }
                                                                onChange={(value) =>
                                                                    updateRepeat(
                                                                        section,
                                                                        row.id,
                                                                        field.key || field.path,
                                                                        value
                                                                    )
                                                                }
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}

                                        <button
                                            type="button"
                                            className="btn btn-outline-primary"
                                            onClick={() => addRepeat(section)}
                                        >
                                            ＋ Add{' '}
                                            {section.repeatable === 'members'
                                                ? 'Household Member'
                                                : 'Entry'}
                                        </button>
                                    </>
                                ) : (
                                    <div className="row">
                                        {section.fields.map((field) => (
                                            <Field
                                                key={field.id}
                                                field={field}
                                                value={getPath(
                                                    form,
                                                    fieldPath(field)
                                                )}
                                                onChange={(value) =>
                                                    setField(
                                                        fieldPath(field),
                                                        value
                                                    )
                                                }
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </section>
                    ))}

                    <div className="d-flex justify-content-end">
                        <button
                            type="submit"
                            className="btn btn-census-primary btn-lg px-5"
                            disabled={
                                submitting ||
                                loadingSchema ||
                                !schema.sections.length
                            }
                        >
                            {submitting
                                ? 'Submitting...'
                                : 'SUBMIT CENSUS'}
                        </button>
                    </div>
                </form>

                {submitted && (
                    <div
                        className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
                        style={{
                            background: 'rgba(0,0,0,.6)',
                            zIndex: 9999,
                            padding: 20
                        }}
                    >
                        <div
                            className="bg-white rounded-4 shadow p-4 text-center"
                            style={{ width: '100%', maxWidth: 450 }}
                            role="dialog"
                            aria-modal="true"
                        >
                            <div
                                className="rounded-circle bg-success bg-opacity-10 text-success d-flex justify-content-center align-items-center mx-auto mb-3"
                                style={{
                                    width: 80,
                                    height: 80,
                                    fontSize: 42
                                }}
                            >
                                <i className="bi bi-check-lg" />
                            </div>

                            <h3 className="fw-bold mb-3">
                                Census Submitted Successfully!
                            </h3>

                            <p className="text-secondary mb-4">
                                Your census form has been submitted successfully.
                                Thank you.
                            </p>

                            <div className="d-flex flex-column gap-2">
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={resetForm}
                                >
                                    Submit Another Census
                                </button>

                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={exit}
                                >
                                    Back to Previous Page
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}