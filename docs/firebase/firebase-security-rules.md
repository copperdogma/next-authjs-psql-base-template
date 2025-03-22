# Firebase Security Rules Documentation

This document explains the Firestore security rules implemented in this project and how they protect the data.

## Table of Contents
- [Introduction](#introduction)
- [Security Rules Structure](#security-rules-structure)
- [Helper Functions](#helper-functions)
- [Collections and Rules](#collections-and-rules)
  - [User Collection](#user-collection)
  - [Public Collection](#public-collection)
  - [Tasks Collection](#tasks-collection)
- [Default Deny Rule](#default-deny-rule)
- [Testing Security Rules](#testing-security-rules)
- [Deploying Rules](#deploying-rules)

## Introduction

Firebase Security Rules are the primary way to secure your data in Firestore. They determine who has access to what data and what operations they can perform. Our security rules follow the principle of "deny by default" - meaning all access is denied unless explicitly allowed.

## Security Rules Structure

The security rules are defined in the `firestore.rules` file in the project root. The rules are written in a domain-specific language provided by Firebase that resembles JavaScript.

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Rules go here
  }
}
```

## Helper Functions

We define several helper functions to make our rules more readable and maintainable:

```
// Check if the user is authenticated
function isSignedIn() {
  return request.auth != null;
}

// Check if the authenticated user is the owner of a resource
function isOwner(userId) {
  return isSignedIn() && request.auth.uid == userId;
}

// Check if the user has admin privileges
function isAdmin() {
  return isSignedIn() && request.auth.token.admin == true;
}
```

These functions encapsulate common authorization checks used throughout the rules.

## Collections and Rules

### User Collection

The `users` collection contains user profile data. The rules for this collection are:

```
match /users/{userId} {
  allow read: if isSignedIn();
  allow create: if isOwner(userId);
  allow update: if isOwner(userId) || isAdmin();
  allow delete: if isAdmin();
}
```

These rules ensure that:
- Only authenticated users can read user profiles
- Users can only create their own profiles
- Users can update their own profiles, and admins can update any profile
- Only admins can delete user profiles

### Public Collection

The `public` collection contains data that's readable by anyone but writable only by administrators:

```
match /public/{document=**} {
  allow read: if true;
  allow write: if isAdmin();
}
```

These rules ensure that:
- Anyone (including unauthenticated users) can read public documents
- Only admin users can create, update, or delete public documents

### Tasks Collection

The `tasks` collection contains user tasks, which should only be accessible by the owner or admins:

```
match /tasks/{taskId} {
  allow read: if isOwner(resource.data.userId) || isAdmin();
  allow create: if isSignedIn() && request.resource.data.userId == request.auth.uid;
  allow update: if isOwner(resource.data.userId) || isAdmin();
  allow delete: if isOwner(resource.data.userId) || isAdmin();
}
```

These rules ensure that:
- Users can only read their own tasks (based on the `userId` field in the document)
- Admin users can read any task
- Users can only create tasks where the `userId` matches their own UID
- Users can only update or delete their own tasks
- Admin users can update or delete any task

## Default Deny Rule

We have a default rule that denies all access unless explicitly allowed:

```
match /{document=**} {
  allow read, write: if false;
}
```

This ensures that any collection without specific rules is completely inaccessible.

## Testing Security Rules

We test our security rules using Firebase's rules testing library (@firebase/rules-unit-testing). The tests verify that:

1. Users can only access resources they're authorized to access
2. Operations are properly secured
3. The default deny rule works correctly

Tests are located in the `tests/firebase` directory:
- `security-rules.test.ts`: Tests for user and public collection rules
- `task-rules.test.ts`: Tests for task collection rules

To run the tests:

```bash
# Run tests with Firebase emulator
npm run test:all-rules:with-emulator

# Run tests for specific collections
npm run test:rules:with-emulator         # User and public collections
npm run test:task-rules:with-emulator    # Task collection
```

## Deploying Rules

To deploy the security rules to Firebase:

1. Ensure you have the Firebase CLI installed and are logged in
2. Run the deployment command:

```bash
npm run firebase:deploy:rules
```

This will deploy the rules defined in `firestore.rules` to your Firebase project.

## Best Practices

1. **Always deny by default**: Start with denying all access and explicitly grant permissions.
2. **Use helper functions**: Extract common logic into functions to improve readability.
3. **Test your rules**: Always write comprehensive tests for your security rules.
4. **Check document content**: Validate the structure and content of documents to prevent malicious data.
5. **Keep rules minimal**: Only include the minimum necessary permissions.
6. **Review rules regularly**: As your application evolves, review and update your security rules.

## Common Pitfalls

1. **Forgetting to check authentication**: Always verify the user is authenticated before checking other conditions.
2. **Over-permissive rules**: Rules that are too permissive can expose sensitive data.
3. **Complex rule logic**: Overly complex rules are difficult to understand and maintain.
4. **Not testing edge cases**: Missing edge cases in your tests can lead to security vulnerabilities.
5. **Ignoring the principle of least privilege**: Always give the minimum necessary permissions.

## Additional Resources

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started)
- [Common Security Rules Patterns](https://firebase.google.com/docs/firestore/security/rules-structure)
- [Testing Security Rules](https://firebase.google.com/docs/firestore/security/test-rules) 