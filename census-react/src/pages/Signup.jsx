import { useState } from 'react'
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth'
import { auth } from '../components/firebase'

function friendlyError(code) {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with that email already exists.'
    case 'auth/invalid-email':
      return 'That email address looks invalid.'
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.'
    case 'auth/network-request-failed':
      return 'Network error. Check your internet connection.'
    case 'auth/operation-not-allowed':
      return 'Email/password registration is not enabled in Firebase Authentication.'
    default:
      return 'Something went wrong. Please try again.'
  }
}

export default function Signup({ onLogin, onBack }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      )

      await updateProfile(credential.user, {
        displayName: name.trim(),
      })

      const token = await credential.user.getIdToken()

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8080'}/api/auth/sync`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            displayName: name.trim(),
            email: credential.user.email || '',
          }),
        }
      )

      const profile = await response.json().catch(() => ({}))

      if (!response.ok) {
        // Do not expose backend or database details to the user.
        throw new Error('ACCOUNT_SYNC_FAILED')
      }

      await signOut(auth)
      setSuccess(true)

    } catch (err) {
      console.error('Firebase signup error:', err)

      if (err.code) {
        setError(friendlyError(err.code))
      } else {
        console.error('Account setup error:', err)
        setError('We could not complete your account setup. Please try again later.')
      }
    } finally {
      setLoading(false)
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
      background: 'rgba(255,255,255,0.97)',
      border: '1px solid rgba(255,255,255,0.8)',
      boxShadow: '0 20px 55px rgba(60,30,100,0.20)',
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
  }

  return (
    <main style={styles.page}>

      {/* Background Overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(255,255,255,0.06)',
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
                    fontSize: '25px',
                    letterSpacing: '-0.8px',
                  }}
                >
                  Create your account
                </h1>

                <p
                  className="mb-0"
                  style={{
                    color: '#777184',
                    fontSize: '12px',
                    lineHeight: '1.5',
                  }}
                >
                  Create an account to access the Barangay Census Portal.
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

              {/* Success Message */}
              {success ? (

                <div className="text-center">

                  <div
                    className="mx-auto d-flex align-items-center justify-content-center mb-3"
                    style={{
                      width: '55px',
                      height: '55px',
                      borderRadius: '50%',
                      background: '#dcfce7',
                      color: '#15803d',
                      fontSize: '26px',
                      fontWeight: 'bold',
                    }}
                  >
                    ✓
                  </div>

                  <h5
                    className="fw-bold mb-2"
                    style={{ color: '#25143b' }}
                  >
                    Account Created!
                  </h5>

                  <div
                    className="alert alert-success py-3"
                    role="alert"
                    style={{
                      fontSize: '12px',
                      borderRadius: '10px',
                    }}
                  >
                    <strong>Registration successful!</strong>
                    <br />
                    You can now log in to the Barangay Census Portal.
                  </div>

                  <button
                    type="button"
                    className="btn w-100"
                    style={styles.primaryButton}
                    onClick={onLogin}
                  >
                    GO TO LOG IN
                  </button>

                </div>

              ) : (

                <>
                  {/* Signup Form */}
                  <form onSubmit={handleSubmit}>

                    <div className="mb-3">

                      <label
                        htmlFor="signup-name"
                        className="form-label fw-semibold mb-2"
                        style={{
                          fontSize: '12px',
                          color: '#393044',
                        }}
                      >
                        Full Name
                      </label>

                      <input
                        id="signup-name"
                        type="text"
                        className="form-control"
                        style={styles.input}
                        placeholder="Enter your full name"
                        autoComplete="name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        required
                      />

                    </div>

                    <div className="mb-3">

                      <label
                        htmlFor="signup-email"
                        className="form-label fw-semibold mb-2"
                        style={{
                          fontSize: '12px',
                          color: '#393044',
                        }}
                      >
                        Email Address
                      </label>

                      <input
                        id="signup-email"
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
                        htmlFor="signup-password"
                        className="form-label fw-semibold mb-2"
                        style={{
                          fontSize: '12px',
                          color: '#393044',
                        }}
                      >
                        Password
                      </label>

                      <input
                        id="signup-password"
                        type="password"
                        className="form-control"
                        style={styles.input}
                        placeholder="Create a password"
                        autoComplete="new-password"
                        minLength={6}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                      />

                      <div
                        className="form-text mt-2"
                        style={{
                          fontSize: '10px',
                          color: '#96909f',
                        }}
                      >
                        Password must be at least 6 characters.
                      </div>

                    </div>

                    <button
                      type="submit"
                      className="btn w-100"
                      style={styles.primaryButton}
                      disabled={loading}
                    >
                      {loading ? 'CREATING ACCOUNT...' : 'SIGN UP'}
                    </button>

                  </form>

                  {/* Login Link */}
                  <p
                    className="text-center mt-4 mb-0"
                    style={{
                      color: '#777184',
                      fontSize: '12px',
                    }}
                  >
                    Already have an account?{' '}

                    <button
                      type="button"
                      className="btn p-0 border-0 fw-bold"
                      onClick={onLogin}
                      style={{
                        color: '#7c3aed',
                        background: 'transparent',
                        fontSize: '12px',
                      }}
                    >
                      Log in
                    </button>

                  </p>
                </>

              )}

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