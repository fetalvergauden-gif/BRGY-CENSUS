
import { useMemo } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useCensus } from '../context/CensusContext';
import {
    getStats,
    getSitioStats,
} from '../utils/statistics';

export default function AdminDashboard() {
    const { records } = useCensus();

    const s = useMemo(
        () => getStats(records),
        [records]
    );

    const ss = useMemo(
        () => getSitioStats(records),
        [records]
    );

    return (
        <AdminLayout
            active="/admin/dashboard"
            title="Admin Dashboard"
            subtitle="Overview of submitted Barangay Census data."
        >
            <div className="row g-3 mb-4">
                {[
                    ['TOTAL HOUSEHOLDS', s.households, 'bi-houses'],
                    ['TOTAL RESIDENTS', s.population, 'bi-people'],
                    ['SENIOR CITIZENS', s.senior, 'bi-person-badge'],
                    ['PWD', s.pwd, 'bi-universal-access'],
                    ['4Ps BENEFICIARIES', s.fourPs, 'bi-heart'],
                ].map(([l, v, i]) => (
                    <div
                        className="col-6 col-xl-2"
                        key={l}
                    >
                        <div className="stat-card census-stat h-100">
                            <div className="stat-icon">
                                <i className={`bi ${i}`} />
                            </div>

                            <div className="small text-secondary mt-2">
                                {l}
                            </div>

                            <div className="stat-number">
                                {v}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="row g-4">
                <div className="col-12 col-xl-7">
                    <div className="data-card">
                        <h5 className="mb-1">Statistics by Sitio</h5>
                        <p className="text-secondary small mb-4">
                            Compare census statistics for every sitio.
                        </p>

                        {ss.length === 0 ? (
                            <div className="text-center text-secondary py-5">
                                No sitio statistics available yet.
                            </div>
                        ) : (
                            <SitioBarGraph data={ss} />
                        )}
                    </div>
                </div>

                <div className="col-12 col-xl-5">
                    <div className="data-card">
                        <h5 className="mb-3">
                            Population per Sitio
                        </h5>

                        {ss.map((r) => (
                            <div
                                className="bar-row"
                                key={r.sitio}
                            >
                                <div className="d-flex justify-content-between small">
                                    <span>{r.sitio}</span>
                                    <b>{r.population}</b>
                                </div>

                                <div className="bar-track">
                                    <div
                                        className="bar-fill"
                                        style={{
                                            width: `${Math.max(
                                                8,
                                                (r.population /
                                                    Math.max(
                                                        1,
                                                        s.population
                                                    )) *
                                                    100
                                            )}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="col-12">
                    <div className="data-card">
                        <h5>Social Program Distribution</h5>

                        <div className="row g-3 mt-1">
                            {[
                                [
                                    'Senior Citizens',
                                    'senior',
                                    'bi-person-badge',
                                ],
                                [
                                    'PWD',
                                    'pwd',
                                    'bi-universal-access',
                                ],
                                [
                                    '4Ps Beneficiaries',
                                    'fourPs',
                                    'bi-heart',
                                ],
                            ].map(([l, k, i]) => (
                                <div
                                    className="col-md-4"
                                    key={l}
                                >
                                    <div className="mini-stat">
                                        <i
                                            className={`bi ${i}`}
                                        />

                                        <div>
                                            <span>{l}</span>
                                            <strong>{s[k]}</strong>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}



function SitioBarGraph({ data }) {
    const metrics = [
        { key: 'households', label: 'Households', color: '#6f42c1' },
        { key: 'population', label: 'Population', color: '#8b5cf6' },
        { key: 'male', label: 'Male', color: '#2563eb' },
        { key: 'female', label: 'Female', color: '#ec4899' },
        { key: 'senior', label: 'Senior', color: '#f59e0b' },
        { key: 'pwd', label: 'PWD', color: '#10b981' },
        { key: 'fourPs', label: '4Ps', color: '#ef4444' },
    ];

    const maxValue = Math.max(
        1,
        ...data.flatMap((row) =>
            metrics.map((metric) => Number(row[metric.key]) || 0)
        )
    );

    return (
        <div className="sitio-chart">
            <div className="d-flex flex-wrap gap-3 mb-4" aria-label="Chart legend">
                {metrics.map((metric) => (
                    <div className="d-flex align-items-center gap-2 small" key={metric.key}>
                        <span
                            style={{
                                width: 12,
                                height: 12,
                                borderRadius: 3,
                                backgroundColor: metric.color,
                                display: 'inline-block',
                            }}
                        />
                        <span>{metric.label}</span>
                    </div>
                ))}
            </div>

            <div className="d-flex flex-column gap-4">
                {data.map((row) => (
                    <div key={row.sitio}>
                        <div className="fw-semibold mb-2">{row.sitio}</div>

                        <div className="d-flex flex-column gap-2">
                            {metrics.map((metric) => {
                                const value = Number(row[metric.key]) || 0;
                                const width = value === 0
                                    ? 0
                                    : Math.max(4, (value / maxValue) * 100);

                                return (
                                    <div className="d-flex align-items-center gap-2" key={metric.key}>
                                        <div
                                            className="text-secondary small text-end"
                                            style={{ width: 76, flexShrink: 0 }}
                                        >
                                            {metric.label}
                                        </div>

                                        <div
                                            className="flex-grow-1 rounded-pill overflow-hidden"
                                            style={{ height: 16, background: '#f1eff7' }}
                                        >
                                            <div
                                                className="rounded-pill h-100"
                                                style={{
                                                    width: width + '%',
                                                    minWidth: value > 0 ? 8 : 0,
                                                    backgroundColor: metric.color,
                                                    transition: 'width 0.4s ease',
                                                }}
                                                title={metric.label + ': ' + value}
                                            />
                                        </div>

                                        <strong className="small text-end" style={{ width: 24 }}>
                                            {value}
                                        </strong>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
