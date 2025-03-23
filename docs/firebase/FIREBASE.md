# Firebase Configuration

This project uses Firebase for authentication and Firestore. The configuration includes:

- Firebase Authentication for user management
- Firestore for NoSQL data storage
- Security rules for access control
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

- `npm run firebase:emulators` - Start Firebase emulators (Firestore, Auth)
- `npm run firebase:emulators:export` - Export emulator data to `./firebase-emulator-data`
- `npm run firebase:emulators:import` - Start emulators and import data from `./firebase-emulator-data`
- `npm run firebase:deploy:rules` - Deploy Firestore security rules to your project

### Testing Security Rules

The project includes tests for Firestore security rules in `tests/firebase/`:

- `npm run test:rules` - Run security rules tests
- `npm run test:rules:with-emulator` - Run security rules tests with emulator
- `npm run test:with-emulators` - Run all tests with Firebase emulators

For the tests to work properly with the emulator, you need to:

1. Start the emulators first (in another terminal): `npm run firebase:emulators`
2. Run the tests: `npm run test:rules:with-emulator`

Or use the combined command: `npm run test:with-emulators`

## Security Rules

Firestore security rules are defined in `firestore.rules`. The rules implement the following permissions:

### Users Collection

- Users can create their own profile
- Users can read and update their own profile
- Admin users can read any user profile
- Only admin users can delete profiles

### Public Collection

- Anyone can read public documents
- Only admin users can create, update, or delete public documents

### Tasks Collection

- Users can read and modify their own tasks
- Admin users can read and modify any task
- Users can only create tasks for themselves

## Indexes

Firestore indexes are configured in `firestore.indexes.json`. The configuration includes:

- Composite index for the `users` collection, sorted by `email` (ascending) and `createdAt` (descending)
- Composite index for the `public` collection, sorted by `type` (ascending) and `createdAt` (descending)

## Testing Approach

The security rules tests use `@firebase/rules-unit-testing` to test rule behavior.

Tests are designed to:

1. Check if rules correctly allow or deny operations
2. Test various user scenarios (unauthenticated, regular user, admin)
3. Work with or without the emulator running

When the emulator is running, tests execute against the live emulator. When the emulator is not running, the tests skip gracefully.

## Troubleshooting

1. **Emulator Port Conflicts**: If you see errors about ports being in use, you may have another process using those ports. Kill the process or change the port in `firebase.json`.

2. **Authentication Issues**: If you see authentication errors in the emulator, make sure you've set up a project ID in `firebase.json`.

3. **Open Handles in Tests**: If tests report open handles, add the `--detectOpenHandles` flag to the Jest command to help identify them.

4. **Emulator not found**: Ensure the Firebase CLI is installed globally and the emulators are running before tests.
