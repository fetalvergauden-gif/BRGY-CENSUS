import { useState } from 'react'
import { Link } from 'react-router-dom'

const NAV_ITEMS = [
  ['/admin/dashboard', 'Dashboard', 'bi-speedometer2'],
  ['/admin/census-records', 'Census Records', 'bi-people'],
  ['/admin/form-builder', 'Census Form Builder', 'bi-ui-checks-grid'],
  ['/admin/residents', 'Residents', 'bi-person-lines-fill'],
  ['/admin/reports', 'Reports', 'bi-bar-chart-line'],
  ['/admin/export', 'Export Data', 'bi-file-earmark-spreadsheet'],
  ['/admin/activity-logs', 'Activity Logs', 'bi-clock-history'],
  ['/admin/settings', 'Settings', 'bi-gear'],
]

export default function Sidebar({ active }) {
  const [collapsed, setCollapsed] = useState(false)
  const brand = (
    <Link to="/admin/dashboard" className="brand-mark app-sidebar-brand" aria-label="Barangay Census dashboard">
      <img className="brand-logo" src="/barangay-logo.svg" alt="Barangay Census logo" />
      <span className="app-brand-copy">
        <strong>BARANGAY CENSUS</strong>
        <small>MANAGEMENT SYSTEM</small>
      </span>
    </Link>
  )

  const links = (variant = 'desktop') => NAV_ITEMS.map(([href, label, icon]) => (
    <Link key={href} to={href}
      title={collapsed && variant === 'desktop' ? label : undefined}
      aria-label={label}
      className={`nav-link app-nav-link ${active === href ? 'active' : ''}`}>
      <i className={`bi ${icon} nav-icon`} aria-hidden="true" />
      <b>{label}</b>
    </Link>
  ))

  const logout = (variant = 'desktop') => (
    <Link to="/logout" title={collapsed && variant === 'desktop' ? 'Logout' : undefined}
      className="nav-link app-nav-link app-nav-logout">
      <i className="bi bi-box-arrow-right nav-icon" aria-hidden="true" /><b>Logout</b>
    </Link>
  )

  return (
    <>
      <aside className={`app-sidebar-desktop ${collapsed ? 'is-collapsed' : ''}`} aria-label="Main navigation">
        <div className="app-sidebar-brand-wrap">
          {brand}
          <button type="button" className="sidebar-collapse-button" onClick={() => setCollapsed(v => !v)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!collapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <i className={`bi ${collapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`} />
          </button>
        </div>
        <nav className="app-sidebar-links">{links()}</nav>
        <div className="app-sidebar-footer">{logout()}</div>
      </aside>

      <header className="app-phone-header">
        {brand}
        <span className="phone-header-label">Admin Portal</span>
      </header>
      <nav className="app-mobile-bottom-nav" aria-label="Mobile navigation">
        {links('mobile')}
        {logout('mobile')}
      </nav>
    </>
  )
}
