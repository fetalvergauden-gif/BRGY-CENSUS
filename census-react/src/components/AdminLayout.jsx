import Sidebar from './Sidebar'

export default function AdminLayout({ active, children, title, subtitle }) {
  return (
    <div className="census-app-layout">
      <Sidebar active={active} />
      <main className="census-main">
        <div className="census-page-content">
          {title && (
            <div className="page-header mb-4">
              <span className="section-kicker">BARANGAY CENSUS SYSTEM</span>
              <h1 className="mb-1"><b>{title}</b></h1>
              {subtitle && <p className="text-secondary mb-0">{subtitle}</p>}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  )
}
