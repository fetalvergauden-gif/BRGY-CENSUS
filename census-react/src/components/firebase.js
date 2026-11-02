import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyB8qAzGHI0oA6y-Y-lxQOjOdqgTnl_9vmY",
  authDomain: "census-react-1de15.firebaseapp.com",
  projectId: "census-react-1de15",
  storageBucket: "census-react-1de15.firebasestorage.app",
  messagingSenderId: "1075581529930",
  appId: "1:1075581529930:web:43d76621507ade3ec41bb3",
  measurementId: "G-Y7YD5SKXT5"
};

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

googleProvider.setCustomParameters({
  prompt: 'select_account',
})


export default app
