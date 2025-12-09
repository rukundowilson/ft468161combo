'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkEmailLink, signInWithLink } from '@/lib/auth';
import { syncUserToDatabase } from '@/lib/userService';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('verifying');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const handleEmailLink = async () => {
      try {
        // Check if this is a valid email link
        const isLink = checkEmailLink();
        
        if (!isLink) {
          setError('Invalid or expired sign-in link.');
          setStatus('error');
          return;
        }

        // Get email from localStorage (stored when link was sent)
        let userEmail = window.localStorage.getItem('emailForSignIn');
        
        if (!userEmail) {
          // Prompt user for email if not stored
          userEmail = prompt('Please enter your email address to complete sign-in:');
          if (!userEmail) {
            setError('Email is required to complete sign-in.');
            setStatus('error');
            return;
          }
        } else {
          // Remove from localStorage after retrieving
          window.localStorage.removeItem('emailForSignIn');
        }

        setEmail(userEmail);

        // Sign in with the email link
        const result = await signInWithLink(userEmail, window.location.href);
        
        if (result.error) {
          setError(result.error);
          setStatus('error');
        } else {
          // Sync user to database after successful Firebase auth
          const syncResult = await syncUserToDatabase(result.user);
          if (syncResult.error) {
            console.error('Failed to sync user to database:', syncResult.error);
            // Still proceed even if sync fails - user is authenticated in Firebase
          }
          setStatus('success');
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        }
      } catch (err) {
        setError('An unexpected error occurred. Please try again.');
        setStatus('error');
      }
    };

    handleEmailLink();
  }, [router]);

  if (status === 'verifying') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your sign-in link...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="p-6 rounded-lg bg-red-50 border border-red-200">
            <h2 className="text-xl font-bold text-red-900 mb-2">Sign-in Failed</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Go Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Success!</h2>
        <p className="text-gray-600 mb-4">You've been signed in successfully.</p>
        <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}

