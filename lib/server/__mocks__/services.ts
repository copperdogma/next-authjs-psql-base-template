// lib/server/__mocks__/services.ts

// Create a mock function that we can control from our tests
export const mockUpdateUserName = jest.fn();

// Export a mock version of the profileService object
export const profileService = {
  updateUserName: mockUpdateUserName,
};

// Optionally, mock other services exported from the real services.ts if needed
// export const userService = { ... };
// export const sessionService = { ... };
