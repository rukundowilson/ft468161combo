'use client';

import { useState } from 'react';
import { signIn, signUp, sendEmailLink } from '@/lib/auth';
import { syncUserToDatabase } from '@/lib/userService';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [useEmailLink, setUseEmailLink] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    
    try {
      if (useEmailLink) {
        // Send email link for passwordless login
        // Store email in localStorage for callback page
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('emailForSignIn', email);
        }
        const result = await sendEmailLink(email);
        if (result.error) {
          setError(result.error);
        } else {
          setSuccess(`Check your email! We've sent you a sign-in link at ${email}`);
        }
      } else {
        // Traditional email/password login
        let result;
        if (isSignUp) {
          result = await signUp(email, password);
        } else {
          result = await signIn(email, password);
        }
        
        if (result.error) {
          setError(result.error);
        } else {
          // Sync user to database after successful Firebase auth
          const syncResult = await syncUserToDatabase(result.user);
          if (syncResult.error) {
            console.error('Failed to sync user to database:', syncResult.error);
            // Still redirect even if sync fails - user is authenticated in Firebase
          }
          // Success - redirect to dashboard
          router.push('/dashboard');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200">
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}
      
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          placeholder="you@example.com"
        />
      </div>
      
      {!useEmailLink && (
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder="••••••••"
          />
          {isSignUp && (
            <p className="text-xs text-gray-500">Password must be at least 6 characters</p>
          )}
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="emailLink"
          checked={useEmailLink}
          onChange={(e) => {
            setUseEmailLink(e.target.checked);
            setError('');
            setSuccess('');
          }}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="emailLink" className="text-sm text-gray-700">
          Sign in with email link (passwordless)
        </label>
      </div>
      
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        {isLoading 
          ? (useEmailLink 
              ? 'Sending link...' 
              : (isSignUp ? 'Creating account...' : 'Signing in...')
            )
          : (useEmailLink 
              ? 'Send sign-in link' 
              : (isSignUp ? 'Sign Up' : 'Sign In')
            )
        }
      </button>
      
      {!useEmailLink && (
        <p className="text-center text-sm text-gray-500">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setSuccess('');
            }}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      )}
    </form>
  );
}

