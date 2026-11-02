
function Landing({ onLogin }) {
    const contactLinkStyle = {
        color: '#ffffff',
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        minWidth: 0,
    };

    const contactIconStyle = {
        width: '38px',
        height: '38px',
        minWidth: '38px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.12)',
        fontSize: '16px',
    };

    return (
        <div
            className="landing-page"
            style={{
                minHeight: '100vh',
                background:
                    'linear-gradient(135deg, #16052f 0%, #321064 45%, #641bb3 100%)',
                overflow: 'hidden',
            }}
        >
            {/* =========================
                NAVBAR
            ========================== */}
            <nav
                className="navbar landing-navbar sticky-top"
                style={{
                    background:
                        'linear-gradient(90deg, rgba(22,5,47,0.98), rgba(120,26,226,0.96))',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(255,255,255,0.12)',
                }}
            >
                <div
                    className="container py-2"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                    }}
                >
                    {/* BRAND */}
                    <span
                        className="brand-mark"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                        }}
                    >
                        <img
                            className="brand-logo"
                            src="/barangay-logo.svg"
                            alt="Barangay logo"
                            style={{
                                width: '52px',
                                height: '52px',
                                objectFit: 'contain',
                                background:
                                    'linear-gradient(135deg, #ffffff, #eadcff)',
                                borderRadius: '14px',
                                padding: '5px',
                                boxShadow: '0 8px 25px rgba(0,0,0,0.25)',
                            }}
                        />

                        <span
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                lineHeight: '1.05',
                            }}
                        >
                            <strong
                                style={{
                                    color: '#ffffff',
                                    fontSize: '15px',
                                    letterSpacing: '0.5px',
                                }}
                            >
                                BARANGAY CENSUS
                            </strong>

                            <small
                                style={{
                                    color: '#d8bfff',
                                    fontSize: '10px',
                                    fontWeight: '700',
                                    letterSpacing: '1px',
                                    marginTop: '4px',
                                }}
                            >
                                MANAGEMENT SYSTEM
                            </small>
                        </span>
                    </span>

                    {/* ACCESS PORTAL */}
                    <button
                        className="btn"
                        onClick={onLogin}
                        style={{
                            border: '1px solid rgba(255,255,255,0.35)',
                            background:
                                'linear-gradient(135deg, #7b2cff, #a855f7)',
                            color: '#ffffff',
                            fontWeight: '800',
                            letterSpacing: '0.5px',
                            padding: '10px 22px',
                            borderRadius: '999px',
                            boxShadow:
                                '0 8px 25px rgba(124,58,237,0.35)',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        ACCESS PORTAL
                    </button>
                </div>
            </nav>

            {/* =========================
                HERO SECTION
            ========================== */}
            <header
                className="hero-section"
                style={{
                    position: 'relative',
                    minHeight: '650px',
                    display: 'flex',
                    alignItems: 'center',
                    overflow: 'hidden',
                    background:
                        'linear-gradient(135deg, #19072f 0%, #32105e 48%, #7027c8 100%)',
                    padding: '55px 0',
                }}
            >
                {/* BACKGROUND GLOW */}
                <div
                    style={{
                        position: 'absolute',
                        width: '500px',
                        height: '500px',
                        borderRadius: '50%',
                        background:
                            'radial-gradient(circle, rgba(168,85,247,0.35), rgba(168,85,247,0) 70%)',
                        top: '-180px',
                        right: '-100px',
                        pointerEvents: 'none',
                    }}
                />

                <div
                    style={{
                        position: 'absolute',
                        width: '450px',
                        height: '450px',
                        borderRadius: '50%',
                        background:
                            'radial-gradient(circle, rgba(239,68,68,0.18), rgba(239,68,68,0) 70%)',
                        bottom: '-200px',
                        left: '-150px',
                        pointerEvents: 'none',
                    }}
                />

                <div
                    className="container position-relative"
                    style={{ zIndex: 2 }}
                >
                    <div className="row align-items-center g-5">
                        {/* LEFT SIDE */}
                        <div className="col-lg-7">
                            <span
                                className="eyebrow"
                                style={{
                                    display: 'inline-block',
                                    color: '#d8b4fe',
                                    fontSize: '13px',
                                    fontWeight: '800',
                                    letterSpacing: '2px',
                                    marginBottom: '18px',
                                }}
                            >
                                DIGITAL BARANGAY INFORMATION SYSTEM
                            </span>

                            <h1
                                style={{
                                    color: '#ffffff',
                                    fontSize: 'clamp(38px, 6vw, 78px)',
                                    fontWeight: '900',
                                    lineHeight: '0.98',
                                    letterSpacing: '-2px',
                                    marginBottom: '25px',
                                    textTransform: 'uppercase',
                                }}
                            >
                                MODERN CENSUS.
                                <br />

                                <span
                                    style={{
                                        background:
                                            'linear-gradient(90deg, #ffffff, #d8b4fe)',
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                    }}
                                >
                                    BETTER COMMUNITY DATA.
                                </span>
                            </h1>

                            <p
                                className="hero-lead"
                                style={{
                                    color: '#ffffff',
                                    fontSize: '18px',
                                    lineHeight: '1.7',
                                    maxWidth: '700px',
                                    marginBottom: '15px',
                                }}
                            >
                                A simple digital way for residents to submit
                                census information and for barangay
                                administrators to manage reliable community
                                records.
                            </p>

                            <p
                                className="hero-copy"
                                style={{
                                    color: '#d8c7ee',
                                    fontSize: '15px',
                                    lineHeight: '1.8',
                                    maxWidth: '680px',
                                }}
                            >
                                Collect household information, organize
                                residents by Sitio, monitor Senior Citizens,
                                PWD and 4Ps counts, and prepare reports from
                                one connected census management system.
                            </p>

                            <button
                                className="btn mt-3"
                                onClick={onLogin}
                                style={{
                                    background:
                                        'linear-gradient(135deg, #8b2cff, #c026d3)',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '14px 28px',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    fontWeight: '900',
                                    letterSpacing: '0.7px',
                                    boxShadow:
                                        '0 12px 30px rgba(139,44,255,0.35)',
                                }}
                            >
                                ENTER CENSUS PORTAL
                            </button>
                        </div>

                        {/* RIGHT SIDE */}
                        <div className="col-lg-5">
                            <div
                                style={{
                                    position: 'relative',
                                    width: '100%',
                                    maxWidth: '480px',
                                    height: '480px',
                                    margin: '0 auto',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {/* OUTER GLOW */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        width: 'min(440px, 100%)',
                                        height: 'min(440px, 100%)',
                                        borderRadius: '50%',
                                        background:
                                            'linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02))',
                                        filter: 'blur(1px)',
                                    }}
                                />

                                {/* RED CIRCLE */}
                                <div
                                    style={{
                                        position: 'relative',
                                        width: 'min(390px, 85vw)',
                                        height: 'min(390px, 85vw)',
                                        borderRadius: '50%',
                                        padding: '12px',
                                        background:
                                            'linear-gradient(135deg, #ff1f3d 0%, #c1121f 35%, #7f1d1d 65%, #ef4444 100%)',
                                        boxShadow:
                                            '0 0 0 8px rgba(255,255,255,0.08), 0 25px 70px rgba(0,0,0,0.45), 0 0 80px rgba(239,68,68,0.25)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {/* INNER CIRCLE */}
                                    <div
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            borderRadius: '50%',
                                            background:
                                                'linear-gradient(145deg, #ffffff 0%, #f8f4ff 50%, #eadcff 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            overflow: 'hidden',
                                            border:
                                                '5px solid rgba(255,255,255,0.75)',
                                        }}
                                    >
                                        {/* BARANGAY LOGO */}
                                        <img
                                            src="/bdel-mundo.webp"
                                            alt="Barangay B. Del Mundo logo"
                                            style={{
                                                width: '92%',
                                                height: '92%',
                                                objectFit: 'contain',
                                                display: 'block',
                                                borderRadius: '50%',
                                            }}
                                            onError={(e) => {
                                                console.error(
                                                    'Failed to load barangay logo:',
                                                    e.currentTarget.src
                                                );
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* FLOATING LABEL */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        bottom: '20px',
                                        right: '5px',
                                        background:
                                            'linear-gradient(135deg, #ffffff, #f3e8ff)',
                                        color: '#4c1d95',
                                        padding: '12px 18px',
                                        borderRadius: '14px',
                                        boxShadow:
                                            '0 15px 35px rgba(0,0,0,0.25)',
                                        fontWeight: '800',
                                        fontSize: '13px',
                                    }}
                                >
                                    <i
                                        className="bi bi-geo-alt-fill"
                                        style={{
                                            marginRight: '7px',
                                            color: '#dc2626',
                                        }}
                                    />
                                    B. DEL MUNDO
                                </div>

                                {/* CENSUS BADGE */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '45px',
                                        left: '10px',
                                        padding: '12px 16px',
                                        borderRadius: '14px',
                                        background: 'rgba(255,255,255,0.12)',
                                        border:
                                            '1px solid rgba(255,255,255,0.2)',
                                        backdropFilter: 'blur(10px)',
                                        color: '#ffffff',
                                        boxShadow:
                                            '0 10px 30px rgba(0,0,0,0.2)',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: '11px',
                                            color: '#d8b4fe',
                                            fontWeight: '700',
                                        }}
                                    >
                                        BARANGAY
                                    </div>

                                    <strong style={{ fontSize: '18px' }}>
                                        CENSUS 2026
                                    </strong>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* =========================
                FEATURES SECTION
            ========================== */}
            <section
                className="about-section py-5"
                style={{
                    background:
                        'linear-gradient(180deg, #ffffff 0%, #f7f3ff 100%)',
                }}
            >
                <div className="container py-3">
                    <div className="row g-4">
                        {/* CARD 1 */}
                        <div className="col-md-4">
                            <div
                                className="feature-card light"
                                style={{
                                    height: '100%',
                                    padding: '30px',
                                    borderRadius: '22px',
                                    background:
                                        'linear-gradient(145deg, #ffffff, #f5edff)',
                                    border:
                                        '1px solid rgba(124,58,237,0.10)',
                                    boxShadow:
                                        '0 15px 40px rgba(76,29,149,0.08)',
                                }}
                            >
                                <div
                                    className="feature-icon"
                                    style={{
                                        width: '58px',
                                        height: '58px',
                                        borderRadius: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background:
                                            'linear-gradient(135deg, #7c3aed, #a855f7)',
                                        color: '#ffffff',
                                        fontSize: '24px',
                                        marginBottom: '20px',
                                    }}
                                >
                                    <i className="bi bi-ui-checks-grid" />
                                </div>

                                <h3
                                    style={{
                                        color: '#24103f',
                                        fontWeight: '800',
                                    }}
                                >
                                    Easy Census Form
                                </h3>

                                <p
                                    style={{
                                        color: '#6b5b7b',
                                        lineHeight: '1.7',
                                    }}
                                >
                                    Residents complete one clear,
                                    mobile-friendly census form.
                                </p>
                            </div>
                        </div>

                        {/* CARD 2 */}
                        <div className="col-md-4">
                            <div
                                className="feature-card light"
                                style={{
                                    height: '100%',
                                    padding: '30px',
                                    borderRadius: '22px',
                                    background:
                                        'linear-gradient(145deg, #ffffff, #f5edff)',
                                    border:
                                        '1px solid rgba(124,58,237,0.10)',
                                    boxShadow:
                                        '0 15px 40px rgba(76,29,149,0.08)',
                                }}
                            >
                                <div
                                    className="feature-icon"
                                    style={{
                                        width: '58px',
                                        height: '58px',
                                        borderRadius: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background:
                                            'linear-gradient(135deg, #7c3aed, #a855f7)',
                                        color: '#ffffff',
                                        fontSize: '24px',
                                        marginBottom: '20px',
                                    }}
                                >
                                    <i className="bi bi-bar-chart-line" />
                                </div>

                                <h3
                                    style={{
                                        color: '#24103f',
                                        fontWeight: '800',
                                    }}
                                >
                                    Data-Focused Dashboard
                                </h3>

                                <p
                                    style={{
                                        color: '#6b5b7b',
                                        lineHeight: '1.7',
                                    }}
                                >
                                    Administrators can view totals, Sitio
                                    statistics, charts and records.
                                </p>
                            </div>
                        </div>

                        {/* CARD 3 */}
                        <div className="col-md-4">
                            <div
                                className="feature-card light"
                                style={{
                                    height: '100%',
                                    padding: '30px',
                                    borderRadius: '22px',
                                    background:
                                        'linear-gradient(145deg, #ffffff, #f5edff)',
                                    border:
                                        '1px solid rgba(124,58,237,0.10)',
                                    boxShadow:
                                        '0 15px 40px rgba(76,29,149,0.08)',
                                }}
                            >
                                <div
                                    className="feature-icon"
                                    style={{
                                        width: '58px',
                                        height: '58px',
                                        borderRadius: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background:
                                            'linear-gradient(135deg, #7c3aed, #a855f7)',
                                        color: '#ffffff',
                                        fontSize: '24px',
                                        marginBottom: '20px',
                                    }}
                                >
                                    <i className="bi bi-file-earmark-arrow-down" />
                                </div>

                                <h3
                                    style={{
                                        color: '#24103f',
                                        fontWeight: '800',
                                    }}
                                >
                                    Reports & Export
                                </h3>

                                <p
                                    style={{
                                        color: '#6b5b7b',
                                        lineHeight: '1.7',
                                    }}
                                >
                                    Prepare report views and export census
                                    data for further processing.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* =========================
                FOOTER
            ========================== */}
            <footer
                style={{
                    background:
                        'linear-gradient(135deg, #16052f 0%, #2d0b55 50%, #4c1d95 100%)',
                    color: '#ffffff',
                    padding: '50px 0 25px',
                    borderTop: '1px solid rgba(255,255,255,0.12)',
                }}
            >
                <div className="container">
                    <div className="row g-4 align-items-start">
                        {/* BRAND / ABOUT */}
                        <div className="col-lg-5 col-md-6">
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '14px',
                                    marginBottom: '18px',
                                }}
                            >
                                <img
                                    src="/barangay-logo.svg"
                                    alt="Barangay logo"
                                    style={{
                                        width: '55px',
                                        height: '55px',
                                        objectFit: 'contain',
                                        background: '#ffffff',
                                        borderRadius: '14px',
                                        padding: '5px',
                                    }}
                                />

                                <div>
                                    <strong
                                        style={{
                                            display: 'block',
                                            fontSize: '16px',
                                            letterSpacing: '0.5px',
                                        }}
                                    >
                                        BARANGAY CENSUS
                                    </strong>

                                    <small
                                        style={{
                                            color: '#d8b4fe',
                                            fontWeight: '700',
                                            letterSpacing: '1px',
                                        }}
                                    >
                                        MANAGEMENT SYSTEM
                                    </small>
                                </div>
                            </div>

                            <p
                                style={{
                                    color: '#d6c8e8',
                                    lineHeight: '1.7',
                                    maxWidth: '470px',
                                    marginBottom: '0',
                                }}
                            >
                                A digital barangay census system designed to
                                help residents submit information and help
                                barangay administrators manage community
                                records efficiently.
                            </p>
                        </div>

                        {/* CONTACT INFORMATION */}
                        <div className="col-lg-4 col-md-6">
                            <h5
                                style={{
                                    fontWeight: '800',
                                    marginBottom: '20px',
                                }}
                            >
                                Contact Us
                            </h5>

                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px',
                                }}
                            >
                                {/* FACEBOOK */}
                                <a
                                    href="https://web.facebook.com/BarangayBDM/about"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={contactLinkStyle}
                                >
                                    <span style={contactIconStyle}>
                                        <i className="bi bi-facebook" />
                                    </span>

                                    <span>
                                        Barangay B. Del Mundo
                                    </span>
                                </a>

                                {/* PHONE */}
                                <a
                                    href="tel:+639602122448"
                                    style={contactLinkStyle}
                                >
                                    <span style={contactIconStyle}>
                                        <i className="bi bi-telephone-fill" />
                                    </span>

                                    <span>
                                        0960 212 2448
                                    </span>
                                </a>

                                {/* EMAIL */}
                                <a
                                    href="mailto:aasenso.gaganda.samasama@gmail.com"
                                    style={{
                                        ...contactLinkStyle,
                                        overflowWrap: 'anywhere',
                                    }}
                                >
                                    <span style={contactIconStyle}>
                                        <i className="bi bi-envelope-fill" />
                                    </span>

                                    <span
                                        style={{
                                            overflowWrap: 'anywhere',
                                            minWidth: 0,
                                        }}
                                    >
                                        aasenso.gaganda.samasama@gmail.com
                                    </span>
                                </a>
                            </div>
                        </div>

                        {/* BARANGAY OFFICE */}
                        <div className="col-lg-3 col-md-12">
                            <h5
                                style={{
                                    fontWeight: '800',
                                    marginBottom: '20px',
                                }}
                            >
                                Barangay Office
                            </h5>

                            <div
                                style={{
                                    color: '#d6c8e8',
                                    lineHeight: '1.8',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '12px',
                                        marginBottom: '10px',
                                    }}
                                >
                                    <i className="bi bi-geo-alt-fill" />

                                    <span>
                                        Barangay B. Del Mundo,
                                        Mansalay, Oriental Mindoro
                                    </span>
                                </div>

                                <div
                                    style={{
                                        display: 'flex',
                                        gap: '12px',
                                    }}
                                >
                                    <i className="bi bi-clock-fill" />

                                    <span>
                                        Monday – Friday
                                        <br />
                                        8:00 AM – 5:00 PM
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* DIVIDER */}
                    <hr
                        style={{
                            border: 'none',
                            borderTop:
                                '1px solid rgba(255,255,255,0.15)',
                            margin: '35px 0 20px',
                        }}
                    />

                    {/* FOOTER BOTTOM */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '10px',
                        }}
                    >
                        <small
                            style={{
                                color: '#b9a8ce',
                            }}
                        >
                            © 2026 Barangay Census Management System.
                            All rights reserved.
                        </small>

                        <small
                            style={{
                                color: '#b9a8ce',
                            }}
                        >
                            Digital Barangay Information System
                        </small>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default Landing;
