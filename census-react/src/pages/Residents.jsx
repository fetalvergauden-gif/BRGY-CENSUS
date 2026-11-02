
import { useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useCensus } from '../context/CensusContext';

export default function Residents() {
    const {
        records = [],
        deleteResident,
        recordsLoading,
        recordsError
    } = useCensus();

    const [q, setQ] = useState('');
    const [selectedResident, setSelectedResident] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Convert different database values into true/false.
    const toBoolean = (value) => {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value === 1;

        if (typeof value === 'string') {
            return ['yes', 'true', '1', 'on'].includes(
                value.trim().toLowerCase()
            );
        }

        return false;
    };

    // Get a person's actual full name.
    const getPersonName = (person = {}) => {
        const possibleName =
            person.fullName ||
            person.full_name ||
            person.name;

        if (
            typeof possibleName === 'string' &&
            possibleName.trim() &&
            !/^\d+$/.test(possibleName.trim())
        ) {
            return possibleName.trim();
        }

        return [
            person.firstName || person.first_name,
            person.middleName || person.middle_name,
            person.lastName || person.last_name,
            person.suffix
        ]
            .filter(value => value && value !== '—')
            .join(' ')
            .trim();
    };

    // Normalize resident information for the table.
    const normalizeResident = (
        resident = {},
        record = {},
        memberIndex = -1
    ) => {
        const fullName =
            getPersonName(resident) ||
            'Name not available';

        const address = record.address || {};

        return {
            ...resident,

            fullName,

            householdId: record.id,

            householdNumber:
                record.householdNumber ||
                record.household_number ||
                '—',

            householdHead:
                record.householdHead ||
                record.household_head ||
                '',

            sitio:
                resident.sitio ||
                address.sitio ||
                record.sitio ||
                '—',

            sex:
                resident.sex ||
                resident.gender ||
                '—',

            age:
                resident.age ??
                resident.residentAge ??
                '—',

            civilStatus:
                resident.civilStatus ||
                resident.civil_status ||
                '—',

            occupation:
                resident.occupation ||
                resident.employment?.occupation ||
                resident.employment?.status ||
                '—',

            educationalAttainment:
                resident.educationalAttainment ||
                resident.educational_attainment ||
                resident.education?.attainment ||
                resident.education?.educationalAttainment ||
                '—',

            seniorCitizen: toBoolean(
                resident.seniorCitizen ??
                resident.senior_citizen
            ),

            pwd: toBoolean(
                resident.pwd ??
                resident.isPWD ??
                resident.is_pwd
            ),

            fourPs: toBoolean(
                resident.fourPs ??
                resident.four_ps ??
                resident.fourPsBeneficiary ??
                resident.four_ps_beneficiary
            ),

            memberIndex
        };
    };

    // Build the complete resident list from server records.
    const residents = useMemo(() => {
        if (!Array.isArray(records)) return [];

        return records.flatMap((record) => {
            let source = record || {};

            // Read the household payload returned by the backend.
            if (typeof source.payload === 'string') {
                try {
                    source = {
                        ...JSON.parse(source.payload),
                        ...record
                    };
                } catch (err) {
                    console.error(
                        'Unable to parse household payload:',
                        err
                    );

                    source = record;
                }
            } else if (
                source.payload &&
                typeof source.payload === 'object'
            ) {
                source = {
                    ...source.payload,
                    ...record
                };
            }

            const members = Array.isArray(source.members)
                ? [...source.members]
                : [];

            // Derive the household head's name from personal fields.
            const headName =
                getPersonName(source) ||
                (
                    typeof source.householdHead === 'string' &&
                    !/^\d+$/.test(source.householdHead.trim())
                        ? source.householdHead.trim()
                        : ''
                ) ||
                (
                    typeof source.household_head === 'string' &&
                    !/^\d+$/.test(source.household_head.trim())
                        ? source.household_head.trim()
                        : ''
                );

            // Find the household head if already included in members.
            const headIndex = headName
                ? members.findIndex(member =>
                    getPersonName(member).toLowerCase() ===
                    headName.toLowerCase()
                )
                : -1;

            // Keep the original member indexes for correct deletion.
            const residentRows = members.map((member, index) => ({
                resident: member,
                memberIndex: index
            }));

            if (headIndex >= 0) {
                // Mark the existing member as the household head.
                residentRows[headIndex] = {
                    resident: {
                        ...residentRows[headIndex].resident,
                        fullName: headName,
                        isHouseholdHead: true
                    },
                    memberIndex: headIndex
                };
            } else if (headName) {
                // Household head is stored in the main household fields.
                // Add them to the display without changing the original
                // member indexes used by the backend delete operation.
                const headDetails = {
                    ...source,
                    fullName: headName,
                    householdHead: headName,
                    isHouseholdHead: true,
                    relationship: 'Household Head'
                };

                residentRows.unshift({
                    resident: headDetails,
                    memberIndex: -1
                });
            }

            return residentRows.map((row) => {
                const residentName = getPersonName(row.resident);

                const isHead =
                    row.memberIndex === -1 ||
                    row.resident.isHouseholdHead === true ||
                    row.resident.is_household_head === true ||
                    (
                        headName &&
                        residentName.toLowerCase() ===
                        headName.toLowerCase()
                    );

                return normalizeResident(
                    {
                        ...row.resident,
                        isHouseholdHead: Boolean(isHead)
                    },
                    {
                        ...source,
                        householdHead: headName || source.householdHead
                    },
                    row.memberIndex
                );
            });
        });
    }, [records]);

    // Search residents.
    const filteredResidents = useMemo(() => {
        const search = q.trim().toLowerCase();

        if (!search) return residents;

        return residents.filter((resident) =>
            [
                resident.fullName,
                resident.householdNumber,
                resident.sitio,
                resident.sex,
                resident.civilStatus,
                resident.occupation
            ].some((value) =>
                String(value ?? '').toLowerCase().includes(search)
            )
        );
    }, [residents, q]);

    const yesNo = (value) => value ? 'Yes' : 'No';

    // Determine whether a resident is the household head.
    const isHouseholdHead = (resident) => {
        if (
            resident.isHouseholdHead === true ||
            resident.is_household_head === true
        ) {
            return true;
        }

        const residentName = String(
            resident.fullName || ''
        ).trim().toLowerCase();

        const headName = String(
            resident.householdHead || ''
        ).trim().toLowerCase();

        return Boolean(
            residentName &&
            headName &&
            residentName === headName
        );
    };

    function openDeleteConfirmation(resident) {
        if (isHouseholdHead(resident)) return;

        setError('');
        setSuccess('');
        setSelectedResident(resident);
    }

    function closeDeleteConfirmation() {
        if (deleting) return;
        setSelectedResident(null);
    }

    async function confirmDeleteResident() {
        if (!selectedResident || deleting) return;

        // Do not allow deletion of a synthetic head or actual head.
        if (
            selectedResident.memberIndex < 0 ||
            isHouseholdHead(selectedResident)
        ) {
            setSelectedResident(null);
            setError(
                'The household head cannot be deleted from this page.'
            );
            return;
        }

        setError('');
        setSuccess('');
        setDeleting(true);

        try {
            await deleteResident(
                selectedResident.householdId,
                selectedResident.memberIndex
            );

            setSuccess(
                `${selectedResident.fullName} was successfully deleted.`
            );

            setSelectedResident(null);
        } catch (err) {
            console.error('Resident deletion failed:', err);

            setError(
                err.message ||
                'Unable to delete resident.'
            );
        } finally {
            setDeleting(false);
        }
    }

    return (
        <AdminLayout
            active="/admin/residents"
            title="Residents"
            subtitle="Manage and review all residents from submitted household records."
        >
            <div className="data-card">

                {/* HEADER */}
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                    <div>
                        <h5 className="fw-bold mb-1">
                            <i className="bi bi-people-fill me-2 text-primary"></i>
                            Resident Records
                        </h5>

                        <small className="text-muted">
                            Total Residents:{' '}
                            <strong>{residents.length}</strong>
                        </small>
                    </div>

                    <div
                        className="position-relative"
                        style={{
                            width: '100%',
                            maxWidth: '350px'
                        }}
                    >
                        <i className="bi bi-search position-absolute top-50 translate-middle-y ms-3 text-muted"></i>

                        <input
                            type="search"
                            className="form-control ps-5"
                            placeholder="Search resident or household..."
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                    </div>
                </div>

                {/* ALERTS */}
                {recordsError && (
                    <div className="alert alert-danger d-flex align-items-center gap-2">
                        <i className="bi bi-exclamation-triangle-fill"></i>
                        {recordsError}
                    </div>
                )}

                {error && (
                    <div className="alert alert-danger d-flex align-items-center gap-2">
                        <i className="bi bi-x-circle-fill"></i>
                        {error}
                    </div>
                )}

                {success && (
                    <div className="alert alert-success d-flex align-items-center gap-2">
                        <i className="bi bi-check-circle-fill"></i>
                        {success}
                    </div>
                )}

                {/* RESIDENT TABLE */}
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Name</th>
                                <th>Household</th>
                                <th>Sitio</th>
                                <th>Sex</th>
                                <th>Age</th>
                                <th>Civil Status</th>
                                <th>Senior</th>
                                <th>PWD</th>
                                <th>4Ps</th>
                                <th>Occupation</th>
                                <th>Education</th>
                                <th className="text-center">Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {recordsLoading ? (
                                <tr>
                                    <td
                                        colSpan="12"
                                        className="text-center py-5"
                                    >
                                        <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                                        Loading resident records...
                                    </td>
                                </tr>
                            ) : filteredResidents.length > 0 ? (
                                filteredResidents.map((resident) => {
                                    const key =
                                        `${resident.householdId}-${resident.memberIndex}`;

                                    const head =
                                        isHouseholdHead(resident);

                                    return (
                                        <tr key={key}>
                                            <td className="fw-semibold">
                                                {resident.fullName}

                                                {head && (
                                                    <span className="badge bg-primary-subtle text-primary ms-2">
                                                        Head
                                                    </span>
                                                )}
                                            </td>

                                            <td>
                                                {resident.householdNumber}
                                            </td>

                                            <td>{resident.sitio}</td>
                                            <td>{resident.sex}</td>
                                            <td>{resident.age}</td>
                                            <td>{resident.civilStatus}</td>

                                            <td>
                                                {yesNo(resident.seniorCitizen)}
                                            </td>

                                            <td>
                                                {yesNo(resident.pwd)}
                                            </td>

                                            <td>
                                                {yesNo(resident.fourPs)}
                                            </td>

                                            <td>
                                                {resident.occupation}
                                            </td>

                                            <td>
                                                {resident.educationalAttainment}
                                            </td>

                                            <td className="text-center">
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-danger"
                                                    disabled={
                                                        head ||
                                                        resident.memberIndex < 0
                                                    }
                                                    title={
                                                        head
                                                            ? 'Change the household head before deleting.'
                                                            : 'Delete resident'
                                                    }
                                                    onClick={() =>
                                                        openDeleteConfirmation(resident)
                                                    }
                                                >
                                                    <i className="bi bi-trash3 me-1"></i>
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td
                                        colSpan="12"
                                        className="text-center py-5 text-muted"
                                    >
                                        <i className="bi bi-people fs-2 d-block mb-2"></i>

                                        {q
                                            ? 'No matching residents found.'
                                            : 'No resident records available.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* DELETE CONFIRMATION MODAL */}
            {selectedResident && (
                <div
                    className="resident-modal-backdrop"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeDeleteConfirmation();
                        }
                    }}
                >
                    <div
                        className="resident-confirm-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="deleteResidentTitle"
                    >
                        <div className="resident-modal-icon">
                            <i className="bi bi-trash3-fill"></i>
                        </div>

                        <h5
                            id="deleteResidentTitle"
                            className="fw-bold text-center mb-2"
                        >
                            Delete Resident?
                        </h5>

                        <p className="text-muted text-center mb-4">
                            Are you sure you want to permanently delete this resident?
                            This action cannot be undone.
                        </p>

                        <div className="resident-info-box">
                            <div className="d-flex align-items-center gap-3">
                                <div className="resident-avatar">
                                    <i className="bi bi-person-fill"></i>
                                </div>

                                <div className="overflow-hidden">
                                    <div className="fw-bold text-dark text-break">
                                        {selectedResident.fullName}
                                    </div>

                                    <small className="text-muted">
                                        Household: {selectedResident.householdNumber}
                                    </small>

                                    <small className="text-muted d-block">
                                        Sitio: {selectedResident.sitio}
                                    </small>
                                </div>
                            </div>
                        </div>

                        <div className="resident-warning">
                            <i className="bi bi-info-circle-fill me-2"></i>
                            Only this resident will be deleted. Other household members will remain.
                        </div>

                        <div className="d-flex gap-2 mt-4">
                            <button
                                type="button"
                                className="btn btn-light flex-fill border"
                                onClick={closeDeleteConfirmation}
                                disabled={deleting}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="btn btn-danger flex-fill"
                                onClick={confirmDeleteResident}
                                disabled={deleting}
                            >
                                {deleting ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2"></span>
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-trash3 me-2"></i>
                                        Yes, Delete
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL STYLES */}
            <style>{`
                .resident-modal-backdrop {
                    position: fixed;
                    inset: 0;
                    z-index: 2000;
                    background: rgba(15, 23, 42, 0.58);
                    backdrop-filter: blur(4px);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 20px;
                    animation: residentFadeIn 0.18s ease;
                }

                .resident-confirm-modal {
                    width: 100%;
                    max-width: 430px;
                    background: #ffffff;
                    border-radius: 18px;
                    padding: 28px;
                    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.22);
                    animation: residentSlideUp 0.2s ease;
                }

                .resident-modal-icon {
                    width: 62px;
                    height: 62px;
                    margin: 0 auto 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    background: #fff0f0;
                    color: #dc3545;
                    font-size: 26px;
                }

                .resident-info-box {
                    background: #f8f9fc;
                    border: 1px solid #e9edf3;
                    border-radius: 12px;
                    padding: 14px;
                }

                .resident-avatar {
                    width: 44px;
                    height: 44px;
                    flex-shrink: 0;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #eeeaff;
                    color: #6f42c1;
                    font-size: 21px;
                }

                .resident-warning {
                    background: #fff8e6;
                    color: #856404;
                    border: 1px solid #ffe7a3;
                    border-radius: 10px;
                    padding: 11px 12px;
                    font-size: 12px;
                    line-height: 1.5;
                    margin-top: 14px;
                }

                .resident-confirm-modal .btn {
                    min-height: 42px;
                    border-radius: 9px;
                    font-weight: 600;
                }

                @keyframes residentFadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes residentSlideUp {
                    from {
                        opacity: 0;
                        transform: translateY(12px) scale(0.98);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }

                @media (max-width: 480px) {
                    .resident-confirm-modal {
                        padding: 22px;
                    }
                }
            `}</style>
        </AdminLayout>
    );
}
