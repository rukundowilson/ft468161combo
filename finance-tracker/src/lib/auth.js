import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from 'firebase/auth';
import { auth } from './firebase';

// Sign in with email and password
export const signIn = async (email, password) => {
  try {
    if (!auth) {
      return { user: null, error: 'Firebase is not initialized. Please refresh the page.' };
    }
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    // Provide user-friendly error messages
    let errorMessage = error.message;
    if (error.code === 'auth/configuration-not-found' || error.code === 'auth/invalid-api-key') {
      errorMessage = 'Firebase configuration error. Please check your Firebase setup.';
    } else if (error.code === 'auth/user-not-found') {
      errorMessage = 'No account found with this email. Please sign up first.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Incorrect password. Please try again.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Network error. Please check your internet connection.';
    }
    return { user: null, error: errorMessage };
  }
};

// Sign up with email and password
export const signUp = async (email, password) => {
  try {
    if (!auth) {
      return { user: null, error: 'Firebase is not initialized. Please refresh the page.' };
    }
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    // Provide user-friendly error messages
    let errorMessage = error.message;
    if (error.code === 'auth/configuration-not-found' || error.code === 'auth/invalid-api-key') {
      errorMessage = 'Firebase configuration error. Please check your Firebase setup.';
    } else if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'An account with this email already exists. Please sign in instead.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak. Please use at least 6 characters.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Network error. Please check your internet connection.';
    }
    return { user: null, error: errorMessage };
  }
};

// Sign out
export const logout = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// Get current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Listen to auth state changes
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Send sign-in link to email (passwordless login)
export const sendEmailLink = async (email) => {
  try {
    if (!auth) {
      return { error: 'Firebase is not initialized. Please refresh the page.' };
    }
    
    const actionCodeSettings = {
      url: `${window.location.origin}/auth/callback`,
      handleCodeInApp: true,
    };
    
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    return { error: null };
  } catch (error) {
    let errorMessage = error.message;
    if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Too many requests. Please try again later.';
    } else if (error.code === 'auth/network-request-failed') {
      errorMessage = 'Network error. Please check your internet connection.';
    }
    return { error: errorMessage };
  }
};

// Check if the current URL is a sign-in link
export const checkEmailLink = () => {
  if (!auth || typeof window === 'undefined') {
    return false;
  }
  return isSignInWithEmailLink(auth, window.location.href);
};

// Sign in with email link
export const signInWithLink = async (email, emailLink) => {
  try {
    if (!auth) {
      return { user: null, error: 'Firebase is not initialized. Please refresh the page.' };
    }
    
    const userCredential = await signInWithEmailLink(auth, email, emailLink);
    return { user: userCredential.user, error: null };
  } catch (error) {
    let errorMessage = error.message;
    if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.';
    } else if (error.code === 'auth/invalid-action-code') {
      errorMessage = 'The sign-in link is invalid or has expired.';
    } else if (error.code === 'auth/expired-action-code') {
      errorMessage = 'The sign-in link has expired. Please request a new one.';
    }
    return { user: null, error: errorMessage };
  }
};

