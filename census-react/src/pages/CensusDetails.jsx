
import AdminLayout from '../components/AdminLayout';
import { useCensus } from '../context/CensusContext';

const safe = (value) => {
    if (value === null || value === undefined || value === '') {
        return '—';
    }

    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }

    if (typeof value === 'object') {
        return JSON.stringify(value);
    }

    return String(value);
};

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
        ...record,
    };
}

function Info({ label, value }) {
    return (
        <div className="col-12 col-md-6 col-lg-4 mb-3">
            <div className="detail-label text-secondary small mb-1">
                {label}
            </div>

            <div className="fw-medium text-break">
                {safe(value)}
            </div>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <div className="data-card mb-3">
            <h5 className="fw-bold mb-3">{title}</h5>
            <div className="row">{children}</div>
        </div>
    );
}

export default function CensusDetails({ id, onBack }) {
    const {
        records = [],
        recordsLoading,
        recordsError,
    } = useCensus();

    const recordList = Array.isArray(records) ? records : [];

    const foundRecord = recordList.find(
        (item) => String(item.id) === String(id)
    );

    const r = foundRecord ? getRecordData(foundRecord) : null;

    if (recordsLoading) {
        return (
            <AdminLayout
                active="/admin/census-records"
                title="Census Details"
                subtitle="Loading household information..."
            >
                <div className="data-card text-center py-5">
                    <div className="spinner-border text-primary mb-3" />
                    <p className="text-secondary mb-0">
                        Loading census record...
                    </p>
                </div>
            </AdminLayout>
        );
    }

    if (recordsError) {
        return (
            <AdminLayout
                active="/admin/census-records"
                title="Census Details"
            >
                <button
                    type="button"
                    className="btn btn-outline-secondary mb-3"
                    onClick={onBack}
                >
                    ← Back to Records
                </button>

                <div className="alert alert-danger">
                    Unable to load census records: {recordsError}
                </div>
            </AdminLayout>
        );
    }

    if (!r) {
        return (
            <AdminLayout
                active="/admin/census-records"
                title="Census Details"
                subtitle="Household record information"
            >
                <button
                    type="button"
                    className="btn btn-outline-secondary mb-3"
                    onClick={onBack}
                >
                    ← Back to Records
                </button>

                <div className="alert alert-warning">
                    <h6 className="fw-bold">Record not found.</h6>
                    <p className="mb-0">
                        The selected census record could not be found.
                        Please return to Census Records and try again.
                    </p>
                </div>
            </AdminLayout>
        );
    }

    const address = r.address || {};
    const education = r.education || {};
    const employment = r.employment || {};
    const declaration = r.declaration || {};

    const members = Array.isArray(r.members)
        ? r.members
        : [];

    const fullName = [
        r.firstName,
        r.middleName,
        r.lastName,
        r.suffix,
    ]
        .filter(Boolean)
        .join(' ');

    const submittedAt =
        r.submittedAt || r.createdAt || r.created_at;

    const formattedSubmitted = submittedAt
        ? new Date(submittedAt).toLocaleString()
        : '—';

    return (
        <AdminLayout
            active="/admin/census-records"
            title="Census Details"
            subtitle={`Household Number: ${safe(r.householdNumber)}`}
        >
            <button
                type="button"
                className="btn btn-outline-secondary mb-3"
                onClick={onBack}
            >
                <i className="bi bi-arrow-left me-2" />
                Back to Records
            </button>

            {/* HOUSEHOLD INFORMATION */}
            <Section title="Household Information">
                <Info label="Household Number" value={r.householdNumber} />
                <Info label="Household Head" value={r.householdHead} />
                <Info label="Census Year" value={r.censusYear} />
                <Info label="Date Interviewed" value={r.dateInterviewed} />
                <Info label="Status" value={r.status || 'Submitted'} />
                <Info label="Date Submitted" value={formattedSubmitted} />
                <Info
                    label="4Ps Household Beneficiary"
                    value={r.fourPsHousehold}
                />
            </Section>

            {/* PERSONAL INFORMATION */}
            <Section title="Household Head Personal Information">
                <Info label="Full Name" value={fullName || r.householdHead} />
                <Info label="First Name" value={r.firstName} />
                <Info label="Middle Name" value={r.middleName} />
                <Info label="Last Name" value={r.lastName} />
                <Info label="Suffix" value={r.suffix} />
                <Info label="Sex" value={r.sex} />
                <Info label="Date of Birth" value={r.dateOfBirth} />
                <Info label="Age" value={r.age} />
                <Info label="Birthplace" value={r.birthplace} />
                <Info label="Civil Status" value={r.civilStatus} />
                <Info label="Citizenship" value={r.citizenship} />
                <Info label="Religion" value={r.religion} />
            </Section>

            {/* CLASSIFICATIONS */}
            <Section title="Household Head Classification">
                <Info label="Senior Citizen" value={r.seniorCitizen} />
                <Info label="Person with Disability (PWD)" value={r.pwd} />
                <Info label="4Ps Beneficiary" value={r.fourPs} />
            </Section>

            {/* ADDRESS */}
            <Section title="Address">
                <Info label="House Number" value={address.houseNumber} />
                <Info label="Street" value={address.street} />
                <Info label="Sitio" value={address.sitio} />
                <Info label="Barangay" value={address.barangay} />
                <Info
                    label="Municipality / City"
                    value={address.municipality}
                />
                <Info label="Province" value={address.province} />
            </Section>

            {/* EDUCATION */}
            <Section title="Educational Information">
                <Info
                    label="Educational Attainment"
                    value={education.attainment}
                />
                <Info label="School / Institution" value={education.school} />
                <Info
                    label="Currently Attending School"
                    value={education.attending}
                />
            </Section>

            {/* EMPLOYMENT */}
            <Section title="Employment / Livelihood">
                <Info label="Occupation" value={employment.occupation} />
                <Info
                    label="Employment Status"
                    value={employment.status}
                />
                <Info label="Employer" value={employment.employer} />
                <Info label="Income Range" value={employment.incomeRange} />
            </Section>

            {/* HOUSEHOLD MEMBERS */}
            <div className="data-card mb-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold mb-0">Household Members</h5>

                    <span className="badge text-bg-primary">
                        {members.length} Members
                    </span>
                </div>

                {members.length > 0 ? (
                    <div className="table-responsive">
                        <table className="table table-hover table-bordered align-middle">
                            <thead className="table-light">
                                <tr>
                                    <th>#</th>
                                    <th>Full Name</th>
                                    <th>Relationship</th>
                                    <th>Sex</th>
                                    <th>Birth Date</th>
                                    <th>Age</th>
                                    <th>Civil Status</th>
                                    <th>Occupation</th>
                                    <th>Education</th>
                                    <th>Senior</th>
                                    <th>PWD</th>
                                    <th>4Ps</th>
                                </tr>
                            </thead>

                            <tbody>
                                {members.map((member, index) => (
                                    <tr key={member.id || index}>
                                        <td>{index + 1}</td>
                                        <td>
                                            {safe(
                                                member.fullName ||
                                                member.name
                                            )}
                                        </td>
                                        <td>{safe(member.relationship)}</td>
                                        <td>{safe(member.sex)}</td>
                                        <td>{safe(member.dateOfBirth)}</td>
                                        <td>{safe(member.age)}</td>
                                        <td>{safe(member.civilStatus)}</td>
                                        <td>{safe(member.occupation)}</td>
                                        <td>
                                            {safe(member.educationalAttainment)}
                                        </td>
                                        <td>{safe(member.seniorCitizen)}</td>
                                        <td>{safe(member.pwd)}</td>
                                        <td>{safe(member.fourPs)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="alert alert-light mb-0">
                        No household members recorded.
                    </div>
                )}
            </div>

            {/* DECLARATION */}
            <Section title="Declaration & Certification">
                <Info
                    label="Certified"
                    value={declaration.certified}
                />
                <Info
                    label="Declarant Name"
                    value={declaration.name}
                />
                <Info
                    label="Declaration Date"
                    value={declaration.date}
                />
            </Section>

            <div className="text-end mb-4">
                <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={onBack}
                >
                    <i className="bi bi-arrow-left me-2" />
                    Back to Census Records
                </button>
            </div>
        </AdminLayout>
    );
}
