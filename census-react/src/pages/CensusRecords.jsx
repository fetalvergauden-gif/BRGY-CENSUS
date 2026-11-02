import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { useCensus } from '../context/CensusContext';

const today = () => new Date().toISOString().slice(0, 10);

const asText = (value) =>
    value === null || value === undefined ? '' : String(value);

const blankMember = () => ({
    id: `M-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    fullName: '',
    relationship: '',
    sex: '',
    dateOfBirth: '',
    age: '',
    civilStatus: '',
    occupation: '',
    educationalAttainment: '',
    seniorCitizen: false,
    pwd: false,
    fourPs: false,
});

const emptyForm = () => ({
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
        municipality: 'Quezon City',
        province: 'Metro Manila',
    },

    education: {
        attainment: '',
        school: '',
        attending: 'No',
    },

    employment: {
        occupation: '',
        status: '',
        employer: '',
        incomeRange: '',
    },

    members: [blankMember()],

    declaration: {
        certified: false,
        name: '',
        date: today(),
    },

    status: 'Submitted',
});

/* Supports normal records and records containing a JSON payload */
function getRecordData(record = {}) {
    let payload = record.payload;

    if (typeof payload === 'string') {
        try {
            payload = JSON.parse(payload);
        } catch {
            payload = {};
        }
    }

    return {
        ...(payload && typeof payload === 'object' ? payload : {}),
        ...record,
    };
}

function normalizeRecord(record = {}) {
    const data = getRecordData(record);
    const defaults = emptyForm();

    const members =
        Array.isArray(data.members) && data.members.length
            ? data.members.map((member) => ({
                ...blankMember(),
                ...member,
            }))
            : [blankMember()];

    return {
        ...defaults,
        ...data,

        id: data.id,

        householdNumber: asText(
            data.householdNumber || data.household_number
        ),

        householdHead: asText(
            data.householdHead || data.household_head
        ),

        censusYear: asText(
            data.censusYear || data.census_year || defaults.censusYear
        ),

        dateInterviewed: asText(
            data.dateInterviewed || defaults.dateInterviewed
        ),

        firstName: asText(data.firstName || data.first_name),
        middleName: asText(data.middleName || data.middle_name),
        lastName: asText(data.lastName || data.last_name),
        suffix: asText(data.suffix),

        sex: asText(data.sex),
        dateOfBirth: asText(data.dateOfBirth || data.date_of_birth),
        age: asText(data.age),
        birthplace: asText(data.birthplace),
        civilStatus: asText(data.civilStatus || data.civil_status),
        citizenship: asText(data.citizenship || 'Filipino'),
        religion: asText(data.religion),

        seniorCitizen: Boolean(data.seniorCitizen),
        pwd: Boolean(data.pwd),
        fourPs: Boolean(data.fourPs),
        fourPsHousehold: Boolean(data.fourPsHousehold),

        address: {
            ...defaults.address,
            ...(data.address || {}),
        },

        education: {
            ...defaults.education,
            ...(data.education || {}),
        },

        employment: {
            ...defaults.employment,
            ...(data.employment || {}),
        },

        members,

        declaration: {
            ...defaults.declaration,
            ...(data.declaration || {}),
        },

        status: data.status || 'Submitted',
    };
}

function ModalShell({ title, children, onClose, wide = false }) {
    return (
        <>
            <div
                className="modal-backdrop fade show"
                onClick={onClose}
            />

            <div
                className="modal d-block"
                tabIndex="-1"
                role="dialog"
                aria-modal="true"
            >
                <div
                    className={`modal-dialog modal-dialog-centered ${
                        wide ? 'modal-xl' : ''
                    }`}
                    style={{ maxWidth: wide ? 1140 : 520 }}
                >
                    <div
                        className="modal-content border-0 shadow-lg"
                        style={{
                            borderRadius: 18,
                            overflow: 'hidden',
                            maxHeight: '90vh',
                        }}
                    >
                        <div
                            className="modal-header text-white"
                            style={{
                                background:
                                    'linear-gradient(135deg,#25103f,#6d28d9)',
                            }}
                        >
                            <h5 className="modal-title fw-bold">
                                {title}
                            </h5>

                            <button
                                type="button"
                                className="btn-close btn-close-white"
                                aria-label="Close"
                                onClick={onClose}
                            />
                        </div>

                        {children}
                    </div>
                </div>
            </div>
        </>
    );
}

function Section({ title, subtitle, children }) {
    return (
        <section className="border rounded-3 p-3 p-md-4 mb-4 bg-white">
            <div className="mb-3">
                <h6
                    className="fw-bold mb-1"
                    style={{ color: '#5b21b6' }}
                >
                    {title}
                </h6>

                {subtitle && (
                    <p className="small text-secondary mb-0">
                        {subtitle}
                    </p>
                )}
            </div>

            <div className="row g-3">
                {children}
            </div>
        </section>
    );
}

function Field({
    label,
    value,
    onChange,
    type = 'text',
    options,
    required = false,
    placeholder = '',
    min,
    max,
}) {
    return (
        <div className="col-12 col-md-6">
            <label className="form-label fw-semibold">
                {label}

                {required && (
                    <span className="text-danger"> *</span>
                )}
            </label>

            {options ? (
                <select
                    className="form-select"
                    value={asText(value)}
                    onChange={(event) => onChange(event.target.value)}
                    required={required}
                >
                    <option value="">Select...</option>

                    {options.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            ) : (
                <input
                    className="form-control"
                    type={type}
                    value={asText(value)}
                    onChange={(event) => onChange(event.target.value)}
                    required={required}
                    placeholder={placeholder}
                    min={min}
                    max={max}
                />
            )}
        </div>
    );
}

function CheckField({ label, checked, onChange }) {
    return (
        <div className="col-12 col-sm-6 col-lg-4">
            <label className="form-check d-flex align-items-center gap-2 border rounded-3 p-3 h-100">
                <input
                    className="form-check-input mt-0"
                    type="checkbox"
                    checked={Boolean(checked)}
                    onChange={(event) =>
                        onChange(event.target.checked)
                    }
                />

                <span className="form-check-label fw-semibold">
                    {label}
                </span>
            </label>
        </div>
    );
}

export default function CensusRecords({ onView }) {
    const navigate = useNavigate();

    const {
        records = [],
        addRecord,
        updateRecord,
        deleteRecord,
    } = useCensus();

    const [q, setQ] = useState('');
    const [sitio, setSitio] = useState('All');
    const [year, setYear] = useState('All');
    const [status, setStatus] = useState('All');

    const [modalType, setModalType] = useState('');
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);

    const [form, setForm] = useState(emptyForm());
    const [notice, setNotice] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const normalizedRecords = useMemo(
        () => records.map((record) => getRecordData(record)),
        [records]
    );

    const sitios = useMemo(
        () => [
            ...new Set(
                normalizedRecords
                    .map((record) => record.address?.sitio || record.sitio)
                    .filter(Boolean)
            ),
        ].sort(),
        [normalizedRecords]
    );

    const years = useMemo(
        () => [
            ...new Set(
                normalizedRecords
                    .map((record) => String(record.censusYear || record.census_year || ''))
                    .filter(Boolean)
            ),
        ].sort().reverse(),
        [normalizedRecords]
    );

    const filtered = useMemo(() => {
        const query = q.toLowerCase().trim();

        return normalizedRecords.filter((record) => {
            const householdNumber =
                record.householdNumber || record.household_number || '';

            const householdHead =
                record.householdHead || record.household_head || '';

            const recordSitio =
                record.address?.sitio || record.sitio || '';

            const recordYear = String(
                record.censusYear || record.census_year || ''
            );

            const members = Array.isArray(record.members)
                ? record.members
                : [];

            const matchesSearch =
                !query ||
                asText(householdNumber).toLowerCase().includes(query) ||
                asText(householdHead).toLowerCase().includes(query) ||
                members.some((member) =>
                    asText(member.fullName || member.name)
                        .toLowerCase()
                        .includes(query)
                );

            return (
                matchesSearch &&
                (sitio === 'All' || recordSitio === sitio) &&
                (year === 'All' || recordYear === year) &&
                (
                    status === 'All' ||
                    (record.status || 'Submitted') === status
                )
            );
        });
    }, [normalizedRecords, q, sitio, year, status]);

    function setTop(key, value) {
        setForm((current) => ({
            ...current,
            [key]: value,
        }));
    }

    function setNested(group, key, value) {
        setForm((current) => ({
            ...current,
            [group]: {
                ...(current[group] || {}),
                [key]: value,
            },
        }));
    }

    function setMember(index, key, value) {
        setForm((current) => ({
            ...current,
            members: current.members.map((member, memberIndex) =>
                memberIndex === index
                    ? { ...member, [key]: value }
                    : member
            ),
        }));
    }

    function addMember() {
        setForm((current) => ({
            ...current,
            members: [...current.members, blankMember()],
        }));
    }

    function removeMember(index) {
        setForm((current) => ({
            ...current,
            members:
                current.members.length > 1
                    ? current.members.filter(
                        (_, memberIndex) => memberIndex !== index
                    )
                    : current.members,
        }));
    }

    function openAdd() {
        setError('');
        setNotice('');
        setEditing(null);
        setForm(emptyForm());
        setModalType('add');
    }

    function openEdit(record) {
        setError('');
        setNotice('');
        setEditing(record);
        setForm(normalizeRecord(record));
        setModalType('edit');
    }

    function openView(record) {
        const recordId = record.id;

        if (recordId === undefined || recordId === null || recordId === '') {
            setError('Hindi mabuksan ang detalye: walang record ID ang household na ito.');
            return;
        }

        if (typeof onView === 'function') {
            onView(recordId);
        } else {
            navigate(`/admin/census-details/${encodeURIComponent(recordId)}`);
        }
    }

    async function handleSave(event) {
        event.preventDefault();

        setError('');
        setNotice('');

        const householdNumber = form.householdNumber.trim();
        const householdHead = form.householdHead.trim();
        const sitioValue = form.address.sitio.trim();

        if (!householdNumber || !householdHead || !sitioValue) {
            setError(
                'Please complete Household Number, Household Head, and Sitio.'
            );
            return;
        }

        if (!form.declaration.certified) {
            setError(
                'Please confirm the declaration before saving this record.'
            );
            return;
        }

        setSaving(true);

        try {
            const now = new Date().toISOString();

            const members = form.members.map((member, index) => ({
                ...member,
                id: member.id || `M-${Date.now()}-${index}`,
                fullName: asText(member.fullName).trim(),
                age: member.age === '' ? '' : Number(member.age),
                seniorCitizen: Boolean(member.seniorCitizen),
                pwd: Boolean(member.pwd),
                fourPs: Boolean(member.fourPs),
            }));

            const cleaned = {
                ...form,

                householdNumber,
                householdHead,
                censusYear: Number(form.censusYear),

                firstName: form.firstName.trim(),
                middleName: form.middleName.trim(),
                lastName: form.lastName.trim(),
                suffix: form.suffix.trim(),

                age: form.age === '' ? '' : Number(form.age),

                address: {
                    ...form.address,
                    houseNumber: form.address.houseNumber.trim(),
                    street: form.address.street.trim(),
                    sitio: sitioValue,
                    barangay: form.address.barangay.trim(),
                    municipality: form.address.municipality.trim(),
                    province: form.address.province.trim(),
                },

                education: { ...form.education },
                employment: { ...form.employment },

                members,

                declaration: {
                    ...form.declaration,
                    certified: Boolean(form.declaration.certified),
                    name: asText(form.declaration.name).trim(),
                    date:
                        form.declaration.date ||
                        form.dateInterviewed,
                },

                updatedAt: now,
            };

            // Remove Character References from the saved record.
            delete cleaned.characterReferences;

            if (!cleaned.firstName && !cleaned.lastName) {
                cleaned.firstName = householdHead;
            }

            if (modalType === 'add') {
                await addRecord({
                    ...cleaned,
                    status: cleaned.status || 'Submitted',
                    submittedAt: now,
                    createdAt: now,
                });

                setNotice('Census record added successfully.');
            } else {
                if (!editing?.id) {
                    throw new Error('Missing census record ID.');
                }

                await updateRecord(editing.id, cleaned);

                setNotice('Census record updated successfully.');
            }

            setModalType('');
            setEditing(null);
        } catch (saveError) {
            setError(
                saveError?.message ||
                'Unable to save the record. Please check your connection and try again.'
            );
        } finally {
            setSaving(false);
        }
    }

    async function confirmDelete() {
        if (!deleting) return;

        setError('');
        setNotice('');
        setSaving(true);

        try {
            if (!deleting.id) {
                throw new Error('Missing census record ID.');
            }

            await deleteRecord(deleting.id);

            setNotice(
                `Census record ${
                    deleting.householdNumber || ''
                } deleted successfully.`
            );

            setDeleting(null);
        } catch (deleteError) {
            setError(
                deleteError?.message ||
                'Unable to delete this record. Please try again.'
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <AdminLayout
            active="/admin/census-records"
            title="Census Records"
            subtitle="Search, filter, add, edit, view and manage submitted household records."
        >
            {notice && (
                <div className="alert alert-success alert-dismissible fade show">
                    {notice}

                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => setNotice('')}
                        aria-label="Close"
                    />
                </div>
            )}

            {error && !modalType && !deleting && (
                <div className="alert alert-danger alert-dismissible fade show">
                    {error}

                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => setError('')}
                        aria-label="Close"
                    />
                </div>
            )}

            {/* FILTERS */}
            <div className="data-card mb-3">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
                    <div>
                        <h5 className="mb-1">Household Information</h5>
                        <p className="text-secondary small mb-0">
                            Manage barangay census household records.
                        </p>
                    </div>

                    <button
                        type="button"
                        className="btn btn-census-primary"
                        onClick={openAdd}
                    >
                        <i className="bi bi-plus-lg me-2" />
                        Add Household Record
                    </button>
                </div>

                <div className="row g-2">
                    <div className="col-lg-5">
                        <input
                            className="form-control"
                            placeholder="Search household number, head or resident..."
                            value={q}
                            onChange={(event) => setQ(event.target.value)}
                        />
                    </div>

                    <div className="col-md-4 col-lg-2">
                        <select
                            className="form-select"
                            value={sitio}
                            onChange={(event) => setSitio(event.target.value)}
                        >
                            <option value="All">All Sitios</option>

                            {sitios.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="col-md-4 col-lg-2">
                        <select
                            className="form-select"
                            value={year}
                            onChange={(event) => setYear(event.target.value)}
                        >
                            <option value="All">All Years</option>

                            {years.map((item) => (
                                <option key={item} value={item}>
                                    {item}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="col-md-4 col-lg-2">
                        <select
                            className="form-select"
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                        >
                            <option value="All">All Statuses</option>
                            <option value="Submitted">Submitted</option>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* RECORDS TABLE */}
            <div className="data-card">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">Census Table</h5>

                    <span
                        className="badge rounded-pill"
                        style={{
                            background: '#f3efff',
                            color: '#6d28d9',
                        }}
                    >
                        {filtered.length} records
                    </span>
                </div>

                <div className="table-responsive">
                    <table className="table table-hover align-middle">
                        <thead>
                            <tr>
                                <th>Household</th>
                                <th>Head</th>
                                <th>Sitio</th>
                                <th>Members</th>
                                <th>Senior</th>
                                <th>PWD</th>
                                <th>4Ps</th>
                                <th>Status</th>
                                <th>Date Submitted</th>
                                <th className="text-end">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filtered.map((record, index) => {
                                const members = Array.isArray(record.members)
                                    ? record.members
                                    : [];

                                const seniorCount = members.filter(
                                    (member) => member.seniorCitizen
                                ).length;

                                const pwdCount = members.filter(
                                    (member) => member.pwd
                                ).length;

                                const fourPsCount = members.filter(
                                    (member) => member.fourPs
                                ).length;

                                const submitted =
                                    record.submittedAt ||
                                    record.createdAt ||
                                    record.created_at;

                                return (
                                    <tr key={record.id || index}>
                                        <td className="fw-bold">
                                            {record.householdNumber ||
                                                record.household_number ||
                                                '—'}
                                        </td>

                                        <td>
                                            {record.householdHead ||
                                                record.household_head ||
                                                '—'}
                                        </td>

                                        <td>
                                            {record.address?.sitio ||
                                                record.sitio ||
                                                '—'}
                                        </td>

                                        <td>{members.length}</td>
                                        <td>{seniorCount}</td>
                                        <td>{pwdCount}</td>
                                        <td>{fourPsCount}</td>

                                        <td>
                                            <span className="badge text-bg-success">
                                                {record.status || 'Submitted'}
                                            </span>
                                        </td>

                                        <td>
                                            {submitted
                                                ? new Date(submitted).toLocaleDateString()
                                                : '—'}
                                        </td>

                                        <td className="text-end text-nowrap">
                                            <div className="d-inline-flex gap-1">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-primary"
                                                    title="View details"
                                                    onClick={() => openView(record)}
                                                >
                                                    <i className="bi bi-eye me-1" />
                                                    View
                                                </button>

                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-warning"
                                                    title="Edit record"
                                                    onClick={() => openEdit(record)}
                                                >
                                                    <i className="bi bi-pencil me-1" />
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-danger"
                                                    title="Delete record"
                                                    onClick={() => {
                                                        setError('');
                                                        setDeleting(record);
                                                    }}
                                                >
                                                    <i className="bi bi-trash me-1" />
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {!filtered.length && (
                                <tr>
                                    <td
                                        colSpan="10"
                                        className="text-center py-5 text-secondary"
                                    >
                                        No census records match your filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ADD / EDIT MODAL */}
            {(modalType === 'add' || modalType === 'edit') && (
                <ModalShell
                    wide
                    title={
                        modalType === 'add'
                            ? 'Add Household Record'
                            : 'Edit Census Record'
                    }
                    onClose={() => !saving && setModalType('')}
                >
                    <form onSubmit={handleSave}>
                        <div
                            className="modal-body"
                            style={{
                                overflowY: 'auto',
                                maxHeight: 'calc(90vh - 140px)',
                                background: '#faf9fc',
                            }}
                        >
                            <p className="text-secondary small mb-4">
                                Complete the household and resident information below.
                                Fields marked with * are required.
                            </p>

                            <Section
                                title="1. Household Information"
                                subtitle="Basic census and household identification details."
                            >
                                <Field
                                    label="Household Number"
                                    value={form.householdNumber}
                                    onChange={(value) => setTop('householdNumber', value)}
                                    placeholder="e.g. HH-004"
                                    required
                                />

                                <Field
                                    label="Household Head"
                                    value={form.householdHead}
                                    onChange={(value) => setTop('householdHead', value)}
                                    placeholder="Enter full name"
                                    required
                                />

                                <Field
                                    label="Census Year"
                                    type="number"
                                    min="2000"
                                    max="2100"
                                    value={form.censusYear}
                                    onChange={(value) => setTop('censusYear', value)}
                                    required
                                />

                                <Field
                                    label="Date Interviewed"
                                    type="date"
                                    value={form.dateInterviewed}
                                    onChange={(value) => setTop('dateInterviewed', value)}
                                    required
                                />
                            </Section>

                            <Section title="2. Personal Information">
                                <Field label="First Name" value={form.firstName} onChange={(value) => setTop('firstName', value)} />
                                <Field label="Middle Name" value={form.middleName} onChange={(value) => setTop('middleName', value)} />
                                <Field label="Last Name" value={form.lastName} onChange={(value) => setTop('lastName', value)} />
                                <Field label="Suffix" value={form.suffix} onChange={(value) => setTop('suffix', value)} placeholder="Jr., Sr., III (if applicable)" />
                                <Field label="Sex" value={form.sex} onChange={(value) => setTop('sex', value)} options={['Male', 'Female']} />
                                <Field label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(value) => setTop('dateOfBirth', value)} />
                                <Field label="Age" type="number" min="0" max="130" value={form.age} onChange={(value) => setTop('age', value)} />
                                <Field label="Birthplace" value={form.birthplace} onChange={(value) => setTop('birthplace', value)} />
                                <Field label="Civil Status" value={form.civilStatus} onChange={(value) => setTop('civilStatus', value)} options={['Single', 'Married', 'Widowed', 'Separated', 'Divorced', 'Live-in']} />
                                <Field label="Citizenship" value={form.citizenship} onChange={(value) => setTop('citizenship', value)} />
                                <Field label="Religion" value={form.religion} onChange={(value) => setTop('religion', value)} />

                                <CheckField label="Senior Citizen" checked={form.seniorCitizen} onChange={(value) => setTop('seniorCitizen', value)} />
                                <CheckField label="Person with Disability (PWD)" checked={form.pwd} onChange={(value) => setTop('pwd', value)} />
                                <CheckField label="4Ps Beneficiary" checked={form.fourPs} onChange={(value) => setTop('fourPs', value)} />
                                <CheckField label="4Ps Household Beneficiary" checked={form.fourPsHousehold} onChange={(value) => setTop('fourPsHousehold', value)} />
                            </Section>

                            <Section title="3. Address">
                                <Field label="House Number" value={form.address.houseNumber} onChange={(value) => setNested('address', 'houseNumber', value)} />
                                <Field label="Street" value={form.address.street} onChange={(value) => setNested('address', 'street', value)} />
                                <Field label="Sitio" value={form.address.sitio} onChange={(value) => setNested('address', 'sitio', value)} placeholder="e.g. Sitio 1" required />
                                <Field label="Barangay" value={form.address.barangay} onChange={(value) => setNested('address', 'barangay', value)} />
                                <Field label="Municipality / City" value={form.address.municipality} onChange={(value) => setNested('address', 'municipality', value)} />
                                <Field label="Province" value={form.address.province} onChange={(value) => setNested('address', 'province', value)} />
                            </Section>

                            <Section title="4. Educational Information">
                                <Field
                                    label="Educational Attainment"
                                    value={form.education.attainment}
                                    onChange={(value) => setNested('education', 'attainment', value)}
                                    options={[
                                        'No Formal Education',
                                        'Elementary Level',
                                        'Elementary Graduate',
                                        'High School Level',
                                        'High School Graduate',
                                        'Senior High School',
                                        'Vocational',
                                        'College Level',
                                        'College Graduate',
                                        'Postgraduate',
                                    ]}
                                />

                                <Field
                                    label="School / Institution"
                                    value={form.education.school}
                                    onChange={(value) => setNested('education', 'school', value)}
                                />

                                <Field
                                    label="Currently Attending School"
                                    value={form.education.attending}
                                    onChange={(value) => setNested('education', 'attending', value)}
                                    options={['Yes', 'No']}
                                />
                            </Section>

                            <Section title="5. Employment / Livelihood">
                                <Field label="Occupation" value={form.employment.occupation} onChange={(value) => setNested('employment', 'occupation', value)} />

                                <Field
                                    label="Employment Status"
                                    value={form.employment.status}
                                    onChange={(value) => setNested('employment', 'status', value)}
                                    options={[
                                        'Employed',
                                        'Self-employed',
                                        'Unemployed',
                                        'Student',
                                        'Retired',
                                        'Homemaker',
                                        'Unable to work',
                                    ]}
                                />

                                <Field label="Employer" value={form.employment.employer} onChange={(value) => setNested('employment', 'employer', value)} />

                                <Field
                                    label="Income Range"
                                    value={form.employment.incomeRange}
                                    onChange={(value) => setNested('employment', 'incomeRange', value)}
                                    options={[
                                        'No Income',
                                        'Below ₱5,000',
                                        '₱5,000–₱9,999',
                                        '₱10,000–₱19,999',
                                        '₱20,000–₱29,999',
                                        '₱30,000 and above',
                                    ]}
                                />
                            </Section>

                            <Section
                                title="6. Household Members"
                                subtitle="Add every person living in this household."
                            >
                                <div className="col-12 d-flex justify-content-end">
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={addMember}
                                    >
                                        <i className="bi bi-plus-lg me-1" />
                                        Add Member
                                    </button>
                                </div>

                                {form.members.map((member, index) => (
                                    <div className="col-12" key={member.id || index}>
                                        <div
                                            className="border rounded-3 p-3 mb-2"
                                            style={{ background: '#fcfbff' }}
                                        >
                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <h6 className="fw-bold mb-0">
                                                    Member {index + 1}
                                                </h6>

                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-danger"
                                                    disabled={form.members.length === 1}
                                                    onClick={() => removeMember(index)}
                                                >
                                                    <i className="bi bi-trash me-1" />
                                                    Remove
                                                </button>
                                            </div>

                                            <div className="row g-3">
                                                <Field label="Full Name" value={member.fullName} onChange={(value) => setMember(index, 'fullName', value)} required />

                                                <Field
                                                    label="Relationship to Household Head"
                                                    value={member.relationship}
                                                    onChange={(value) => setMember(index, 'relationship', value)}
                                                    options={[
                                                        'Household Head',
                                                        'Spouse',
                                                        'Son',
                                                        'Daughter',
                                                        'Parent',
                                                        'Sibling',
                                                        'Grandparent',
                                                        'Grandchild',
                                                        'Relative',
                                                        'Other',
                                                    ]}
                                                />

                                                <Field label="Sex" value={member.sex} onChange={(value) => setMember(index, 'sex', value)} options={['Male', 'Female']} />
                                                <Field label="Date of Birth" type="date" value={member.dateOfBirth} onChange={(value) => setMember(index, 'dateOfBirth', value)} />
                                                <Field label="Age" type="number" min="0" max="130" value={member.age} onChange={(value) => setMember(index, 'age', value)} />
                                                <Field label="Civil Status" value={member.civilStatus} onChange={(value) => setMember(index, 'civilStatus', value)} options={['Single', 'Married', 'Widowed', 'Separated', 'Divorced', 'Live-in']} />
                                                <Field label="Occupation" value={member.occupation} onChange={(value) => setMember(index, 'occupation', value)} />
                                                <Field label="Educational Attainment" value={member.educationalAttainment} onChange={(value) => setMember(index, 'educationalAttainment', value)} />

                                                <CheckField label="Senior Citizen" checked={member.seniorCitizen} onChange={(value) => setMember(index, 'seniorCitizen', value)} />
                                                <CheckField label="Person with Disability (PWD)" checked={member.pwd} onChange={(value) => setMember(index, 'pwd', value)} />
                                                <CheckField label="4Ps Beneficiary" checked={member.fourPs} onChange={(value) => setMember(index, 'fourPs', value)} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </Section>

                            <Section title="7. Declaration">
                                <CheckField
                                    label="I certify that the information provided is true and correct."
                                    checked={form.declaration.certified}
                                    onChange={(value) =>
                                        setNested('declaration', 'certified', value)
                                    }
                                />

                                <Field
                                    label="Declarant Name"
                                    value={form.declaration.name}
                                    onChange={(value) =>
                                        setNested('declaration', 'name', value)
                                    }
                                    required
                                />

                                <Field
                                    label="Declaration Date"
                                    type="date"
                                    value={form.declaration.date}
                                    onChange={(value) =>
                                        setNested('declaration', 'date', value)
                                    }
                                    required
                                />
                            </Section>

                            {error && (
                                <div className="alert alert-danger">
                                    {error}
                                </div>
                            )}
                        </div>

                        <div className="modal-footer bg-light">
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                disabled={saving}
                                onClick={() => setModalType('')}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="btn btn-census-primary"
                                disabled={saving}
                            >
                                {saving ? (
                                    'Saving...'
                                ) : (
                                    <>
                                        <i className="bi bi-check2-circle me-2" />
                                        {modalType === 'add'
                                            ? 'Add Record'
                                            : 'Save Changes'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </ModalShell>
            )}

            {/* DELETE CONFIRMATION */}
            {deleting && (
                <ModalShell
                    title="Confirm Delete"
                    onClose={() => !saving && setDeleting(null)}
                >
                    <div className="modal-body py-4 text-center">
                        <div
                            className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
                            style={{
                                width: 64,
                                height: 64,
                                background: '#fef2f2',
                                color: '#dc2626',
                                fontSize: 28,
                            }}
                        >
                            <i className="bi bi-exclamation-triangle" />
                        </div>

                        <h5 className="fw-bold">
                            Are you sure you want to delete this information?
                        </h5>

                        <p className="text-secondary mb-1">
                            This will permanently remove the census record from the system.
                        </p>

                        <p className="fw-bold mb-0">
                            {deleting.householdNumber || '—'} —{' '}
                            {deleting.householdHead || '—'}
                        </p>
                    </div>

                    <div className="modal-footer justify-content-center bg-light">
                        <button
                            type="button"
                            className="btn btn-outline-secondary px-4"
                            disabled={saving}
                            onClick={() => setDeleting(null)}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            className="btn btn-danger px-4"
                            disabled={saving}
                            onClick={confirmDelete}
                        >
                            <i className="bi bi-trash me-2" />
                            {saving ? 'Deleting...' : 'Yes, Delete'}
                        </button>
                    </div>
                </ModalShell>
            )}
        </AdminLayout>
    );
}