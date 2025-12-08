# Firebase Authentication Setup

This guide will help you set up Firebase Authentication for your finance tracker app.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard to create your project

## Step 2: Enable Authentication

1. In your Firebase project, go to **Authentication** in the left sidebar
2. Click **Get Started**
3. Click on **Sign-in method** tab
4. Enable **Email/Password** authentication:
   - Click on "Email/Password"
   - Toggle "Enable" to ON
   - Click "Save"

## Step 3: Get Your Firebase Configuration

1. In Firebase Console, click the gear icon ⚙️ next to "Project Overview"
2. Select **Project settings**
3. Scroll down to **Your apps** section
4. If you don't have a web app, click **Add app** and select the web icon `</>`
5. Register your app (you can use any nickname)
6. Copy the Firebase configuration object

## Step 4: Add Environment Variables

1. Create a `.env.local` file in the root of your project (same level as `package.json`)
2. Add the following variables with your Firebase config values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Replace the placeholder values with your actual Firebase configuration values.

## Step 5: Restart Your Development Server

After adding the environment variables, restart your Next.js development server:

```bash
npm run dev
```

## Testing Authentication

1. Go to your app at `http://localhost:3000`
2. Click "Sign up" to create a new account
3. Enter an email and password (minimum 6 characters)
4. After signing up, you'll be redirected to the dashboard
5. You can sign out and sign in again to test the login flow

## Security Notes

- Never commit your `.env.local` file to version control
- The `.env.local` file should already be in `.gitignore`
- Firebase API keys are safe to expose in client-side code (they're public by design)
- Firebase security rules protect your backend resources

## Troubleshooting

- **"Firebase: Error (auth/invalid-api-key)"**: Check that your environment variables are correctly set and the server has been restarted
- **"Firebase: Error (auth/email-already-in-use)"**: The email is already registered, try signing in instead
- **"Firebase: Error (auth/weak-password)"**: Password must be at least 6 characters
- **"Firebase: Error (auth/user-not-found)"**: No account exists with that email, try signing up first


