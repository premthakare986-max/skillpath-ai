import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User as FirebaseUser,
  AuthError
} from 'firebase/auth';

// Read Firebase client configuration from Vite environment
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (import.meta.env.VITE_FIREBASE_PROJECT_ID ? `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com` : undefined),
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
};

// Initialize Firebase App safely if configuration is present
let app: any = null;
let auth: any = null;
let googleProvider: GoogleAuthProvider | null = null;

if (isFirebaseConfigured()) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' });
  } catch (err) {
    console.warn('Firebase initialization warning:', err);
  }
}

export interface GoogleAuthResult {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  idToken?: string;
}

/**
 * Initiates the official Firebase Google Sign-In popup flow
 */
export async function signInWithGoogleFromFirebase(): Promise<GoogleAuthResult> {
  if (!isFirebaseConfigured() || !auth || !googleProvider) {
    throw new Error(
      'Firebase is not configured yet. Please configure VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID, and enable Google provider under Firebase Console → Authentication → Sign-in method.'
    );
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user: FirebaseUser = result.user;
    const idToken = await user.getIdToken();

    return {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName,
      photoURL: user.photoURL,
      idToken
    };
  } catch (error: any) {
    const authError = error as AuthError;
    const code = authError?.code || '';

    if (code === 'auth/popup-closed-by-user') {
      throw new Error('Google sign-in popup was closed before completing authentication.');
    }
    if (code === 'auth/cancelled-popup-request') {
      throw new Error('Google sign-in popup request was cancelled.');
    }
    if (code === 'auth/popup-blocked') {
      throw new Error('Google sign-in popup was blocked by your browser. Please allow popups for this site.');
    }
    if (code === 'auth/operation-not-allowed') {
      throw new Error('Google provider is not enabled in Firebase Console. Please go to Firebase Console → Authentication → Sign-in method and enable Google provider.');
    }
    if (code === 'auth/network-request-failed') {
      throw new Error('Network error occurred during Google sign-in. Please check your internet connection.');
    }
    if (code === 'auth/account-exists-with-different-credential') {
      throw new Error('An account already exists with this email address.');
    }

    throw new Error(authError.message || 'Failed to authenticate with Google.');
  }
}

/**
 * Signs out from Firebase Authentication
 */
export async function signOutFirebase(): Promise<void> {
  if (auth) {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Firebase sign-out warning:', err);
    }
  }
}
