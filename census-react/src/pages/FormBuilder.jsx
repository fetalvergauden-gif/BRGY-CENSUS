import { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import ConfirmDialog from '../components/ConfirmDialog';
import { auth } from '../components/firebase';

import { API_ENDPOINTS } from '../config/api';

const API = API_ENDPOINTS.formSchema;

const uid = () =>
    globalThis.crypto?.randomUUID?.() ||
    `f_${Date.now()}_${Math.random().toString(36).slice(2)}`;

const blankField = () => ({
    id: uid(),
    key: `custom_${uid().replaceAll('-', '')}`,
    path: '',
    label: 'New question',
    type: 'text',
    required: false,
    options: []
});

const blankSection = () => ({
    id: uid(),
    title: 'New section',
    description: '',
    fields: [blankField()]
});

const classificationFields = {
    head: [
        {
            key: 'seniorCitizen',
            path: 'seniorCitizen',
            label: 'Senior Citizen',
            type: 'checkbox'
        },
        {
            key: 'pwd',
            path: 'pwd',
            label: 'Person with Disability (PWD)',
            type: 'checkbox'
        },
        {
            key: 'fourPs',
            path: 'fourPs',
            label: '4Ps Beneficiary',
            type: 'checkbox'
        }
    ],

    household: [
        {
            key: 'fourPsHousehold',
            path: 'fourPsHousehold',
            label: '4Ps Household Beneficiary',
            type: 'checkbox'
        }
    ],

    member: [
        {
            key: 'seniorCitizen',
            path: 'seniorCitizen',
            label: 'Senior Citizen',
            type: 'checkbox'
        },
        {
            key: 'pwd',
            path: 'pwd',
            label: 'Person with Disability (PWD)',
            type: 'checkbox'
        },
        {
            key: 'fourPs',
            path: 'fourPs',
            label: '4Ps Beneficiary',
            type: 'checkbox'
        }
    ]
};

function isCharacterReferenceSection(section) {
    const title = String(section?.title || '').toLowerCase().trim();
    const repeatable = String(section?.repeatable || '')
        .toLowerCase()
        .trim();

    return (
        repeatable === 'characterreferences' ||
        repeatable === 'character_references' ||
        repeatable === 'character-references' ||
        title.includes('character reference')
    );
}

function removeCharacterReferences(schema) {
    return {
        ...schema,
        sections: (schema.sections || [])
            .filter((section) => !isCharacterReferenceSection(section))
            .map((section) => ({
                ...section,
                fields: (section.fields || []).filter((field) => {
                    const label = String(field.label || '').toLowerCase();
                    const key = String(field.key || '').toLowerCase();
                    const path = String(field.path || '').toLowerCase();

                    return !(
                        label.includes('character reference') ||
                        key.includes('characterreference') ||
                        key.includes('character_reference') ||
                        path.includes('characterreference') ||
                        path.includes('character_reference')
                    );
                })
            }))
    };
}

function createClassificationField(definition) {
    return {
        id: uid(),
        ...definition,
        required: false,
        options: []
    };
}

function hasBinding(section, path) {
    return (section.fields || []).some(
        (field) =>
            field.path === path ||
            field.key === path
    );
}

function ensureClassificationFields(schema) {
    const cleanedSchema = removeCharacterReferences(schema);

    const sections = (cleanedSchema.sections || []).map((section) => ({
        ...section,
        fields: [...(section.fields || [])]
    }));

    const householdSection =
        sections.find((section) =>
            !section.repeatable &&
            /household information/i.test(section.title || '')
        ) || sections[0];

    const personalSection =
        sections.find((section) =>
            !section.repeatable &&
            /personal information/i.test(section.title || '')
        ) || sections[1];

    const memberSection = sections.find(
        (section) => section.repeatable === 'members'
    );

    if (householdSection) {
        classificationFields.household.forEach((definition) => {
            if (!hasBinding(householdSection, definition.path)) {
                householdSection.fields.push(
                    createClassificationField(definition)
                );
            }
        });
    }

    if (personalSection) {
        classificationFields.head.forEach((definition) => {
            if (!hasBinding(personalSection, definition.path)) {
                personalSection.fields.push(
                    createClassificationField(definition)
                );
            }
        });
    }

    if (memberSection) {
        classificationFields.member.forEach((definition) => {
            if (!hasBinding(memberSection, definition.path)) {
                memberSection.fields.push(
                    createClassificationField(definition)
                );
            }
        });
    }

    return {
        ...cleanedSchema,
        sections
    };
}

async function request(url, options = {}) {
    const token = await auth.currentUser?.getIdToken();

    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token
                ? { Authorization: `Bearer ${token}` }
                : {}),
            ...(options.headers || {})
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.message || 'Request failed.');
    }

    return data;
}

export default function FormBuilder() {
    const [schema, setSchema] = useState({ sections: [] });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState('');
    const [error, setError] = useState('');
    const [confirmation, setConfirmation] = useState(null);

    useEffect(() => {
        let active = true;

        request(API)
            .then((result) => {
                const loaded = result.sections?.length
                    ? result
                    : { sections: [] };

                if (active) {
                    setSchema(ensureClassificationFields(loaded));
                }
            })
            .catch((requestError) => {
                if (active) setError(requestError.message);
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    const patchSection = (id, changes) => {
        setSchema((current) => ({
            ...current,
            sections: current.sections.map((section) =>
                section.id === id
                    ? { ...section, ...changes }
                    : section
            )
        }));
    };

    const patchField = (sectionId, fieldId, changes) => {
        setSchema((current) => ({
            ...current,
            sections: current.sections.map((section) =>
                section.id === sectionId
                    ? {
                        ...section,
                        fields: section.fields.map((field) =>
                            field.id === fieldId
                                ? { ...field, ...changes }
                                : field
                        )
                    }
                    : section
            )
        }));
    };

    const addField = (sectionId) => {
        const section = schema.sections.find(
            (item) => item.id === sectionId
        );

        if (!section) return;

        patchSection(sectionId, {
            fields: [
                ...(section.fields || []),
                blankField()
            ]
        });
    };

    const save = () => setConfirmation({
        title: 'Save census form changes?',
        message: 'The updated Census Form will be applied to the user form.',
        confirmLabel: 'Yes, Save Form',
        tone: 'primary',
        action: performSave
    });

    const performSave = async () => {
        setSaving(true);
        setError('');
        setNotice('');

        try {
            const updatedSchema = ensureClassificationFields(schema);

            await request(API, {
                method: 'PUT',
                body: JSON.stringify(updatedSchema)
            });

            setSchema(updatedSchema);

            setNotice(
                'Successfully saved! Na-update ang Census Form. Wala na rin ang Character Reference section.'
            );
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout
                active="/admin/form-builder"
                title="Census Form Builder"
            >
                <p>Loading form configuration...</p>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout
            active="/admin/form-builder"
            title="Census Form Builder"
            subtitle="I-edit ang buong Census Form: sections, labels, questions, field types at required settings."
        >
            <div className="alert alert-info">
                <b>Classification fields:</b> May sariling Senior Citizen,
                PWD at 4Ps status ang Household Head at bawat Household
                Member. May hiwalay ding 4Ps Household Beneficiary field.
                Ang pag-delete ng field ay hindi nagbubura ng dating database answers.
            </div>

            <div className="d-flex flex-wrap gap-2 mb-3">
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setConfirmation({
                        title: 'Add a new section?',
                        message: 'A new section will be added to the census form builder.',
                        confirmLabel: 'Yes, Add Section',
                        action: () => setSchema((current) => ({
                            ...current,
                            sections: [...current.sections, blankSection()]
                        }))
                    })}
                >
                    ＋ Add Section
                </button>

                <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={() => setConfirmation({
                        title: 'Add a new question?',
                        message: 'A new question will be added to the first form section.',
                        confirmLabel: 'Yes, Add Question',
                        action: () => {
                            if (!schema.sections.length) {
                                setSchema({ sections: [blankSection()] });
                                return;
                            }
                            addField(schema.sections[0].id);
                        }
                    })}
                >
                    ＋ Add Question
                </button>

                <button
                    type="button"
                    className="btn btn-success ms-auto"
                    disabled={saving}
                    onClick={save}
                >
                    {saving
                        ? 'Saving...'
                        : 'Save Entire Census Form'}
                </button>
            </div>

            {notice && (
                <div className="alert alert-success">
                    {notice}
                </div>
            )}

            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}

            {!schema.sections.length && (
                <div className="alert alert-warning">
                    Walang form schema na naibalik ng server.
                    I-check ang backend default-form-schema.json at API bago mag-save.
                </div>
            )}

            {schema.sections.map((section, index) => (
                <section
                    className="card border-0 shadow-sm p-3 p-md-4 mb-3"
                    key={section.id}
                >
                    <div className="d-flex flex-wrap gap-2 align-items-start">
                        <span className="badge text-bg-primary">
                            {index + 1}
                        </span>

                        <div
                            className="flex-grow-1"
                            style={{ minWidth: 240 }}
                        >
                            <label className="form-label">
                                Section title
                            </label>

                            <input
                                className="form-control mb-2"
                                value={section.title || ''}
                                onChange={(event) =>
                                    patchSection(section.id, {
                                        title: event.target.value
                                    })
                                }
                            />

                            <label className="form-label">
                                Description / instruction
                            </label>

                            <textarea
                                className="form-control"
                                rows="2"
                                value={section.description || ''}
                                onChange={(event) =>
                                    patchSection(section.id, {
                                        description: event.target.value
                                    })
                                }
                            />
                        </div>

                        <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => setConfirmation({
                                title: 'Delete this section?',
                                message: 'This section and all its questions will be removed from the form builder.',
                                details: section.title,
                                confirmLabel: 'Yes, Delete Section',
                                tone: 'danger',
                                action: () => setSchema((current) => ({
                                    ...current,
                                    sections: current.sections.filter(
                                        (item) => item.id !== section.id
                                    )
                                }))
                            })}
                        >
                            Delete section
                        </button>
                    </div>

                    {section.repeatable && (
                        <div className="badge text-bg-warning mt-3">
                            Repeatable group: {section.repeatable}
                        </div>
                    )}

                    <hr />

                    <div className="row g-3">
                        {(section.fields || []).map((field) => (
                            <div className="col-12" key={field.id}>
                                <div className="border rounded-3 p-3">
                                    <div className="row g-2 align-items-end">
                                        <div className="col-12 col-lg-4">
                                            <label className="form-label">
                                                Question / label
                                            </label>

                                            <input
                                                className="form-control"
                                                value={field.label || ''}
                                                onChange={(event) =>
                                                    patchField(
                                                        section.id,
                                                        field.id,
                                                        {
                                                            label: event.target.value
                                                        }
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="col-6 col-lg-2">
                                            <label className="form-label">
                                                Input type
                                            </label>

                                            <select
                                                className="form-select"
                                                value={field.type}
                                                onChange={(event) =>
                                                    patchField(
                                                        section.id,
                                                        field.id,
                                                        {
                                                            type: event.target.value
                                                        }
                                                    )
                                                }
                                            >
                                                <option value="text">Short text</option>
                                                <option value="textarea">Paragraph</option>
                                                <option value="number">Number</option>
                                                <option value="date">Date</option>
                                                <option value="select">Dropdown</option>
                                                <option value="checkbox">Checkbox</option>
                                            </select>
                                        </div>

                                        <div className="col-12 col-lg-4">
                                            <label className="form-label">
                                                Options (comma-separated)
                                            </label>

                                            <input
                                                className="form-control"
                                                disabled={field.type !== 'select'}
                                                value={(field.options || []).join(', ')}
                                                placeholder="Only for dropdown"
                                                onChange={(event) =>
                                                    patchField(
                                                        section.id,
                                                        field.id,
                                                        {
                                                            options: event.target.value
                                                                .split(',')
                                                                .map((item) => item.trim())
                                                                .filter(Boolean)
                                                        }
                                                    )
                                                }
                                            />
                                        </div>

                                        <div className="col-6 col-lg-1">
                                            <div className="form-check">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={!!field.required}
                                                    onChange={(event) =>
                                                        patchField(
                                                            section.id,
                                                            field.id,
                                                            {
                                                                required: event.target.checked
                                                            }
                                                        )
                                                    }
                                                />
                                                <label className="form-check-label">
                                                    Required
                                                </label>
                                            </div>
                                        </div>

                                        <div className="col-6 col-lg-1">
                                            <button
                                                type="button"
                                                className="btn btn-outline-danger w-100"
                                                onClick={() => setConfirmation({
                                                    title: 'Delete this question?',
                                                    message: 'This question will be removed from the census form configuration.',
                                                    details: field.label,
                                                    confirmLabel: 'Yes, Delete Question',
                                                    tone: 'danger',
                                                    action: () => patchSection(section.id, {
                                                        fields: section.fields.filter(
                                                            (item) => item.id !== field.id
                                                        )
                                                    })
                                                })}
                                                title="Delete question"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>

                                    <div className="small text-secondary mt-2">
                                        Data binding:{' '}
                                        <code>
                                            {field.path || field.key}
                                        </code>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        className="btn btn-sm btn-outline-primary mt-3"
                        onClick={() => setConfirmation({
                            title: 'Add a question to this section?',
                            message: 'A new question will be added to this section.',
                            details: section.title,
                            confirmLabel: 'Yes, Add Question',
                            action: () => addField(section.id)
                        })}
                    >
                        ＋ Add question to this section
                    </button>
                </section>
            ))}

            <div className="d-flex justify-content-end">
                <button
                    type="button"
                    className="btn btn-success"
                    disabled={saving}
                    onClick={save}
                >
                    {saving
                        ? 'Saving...'
                        : 'Save Entire Census Form'}
                </button>
            </div>
            <ConfirmDialog
                open={Boolean(confirmation)}
                title={confirmation?.title}
                message={confirmation?.message}
                details={confirmation?.details || ''}
                confirmLabel={confirmation?.confirmLabel || 'Confirm'}
                tone={confirmation?.tone || 'primary'}
                loading={saving}
                onCancel={() => !saving && setConfirmation(null)}
                onConfirm={async () => {
                    if (!confirmation?.action) return;
                    await confirmation.action();
                    setConfirmation(null);
                }}
            />
        </AdminLayout>
    );
}