// UI element selectors in a centralized object - enhanced with more data-testid attributes
export const UI_ELEMENTS = {
  AUTH: {
    // Primary selectors
    BUTTON: '[data-testid="auth-button"]',
    PLACEHOLDER: '[data-testid="auth-button-placeholder"]',
    GOOGLE_SIGNIN: '[data-testid="google-signin-button"]',
    EMAIL_INPUT: '#email', // Standard ID for email
    PASSWORD_INPUT: '#password', // Standard ID for password
    CREDENTIALS_SUBMIT: 'button:has-text("Sign In with Email")', // Text-based selector
    SIGNUP_LINK: 'a:has-text("Sign Up")',
    LOGOUT_BUTTON: 'button:has-text("Sign Out")', // Assuming a standard sign out button text
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
};
