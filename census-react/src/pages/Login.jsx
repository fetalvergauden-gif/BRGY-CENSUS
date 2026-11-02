import { useState } from 'react'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth'
import { auth, googleProvider } from '../components/firebase'

function friendlyError(code) {
  switch (code) {
    case 'auth/invalid-email':
      return 'That email address looks invalid.'
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Incorrect email or password.'
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.'
    case 'auth/network-request-failed':
      return 'Network error. Check your internet connection.'
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was closed before finishing.'
    case 'auth/popup-blocked':
      return 'The Google sign-in popup was blocked. Please allow popups and try again.'
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled in Firebase Authentication.'
    case 'auth/unauthorized-domain':
      return 'This website is not authorized in Firebase Authentication.'
    case 'auth/user-disabled':
      return 'This account has been disabled.'
    default:
      return 'Something went wrong. Please try again.'
  }
}

export default function Login({ onLogin, onSignUp, onBack }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
      onLogin?.()
    } catch (err) {
      console.error('Firebase email login error:', err)
      setError(friendlyError(err.code))
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleLogin() {
    setError('')
    setGoogleLoading(true)

    try {
      await signInWithPopup(auth, googleProvider)
      onLogin?.()
    } catch (err) {
      console.error('Firebase Google login error:', err)
      setError(friendlyError(err.code))
    } finally {
      setGoogleLoading(false)
    }
  }

  const styles = {
    page: {
      minHeight: '100vh',
      minHeight: '100svh',
      width: '100%',
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px 12px',
      overflowX: 'hidden',
      backgroundImage: `
        linear-gradient(
          135deg,
          rgba(167, 139, 250, 0.48),
          rgba(196, 181, 253, 0.38),
          rgba(139, 92, 246, 0.48)
        ),
        url('/images/barangay-bg.png')
      `,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'scroll',
    },

    card: {
      width: '100%',
      maxWidth: '410px',
      padding: '26px 28px 22px',
      borderRadius: '20px',
      background: 'rgba(255, 255, 255, 0.97)',
      border: '1px solid rgba(255, 255, 255, 0.8)',
      boxShadow: '0 20px 55px rgba(60, 30, 100, 0.20)',
    },

    input: {
      height: '45px',
      borderRadius: '9px',
      fontSize: '13px',
      backgroundColor: '#faf9fc',
      border: '1px solid #e5e0ec',
    },

    primaryButton: {
      height: '46px',
      border: 'none',
      borderRadius: '9px',
      background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
      color: '#fff',
      fontSize: '13px',
      fontWeight: '800',
      letterSpacing: '0.6px',
      transition: 'all 0.2s ease',
    },

    googleButton: {
      height: '45px',
      borderRadius: '9px',
      border: '1px solid #e4e0e9',
      background: '#fff',
      color: '#37303f',
      fontSize: '12px',
      fontWeight: '700',
      transition: 'all 0.2s ease',
    },
  }

  return (
    <main style={styles.page}>

      {/* Soft Background Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(255, 255, 255, 0.06)',
          pointerEvents: 'none',
        }}
      />

      <div
        className="container position-relative"
        style={{ zIndex: 1 }}
      >
        <div className="row justify-content-center align-items-center">

          <div className="col-12 col-sm-10 col-md-7 col-lg-5 col-xl-4">

            <section style={styles.card}>

              {/* Back Button */}
              <button
                type="button"
                className="btn p-0 border-0 mb-3"
                onClick={onBack}
                style={{
                  background: 'transparent',
                  color: '#777184',
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                ← Back to home
              </button>

              {/* Logo and Heading */}
              <div className="text-center mb-4">

                <div
                  className="d-flex align-items-center justify-content-center mx-auto mb-3"
                  style={{
                    width: '58px',
                    height: '58px',
                    borderRadius: '16px',
                    background: '#f3eaff',
                  }}
                >
                  <img
                    src="/barangay-logo.svg"
                    alt="Barangay logo"
                    style={{
                      width: '43px',
                      height: '43px',
                      objectFit: 'contain',
                    }}
                  />
                </div>

                <div
                  className="mb-2"
                  style={{
                    color: '#7c3aed',
                    fontSize: '9px',
                    fontWeight: '800',
                    letterSpacing: '1.4px',
                  }}
                >
                  BARANGAY CENSUS MANAGEMENT SYSTEM
                </div>

                <h1
                  className="fw-bold mb-2"
                  style={{
                    color: '#25143b',
                    fontSize: '27px',
                    letterSpacing: '-0.8px',
                  }}
                >
                  Welcome back
                </h1>

                <p
                  className="mb-0"
                  style={{
                    color: '#777184',
                    fontSize: '13px',
                  }}
                >
                  Sign in to access the Barangay Census Portal.
                </p>

              </div>

              {/* Error Message */}
              {error && (
                <div
                  className="alert alert-danger py-2 mb-3"
                  role="alert"
                  style={{
                    fontSize: '12px',
                    borderRadius: '9px',
                  }}
                >
                  {error}
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit}>

                <div className="mb-3">
                  <label
                    htmlFor="login-email"
                    className="form-label fw-semibold mb-2"
                    style={{
                      fontSize: '12px',
                      color: '#393044',
                    }}
                  >
                    Email Address
                  </label>

                  <input
                    id="login-email"
                    type="email"
                    className="form-control"
                    style={styles.input}
                    placeholder="Enter your email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label
                    htmlFor="login-password"
                    className="form-label fw-semibold mb-2"
                    style={{
                      fontSize: '12px',
                      color: '#393044',
                    }}
                  >
                    Password
                  </label>

                  <input
                    id="login-password"
                    type="password"
                    className="form-control"
                    style={styles.input}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn w-100"
                  style={styles.primaryButton}
                  disabled={loading || googleLoading}
                >
                  {loading ? 'LOGGING IN...' : 'LOG IN'}
                </button>

              </form>

              {/* Divider */}
              <div className="d-flex align-items-center gap-3 my-4">

                <hr className="flex-grow-1 m-0" />

                <small
                  style={{
                    color: '#96909f',
                    fontSize: '9px',
                    fontWeight: '700',
                    letterSpacing: '1px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  OR CONTINUE WITH
                </small>

                <hr className="flex-grow-1 m-0" />

              </div>

              {/* Google Login */}
              <button
                type="button"
                className="btn w-100 d-flex align-items-center justify-content-center gap-2"
                style={styles.googleButton}
                onClick={handleGoogleLogin}
                disabled={loading || googleLoading}
              >
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  width="18"
                  height="18"
                />

                {googleLoading
                  ? 'SIGNING IN...'
                  : 'Continue with Google'}
              </button>

              {/* Signup Link */}
              <p
                className="text-center mt-4 mb-0"
                style={{
                  color: '#777184',
                  fontSize: '12px',
                }}
              >
                Don't have an account?{' '}

                <button
                  type="button"
                  className="btn p-0 border-0 fw-bold"
                  onClick={onSignUp}
                  style={{
                    color: '#7c3aed',
                    background: 'transparent',
                    fontSize: '12px',
                  }}
                >
                  Sign up
                </button>
              </p>

              {/* Footer */}
              <div
                className="text-center mt-3 pt-3"
                style={{
                  color: '#a09aaa',
                  fontSize: '10px',
                  borderTop: '1px solid #f0edf4',
                }}
              >
                Secure authentication powered by Firebase
              </div>

            </section>

          </div>
        </div>
      </div>
    </main>
  )
}