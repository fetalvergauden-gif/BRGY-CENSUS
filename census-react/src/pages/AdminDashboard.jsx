
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
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5>Statistics by Sitio</h5>
                        </div>

                        <div className="table-responsive">
                            <table className="table align-middle">
                                <thead>
                                    <tr>
                                        <th>Sitio</th>
                                        <th>Households</th>
                                        <th>Population</th>
                                        <th>Male</th>
                                        <th>Female</th>
                                        <th>Senior</th>
                                        <th>PWD</th>
                                        <th>4Ps</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {ss.map((r) => (
                                        <tr key={r.sitio}>
                                            {Object.values(r).map(
                                                (v, i) => (
                                                    <td key={i}>
                                                        {v}
                                                    </td>
                                                )
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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

