import './LoadingScreen.css'

export default function LoadingScreen({ message = 'Preparing your census workspace...' }) {
  return (
    <main className="census-loading-screen" role="status" aria-live="polite" aria-label="Loading Barangay Census Management System">
      <div className="census-loading-content">
        <div className="census-loading-brand">
          <span className="census-loading-logo-wrap">
            <img src="/barangay-logo.svg" alt="Barangay logo" className="census-loading-logo" />
          </span>
          <span className="census-loading-brand-copy">
            <strong>BARANGAY CENSUS</strong>
            <small>MANAGEMENT SYSTEM</small>
          </span>
        </div>

        <div className="census-loading-spinner" aria-hidden="true" />
        <h1>Please Wait</h1>
        <p>{message}</p>
        <div className="census-loading-progress" aria-hidden="true"><span /></div>
        <small className="census-loading-footnote">Barangay Census Management System</small>
      </div>
    </main>
  )
}
