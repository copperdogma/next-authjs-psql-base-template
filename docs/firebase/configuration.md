# Firebase Configuration Best Practices

## Environment Variables

All Firebase configuration is stored using environment variables to ensure security and flexibility across different environments. The configuration is validated using Zod to ensure all required variables are present.

### Client-Side Configuration

The following environment variables are required for the Firebase client SDK:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Server-Side Configuration (Admin SDK)

The following environment variables are required for the Firebase Admin SDK:

```
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key
```

## API Key Restriction

To enhance security, follow these steps to restrict your Firebase API key:

1. Log in to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to Project Settings > API Settings
4. Under API Keys, find your Web API Key
5. Click on "Manage API Key Restrictions" (this will take you to Google Cloud Platform)
6. Set up restrictions:
   - **API restrictions**: Limit the key to only the necessary Firebase services
   - **Application restrictions**: Restrict to HTTP referrers (websites)
   - Add your domains (including localhost for development)

Example HTTP referrer pattern for local development:

```
localhost:*
```

Example HTTP referrer pattern for production:

```
https://your-domain.com/*
```

## Environment Separation

For optimal security and development workflow, maintain separate Firebase projects for each environment:

1. **Development Environment**

   - Project name: `your-project-dev`
   - Less restrictive settings for development
   - Emulators for local testing

2. **Testing Environment**

   - Project name: `your-project-test`
   - Used for integration tests and staging
   - Isolated from both development and production data

3. **Production Environment**
   - Project name: `your-project-prod`
   - Strictest security rules
   - Regular security audits

### Environment Configuration

Create separate `.env` files for each environment:

- `.env.development` - Development configuration
- `.env.test` - Testing configuration
- `.env.production` - Production configuration

## Implementation Details

### Client SDK

The client SDK is initialized in `lib/firebase.ts` and only runs on the client side. Server components receive empty placeholders to prevent errors.

### Admin SDK

The Admin SDK is initialized in `lib/firebase-admin.ts` and only runs on the server side. It's used for secure operations like token validation and user management.

## Continuous Integration

For CI/CD pipelines, use GitHub secrets or other secure methods to store environment variables. Never commit actual Firebase credentials to the repository.
