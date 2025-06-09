// UI element selectors in a centralized object - enhanced with more data-testid attributes
export const UI_ELEMENTS = {
  AUTH: {
    // Primary selectors
    BUTTON: '[data-testid="auth-button"]',
    PLACEHOLDER: '[data-testid="auth-button-placeholder"]',
    GOOGLE_SIGNIN: '[data-testid="google-signin-button"]',
    EMAIL_INPUT: '#email, input[name="email"]', // Both ID and name selectors for better resilience
    PASSWORD_INPUT: '#password, input[name="password"]', // Both ID and name selectors
    CREDENTIALS_SUBMIT: '[data-testid="credentials-submit-button"], button[type="submit"]', // Updated selector
    SIGNUP_LINK: 'a:has-text("Sign Up")',
    LOGOUT_BUTTON: '[data-testid="logout-button"]', // General logout button
  },
  USER_PROFILE: {
    // Primary data-testid selector (most reliable)
    TESTID: '[data-testid="user-profile"]',
    // Fallbacks with various selection strategies
    CONTAINER: '[data-testid="profile-container"]',
    NAV_PROFILE: 'header [data-testid="user-profile"]',
    IMAGE: '[data-testid="profile-image"]',
    NAME: '[data-testid="profile-name"]',
  },
  NAVIGATION: {
    NAV: '[data-testid="navbar"]',
    DESKTOP_MENU: '[data-testid="desktop-menu"]',
    MOBILE_MENU: '[data-testid="mobile-menu"]',
    MOBILE_MENU_BUTTON: 'button[aria-label="Open menu"], [data-testid="mobile-menu-button"]',
    HEADER: 'header',
  },
  CONTENT: {
    DASHBOARD: '[data-testid="dashboard-content"]',
    DASHBOARD_HEADING: 'h1:has-text("Dashboard"), [data-testid="dashboard-heading"]',
    PAGE_HEADING: 'h1',
  },
  ERROR_MESSAGES: {
    INVALID_CREDENTIALS: 'p:has-text("Invalid email or password")', // Selector for the specific error message
  },
  MOBILE: {
    MENU_BUTTON: 'button[aria-label="Open menu"], [data-testid="mobile-menu-button"]',
    PROFILE_LINK: 'a:has-text("Profile"), [href*="/profile"]',
    DASHBOARD_LINK: 'a:has-text("Dashboard"), [href*="/dashboard"]',
    LOGOUT_BUTTON:
      '[data-testid="logout-button"], button:has-text("Logout"), button:has-text("Sign Out")',
  },
};
