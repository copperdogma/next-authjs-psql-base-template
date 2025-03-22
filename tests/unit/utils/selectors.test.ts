import { Page, Locator } from '@playwright/test';
import { UI_ELEMENTS, getElementLocator, waitForElementToBeVisible, ElementSelector } from '../../utils/selectors';

// Mock Page object with basic locator methods
const createMockPage = () => {
  const mockPage = {
    getByRole: jest.fn(() => ({ waitFor: jest.fn(), isVisible: jest.fn(() => Promise.resolve(true)) })),
    getByText: jest.fn(() => ({ waitFor: jest.fn(), isVisible: jest.fn(() => Promise.resolve(true)) })),
    getByTestId: jest.fn(() => ({ waitFor: jest.fn(), isVisible: jest.fn(() => Promise.resolve(true)) })),
    locator: jest.fn(() => ({ waitFor: jest.fn(), isVisible: jest.fn(() => Promise.resolve(true)), first: jest.fn(() => ({ isVisible: jest.fn(() => Promise.resolve(true)) })) })),
    url: jest.fn(() => 'https://example.com'),
  } as unknown as Page;
  
  return mockPage;
};

describe('Selectors Utility', () => {
  let mockPage: Page;
  
  beforeEach(() => {
    mockPage = createMockPage();
    jest.clearAllMocks();
  });
  
  describe('UI_ELEMENTS', () => {
    test('should have all required element groups', () => {
      expect(UI_ELEMENTS).toBeDefined();
      expect(UI_ELEMENTS.LAYOUT).toBeDefined();
      expect(UI_ELEMENTS.NAVIGATION).toBeDefined();
      expect(UI_ELEMENTS.AUTH).toBeDefined();
    });
    
    test('should have properly structured element descriptors', () => {
      // Test LAYOUT.NAVBAR structure
      const navbar = UI_ELEMENTS.LAYOUT.NAVBAR;
      expect(navbar.testId).toBeDefined();
      expect(navbar.role).toBeDefined();
      expect(navbar.description).toBeDefined();
      
      // Test AUTH.SIGN_IN_BUTTON structure
      const signInButton = UI_ELEMENTS.AUTH.SIGN_IN_BUTTON;
      expect(signInButton.testId).toBeDefined();
      expect(signInButton.text).toBeDefined();
      expect(signInButton.description).toBeDefined();
    });
  });
  
  describe('getElementLocator', () => {
    test('should prioritize role selectors', () => {
      const element: ElementSelector = {
        role: 'button',
        text: 'Click me',
        testId: 'click-button',
        css: '.button',
        description: 'Test button'
      };
      
      getElementLocator(mockPage, element);
      expect(mockPage.getByRole).toHaveBeenCalledWith('button');
      expect(mockPage.getByText).not.toHaveBeenCalled();
      expect(mockPage.getByTestId).not.toHaveBeenCalled();
      expect(mockPage.locator).not.toHaveBeenCalled();
    });
    
    test('should use role with options when provided as object', () => {
      const element: ElementSelector = {
        role: { name: 'button', options: { name: 'Submit' } },
        description: 'Submit button'
      };
      
      getElementLocator(mockPage, element);
      expect(mockPage.getByRole).toHaveBeenCalledWith('button', { name: 'Submit' });
    });
    
    test('should fall back to text selector when role is not available', () => {
      const element: ElementSelector = {
        text: 'Click me',
        testId: 'click-button',
        css: '.button',
        description: 'Test button'
      };
      
      getElementLocator(mockPage, element);
      expect(mockPage.getByRole).not.toHaveBeenCalled();
      expect(mockPage.getByText).toHaveBeenCalledWith('Click me', { exact: undefined });
      expect(mockPage.getByTestId).not.toHaveBeenCalled();
      expect(mockPage.locator).not.toHaveBeenCalled();
    });
    
    test('should fall back to testId selector when role and text are not available', () => {
      const element: ElementSelector = {
        testId: 'click-button',
        css: '.button',
        description: 'Test button'
      };
      
      getElementLocator(mockPage, element);
      expect(mockPage.getByRole).not.toHaveBeenCalled();
      expect(mockPage.getByText).not.toHaveBeenCalled();
      expect(mockPage.getByTestId).toHaveBeenCalledWith('click-button');
      expect(mockPage.locator).not.toHaveBeenCalled();
    });
    
    test('should fall back to css selector when role, text, and testId are not available', () => {
      const element: ElementSelector = {
        css: '.button',
        description: 'Test button'
      };
      
      getElementLocator(mockPage, element);
      expect(mockPage.getByRole).not.toHaveBeenCalled();
      expect(mockPage.getByText).not.toHaveBeenCalled();
      expect(mockPage.getByTestId).not.toHaveBeenCalled();
      expect(mockPage.locator).toHaveBeenCalledWith('.button');
    });
    
    test('should handle css selector arrays', () => {
      const element: ElementSelector = {
        css: ['.button', 'button.primary', 'input[type="submit"]'],
        description: 'Test button'
      };
      
      getElementLocator(mockPage, element);
      expect(mockPage.locator).toHaveBeenCalledWith('.button');
    });
    
    test('should fall back to tag selector when other selectors are not available', () => {
      const element: ElementSelector = {
        tag: 'button',
        description: 'Test button'
      };
      
      getElementLocator(mockPage, element);
      expect(mockPage.getByRole).not.toHaveBeenCalled();
      expect(mockPage.getByText).not.toHaveBeenCalled();
      expect(mockPage.getByTestId).not.toHaveBeenCalled();
      expect(mockPage.locator).toHaveBeenCalledWith('button');
    });
    
    test('should fall back to body selector when no selectors are available', () => {
      const element: ElementSelector = {
        description: 'Test element'
      };
      
      getElementLocator(mockPage, element);
      expect(mockPage.locator).toHaveBeenCalledWith('body');
    });
  });
  
  describe('waitForElementToBeVisible', () => {
    test('should find element using the correct selectors', async () => {
      // Mock the waitFor and console.log methods
      const mockLocator = {
        waitFor: jest.fn(() => Promise.resolve()),
        isVisible: jest.fn(() => Promise.resolve(true))
      };
      (mockPage.getByRole as jest.Mock).mockReturnValue(mockLocator);
      const originalConsoleLog = console.log;
      console.log = jest.fn();
      
      await waitForElementToBeVisible(mockPage, 'LAYOUT.NAVBAR');
      
      expect(console.log).toHaveBeenCalledWith('Waiting for LAYOUT.NAVBAR to be visible...');
      expect(mockPage.getByRole).toHaveBeenCalled();
      expect(mockLocator.waitFor).toHaveBeenCalledWith({ state: 'visible', timeout: 15000 });
      expect(console.log).toHaveBeenCalledWith('Found element LAYOUT.NAVBAR (Main navigation bar)');
      
      // Restore console.log to avoid affecting other tests
      console.log = originalConsoleLog;
    });
    
    test('should throw error for unknown element key', async () => {
      await expect(async () => {
        await waitForElementToBeVisible(mockPage, 'UNKNOWN.ELEMENT');
      }).rejects.toThrow('Element key not found: UNKNOWN.ELEMENT (part UNKNOWN missing)');
    });
    
    test('should attempt fallback strategies when primary selector fails', async () => {
      // Mock a failed primary selector and successful fallback
      const mockFailedLocator = {
        waitFor: jest.fn(() => Promise.reject(new Error('Element not found'))),
        isVisible: jest.fn(() => Promise.resolve(false))
      };
      const mockSuccessfulFallback = {
        isVisible: jest.fn(() => Promise.resolve(true)),
        first: jest.fn(() => ({ isVisible: jest.fn(() => Promise.resolve(true)) }))
      };
      
      (mockPage.getByRole as jest.Mock).mockReturnValue(mockFailedLocator);
      (mockPage.locator as jest.Mock).mockImplementation((selector) => {
        if (selector === '[role="navigation"]') {
          return {
            ...mockSuccessfulFallback,
            first: jest.fn(() => mockSuccessfulFallback)
          };
        }
        return {
          isVisible: jest.fn(() => Promise.resolve(false)),
          first: jest.fn(() => ({ isVisible: jest.fn(() => Promise.resolve(false)) }))
        };
      });
      
      const originalConsoleLog = console.log;
      console.log = jest.fn();
      
      const result = await waitForElementToBeVisible(mockPage, 'LAYOUT.NAVBAR');
      
      expect(console.log).toHaveBeenCalledWith('Failed to find LAYOUT.NAVBAR with primary selectors, trying fallbacks...');
      expect(console.log).toHaveBeenCalledWith('Found element LAYOUT.NAVBAR with fallback selector: [role="navigation"]');
      expect(result).toBeDefined();
      
      // Restore console.log
      console.log = originalConsoleLog;
    });
  });
}); 