import { useEffect, useState } from 'react'
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
} from 'react-router-dom'
import {
  onAuthStateChanged,
  signOut,
} from 'firebase/auth'

import './App.css'
import { auth } from './components/firebase'
import { API_ENDPOINTS } from './config/api'
import { CensusProvider, useCensus } from './context/CensusContext'
import LoadingScreen from './components/LoadingScreen'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Signup from './pages/Signup'
import CensusForm from './pages/CensusForm'
import AdminDashboard from './pages/AdminDashboard'
import CensusRecords from './pages/CensusRecords'
import CensusDetails from './pages/CensusDetails'
import Residents from './pages/Residents'
import Reports from './pages/Reports'
import ExportData from './pages/ExportData'
import ActivityLogs from './pages/ActivityLogs'
import Settings from './pages/Settings'
import FormBuilder from './pages/FormBuilder'

function AppRoutes() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [roleLoading, setRoleLoading] = useState(false)
  const [roleError, setRoleError] = useState('')
  const navigate = useNavigate()
  const { recordsLoading } = useCensus()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setAuthLoading(true)
      setRole(null)
      setRoleError('')

      if (!currentUser) {
        setUser(null)
        setRole(null)
        setRoleError('')
        setRoleLoading(false)
        setAuthLoading(false)
        return
      }

      setUser(currentUser)
      setRoleLoading(true)

      try {
        const token = await currentUser.getIdToken()
        const response = await fetch(API_ENDPOINTS.authSync, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ displayName: currentUser.displayName || '', email: currentUser.email || '' }),
        })
        const profile = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(profile.message || 'Unable to load your MySQL user profile.')
        setRole(profile.role === 'admin' ? 'admin' : 'user')
      } catch (error) {
        console.error('Failed to load Firebase user role:', error)
        setRole(null)
        setRoleError(error.message || 'Hindi ma-verify ang account sa server. Suriin ang API URL at CORS settings sa Render at Netlify.')
      } finally {
        setRoleLoading(false)
        setAuthLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  function handleLogin() {
    // Firebase onAuthStateChanged handles the redirect
    // after authentication and Firestore role loading.
  }

  async function handlePortalAccess() {
    // Always show the login page when someone chooses Access Portal.
    // If a Firebase session is still active, sign it out first.
    try {
      if (auth.currentUser) {
        await signOut(auth)
      }
      setUser(null)
      setRole(null)
      navigate('/login', { replace: true })
    } catch (error) {
      console.error('Unable to open the login page:', error)
      navigate('/login', { replace: true })
    }
  }

  async function handleExitToLanding() {
    // Exit/Back from the census form must end the current session so
    // the next portal visit requires login again.
    try {
      if (auth.currentUser) {
        await signOut(auth)
      }
      setUser(null)
      setRole(null)
      navigate('/landing', { replace: true })
    } catch (error) {
      console.error('Logout before returning to Landing failed:', error)
      navigate('/landing', { replace: true })
    }
  }

  async function handleLogout() {
    try {
      await signOut(auth)
      setUser(null)
      setRole(null)
      navigate('/', { replace: true })
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  function homePath() {
    return role === 'admin'
      ? '/admin/dashboard'
      : '/census'
  }

  function guard(requiredRole, element) {
    if (!user) {
      return <Navigate to="/login" replace />
    }

    if (authLoading || roleLoading || !role) {
      return <LoadingScreen />
    }

    if (role !== requiredRole) {
      return <Navigate to={homePath()} replace />
    }

    return element
  }

  if (authLoading || roleLoading || recordsLoading) {
    return <LoadingScreen />
  }

  if (user && roleError) {
    return (
      <main className="min-vh-100 d-flex align-items-center justify-content-center p-4 bg-light">
        <section className="card border-0 shadow-sm p-4" style={{ maxWidth: 520, width: '100%' }}>
          <h2 className="h5 fw-bold">Hindi ma-verify ang account</h2>
          <p className="text-secondary mb-3">Nakapasok ang Firebase Authentication, pero hindi nakumpleto ang user synchronization sa MySQL.</p>
          <div className="alert alert-danger" role="alert">{roleError}</div>
          <p className="small text-secondary">Tiyaking tama ang VITE_API_URL sa Netlify, naka-allow ang Netlify domain sa CORS_ORIGIN ng Render, at pareho ang Firebase project ID ng frontend at backend.</p>
          <button className="btn btn-primary" onClick={() => signOut(auth)}>Mag-sign out at subukan muli</button>
        </section>
      </main>
    )
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          user
            ? <Navigate to={homePath()} replace />
            : <Landing onLogin={handlePortalAccess} />
        }
      />

      <Route
        path="/landing"
        element={<Landing onLogin={handlePortalAccess} />}
      />

      <Route
        path="/login"
        element={
          user
            ? <Navigate to={homePath()} replace />
            : (
              <Login
                onLogin={handleLogin}
                onSignUp={() => navigate('/signup')}
                onBack={() => navigate('/')}
              />
            )
        }
      />

      <Route
        path="/signup"
        element={
          user
            ? <Navigate to={homePath()} replace />
            : (
              <Signup
                onLogin={() => navigate('/login')}
                onBack={() => navigate('/')}
              />
            )
        }
      />

      <Route
        path="/census"
        element={guard('user', <CensusForm onExit={handleExitToLanding} />)}
      />

      <Route
        path="/admin/dashboard"
        element={guard('admin', <AdminDashboard />)}
      />

      <Route path="/admin/form-builder" element={guard('admin', <FormBuilder />)} />

      <Route
        path="/admin/census-records"
        element={guard(
          'admin',
          <CensusRecords
            onView={(id) =>
              navigate(`/admin/census-details/${id}`)
            }
          />,
        )}
      />

      <Route
        path="/admin/census-details"
        element={
          <Navigate
            to="/admin/census-records"
            replace
          />
        }
      />

      <Route
        path="/admin/census-details/:id"
        element={guard('admin', <CensusDetailRoute />)}
      />

      <Route
        path="/admin/residents"
        element={guard('admin', <Residents />)}
      />

      <Route
        path="/admin/reports"
        element={guard('admin', <Reports />)}
      />

      <Route
        path="/admin/export"
        element={guard('admin', <ExportData />)}
      />

      <Route
        path="/admin/activity-logs"
        element={guard('admin', <ActivityLogs />)}
      />

      <Route
        path="/admin/settings"
        element={guard('admin', <Settings />)}
      />

      <Route
        path="/logout"
        element={<LogoutRoute onLogout={handleLogout} />}
      />

      <Route
        path="*"
        element={
          user
            ? <Navigate to={homePath()} replace />
            : <Navigate to="/login" replace />
        }
      />
    </Routes>
  )
}

function LogoutRoute({ onLogout }) {
  useEffect(() => {
    onLogout()
  }, [onLogout])

  return <LoadingScreen message="Signing you out securely..." />
}

function CensusDetailRoute() {
  const navigate = useNavigate()
  const { id } = useParams()

  return (
    <CensusDetails
      id={id}
      onBack={() => navigate('/admin/census-records')}
    />
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <CensusProvider>
        <AppRoutes />
      </CensusProvider>
    </BrowserRouter>
  )
}
