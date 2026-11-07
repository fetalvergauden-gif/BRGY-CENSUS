
import { useMemo, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { useCensus } from '../context/CensusContext';
import {
    getStats,
    getSitioStats,
} from '../utils/statistics';

export default function AdminDashboard() {
    const { records } = useCensus();
    const [selectedSitio, setSelectedSitio] = useState('all');

    const s = useMemo(
        () => getStats(records),
        [records]
    );

    const ss = useMemo(
        () => getSitioStats(records),
        [records]
    );

    const selectedData =
        selectedSitio === 'all'
            ? ss
            : ss.filter((row) => row.sitio === selectedSitio);

    const chartTitle =
        selectedSitio === 'all'
            ? 'Barangay Statistics Overview'
            : 'Statistics for ' + selectedSitio;

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
                        <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-4">
                            <div>
                                <h5 className="mb-1">{chartTitle}</h5>
                                <p className="text-secondary small mb-0">
                                    {selectedSitio === 'all'
                                        ? 'Overview of all census statistics across the barangay.'
                                        : 'Showing census statistics for the selected sitio.'}
                                </p>
                            </div>

                            <div style={{ minWidth: 190 }}>
                                <label
                                    htmlFor="sitio-select"
                                    className="form-label small fw-semibold mb-1"
                                >
                                    View data
                                </label>
                                <select
                                    id="sitio-select"
                                    className="form-select form-select-sm"
                                    value={selectedSitio}
                                    onChange={(e) =>
                                        setSelectedSitio(e.target.value)
                                    }
                                >
                                    <option value="all">
                                        Barangay Overview
                                    </option>
                                    {ss.map((row) => (
                                        <option
                                            value={row.sitio}
                                            key={row.sitio}
                                        >
                                            {row.sitio}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {selectedData.length === 0 ? (
                            <div className="text-center text-secondary py-5">
                                No sitio statistics available yet.
                            </div>
                        ) : (
                            <SitioBarGraph data={selectedData} />
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

    const chartHeight = 310;
    const chartWidth = Math.max(760, data.length * 210);
    const left = 52;
    const bottom = 58;
    const top = 24;
    const plotHeight = chartHeight - top - bottom;
    const groupWidth = (chartWidth - left - 24) / data.length;
    const barGap = 3;
    const barWidth = Math.max(
        5,
        Math.min(18, (groupWidth - 26) / metrics.length - barGap)
    );

    const yTicks = 5;

    return (
        <div className="sitio-chart overflow-auto">
            <div className="d-flex flex-wrap gap-3 mb-3" aria-label="Chart legend">
                {metrics.map((metric) => (
                    <div
                        className="d-flex align-items-center gap-2 small"
                        key={metric.key}
                    >
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

            <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                role="img"
                aria-label="Vertical bar chart showing statistics by sitio"
                style={{
                    width: '100%',
                    minWidth: 720,
                    display: 'block',
                    overflow: 'visible',
                }}
            >
                <style>{`
                    .sitio-bar {
                        transform-box: fill-box;
                        transform-origin: bottom;
                        animation: growBar 900ms cubic-bezier(.22,1,.36,1) both;
                    }
                    .sitio-value {
                        opacity: 0;
                        animation: fadeValue 300ms ease forwards;
                    }
                    @keyframes growBar {
                        from { transform: scaleY(0); }
                        to { transform: scaleY(1); }
                    }
                    @keyframes fadeValue {
                        to { opacity: 1; }
                    }
                `}</style>

                {Array.from({ length: yTicks + 1 }).map((_, index) => {
                    const value = Math.round(
                        (maxValue / yTicks) * (yTicks - index)
                    );
                    const y = top + (plotHeight / yTicks) * index;

                    return (
                        <g key={index}>
                            <line
                                x1={left}
                                x2={chartWidth - 18}
                                y1={y}
                                y2={y}
                                stroke="#e9e7ef"
                                strokeDasharray="4 4"
                            />
                            <text
                                x={left - 10}
                                y={y + 4}
                                textAnchor="end"
                                fontSize="11"
                                fill="#7a7485"
                            >
                                {value}
                            </text>
                        </g>
                    );
                })}

                <line
                    x1={left}
                    x2={chartWidth - 18}
                    y1={top + plotHeight}
                    y2={top + plotHeight}
                    stroke="#d8d4df"
                />

                {data.map((row, rowIndex) => {
                    const groupX = left + rowIndex * groupWidth;
                    const totalBars =
                        metrics.length * barWidth +
                        (metrics.length - 1) * barGap;
                    const startX =
                        groupX + (groupWidth - totalBars) / 2;

                    return (
                        <g key={row.sitio}>
                            {metrics.map((metric, metricIndex) => {
                                const value =
                                    Number(row[metric.key]) || 0;
                                const height =
                                    (value / maxValue) * plotHeight;
                                const x =
                                    startX +
                                    metricIndex *
                                        (barWidth + barGap);
                                const y =
                                    top + plotHeight - height;

                                return (
                                    <g key={metric.key}>
                                        <rect
                                            className="sitio-bar"
                                            x={x}
                                            y={y}
                                            width={barWidth}
                                            height={height}
                                            rx="3"
                                            fill={metric.color}
                                            style={{
                                                animationDelay:
                                                    `${
                                                        rowIndex * 80 +
                                                        metricIndex * 70
                                                    }ms`,
                                            }}
                                        >
                                            <title>
                                                {row.sitio}: {metric.label} — {value}
                                            </title>
                                        </rect>

                                        {value > 0 && (
                                            <text
                                                className="sitio-value"
                                                x={x + barWidth / 2}
                                                y={Math.max(15, y - 6)}
                                                textAnchor="middle"
                                                fontSize="10"
                                                fontWeight="700"
                                                fill="#4a4455"
                                                style={{
                                                    animationDelay:
                                                        `${
                                                            650 +
                                                            rowIndex * 80 +
                                                            metricIndex * 70
                                                        }ms`,
                                                }}
                                            >
                                                {value}
                                            </text>
                                        )}
                                    </g>
                                );
                            })}

                            <text
                                x={groupX + groupWidth / 2}
                                y={chartHeight - 22}
                                textAnchor="middle"
                                fontSize="12"
                                fontWeight="600"
                                fill="#4a4455"
                            >
                                {row.sitio.length > 18
                                    ? row.sitio.slice(0, 16) + '…'
                                    : row.sitio}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
