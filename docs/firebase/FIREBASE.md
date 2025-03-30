# Firebase Configuration

This project uses Firebase for authentication. The configuration includes:

- Firebase Authentication for user management
- Emulators for local development and testing

## Getting Started

1. Install Firebase CLI:

```bash
npm install -g firebase-tools
```

2. Login to Firebase:

```bash
firebase login
```

3. Initialize your project (already done if you cloned this repo):

```bash
firebase init
```

## Firebase Emulators

This project includes configuration for Firebase emulators, allowing local development and testing without connecting to the production Firebase services.

### Available Scripts

- `npm run firebase:emulators` - Start Firebase emulators (Auth)

## Troubleshooting

1. **Emulator Port Conflicts**: If you see errors about ports being in use, you may have another process using those ports. Kill the process or change the port in `firebase.json`.

2. **Authentication Issues**: If you see authentication errors in the emulator, make sure you've set up a project ID in `firebase.json`.

3. **Emulator not found**: Ensure the Firebase CLI is installed globally and the emulators are running before tests.
