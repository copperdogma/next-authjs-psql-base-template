import { Page } from '@playwright/test';
import {
  getElementLocator,
  waitForElementToBeVisible,
  waitForElement,
  waitForElementToBeHidden,
} from '../../../tests/utils/selectors';

// Mock Playwright Page
const createMockPage = () => ({
  locator: jest.fn().mockImplementation(() => ({
    waitFor: jest.fn().mockResolvedValue(undefined),
    isVisible: jest.fn().mockResolvedValue(true),
    first: jest.fn().mockReturnThis(),
  })),
  getByRole: jest.fn().mockImplementation(() => ({
    waitFor: jest.fn().mockResolvedValue(undefined),
    isVisible: jest.fn().mockResolvedValue(true),
  })),
  getByText: jest.fn().mockImplementation(() => ({
    waitFor: jest.fn().mockResolvedValue(undefined),
    isVisible: jest.fn().mockResolvedValue(true),
  })),
  getByTestId: jest.fn().mockImplementation(() => ({
    waitFor: jest.fn().mockResolvedValue(undefined),
    isVisible: jest.fn().mockResolvedValue(true),
  })),
  content: jest
    .fn()
    .mockResolvedValue('<html><body>Some content that is long enough</body></html>'),
});

// Mock console.log to avoid cluttering test output
const originalConsoleLog = console.log;
beforeEach(() => {
  console.log = jest.fn();
});

afterEach(() => {
  console.log = originalConsoleLog;
  jest.clearAllMocks();
});

describe('Selector Utilities', () => {
  describe('getElementLocator', () => {
    test('should use role selector when available', async () => {
      const mockPage = createMockPage() as unknown as Page;
      const element = {
        role: 'button' as any,
        description: 'Test button',
      };

      await getElementLocator(mockPage, element);
      expect(mockPage.getByRole).toHaveBeenCalledWith('button');
    });

    test('should use text selector when role is not available', async () => {
      const mockPage = createMockPage() as unknown as Page;
      const element = {
        text: 'Click me',
        description: 'Test button',
      };

      await getElementLocator(mockPage, element);
      expect(mockPage.getByText).toHaveBeenCalledWith('Click me', { exact: undefined });
    });

    test('should use testId selector when role and text are not available', async () => {
      const mockPage = createMockPage() as unknown as Page;
      const element = {
        testId: 'test-button',
        description: 'Test button',
      };

      await getElementLocator(mockPage, element);
      expect(mockPage.getByTestId).toHaveBeenCalledWith('test-button');
    });

    test('should use CSS selector when other selectors are not available', async () => {
      const mockPage = createMockPage() as unknown as Page;
      const element = {
        css: '.test-button',
        description: 'Test button',
      };

      await getElementLocator(mockPage, element);
      expect(mockPage.locator).toHaveBeenCalledWith('.test-button');
    });

    test('should try all CSS selectors when an array is provided', async () => {
      const mockPage = createMockPage() as unknown as Page;
      const element = {
        css: ['.test-button', '.fallback-button'],
        description: 'Test button',
      };

      await getElementLocator(mockPage, element);
      expect(mockPage.locator).toHaveBeenCalledWith('.test-button');
    });

    test('should use tag selector when other selectors are not available', async () => {
      const mockPage = createMockPage() as unknown as Page;
      const element = {
        tag: 'button',
        description: 'Test button',
      };

      await getElementLocator(mockPage, element);
      expect(mockPage.locator).toHaveBeenCalledWith('button');
    });

    test('should fall back to body when no selectors are available', async () => {
      const mockPage = createMockPage() as unknown as Page;
      const element = {
        description: 'Test element with no selectors',
      };

      await getElementLocator(mockPage, element);
      expect(mockPage.locator).toHaveBeenCalledWith('body');
    });
  });

  describe('waitForElementToBeVisible', () => {
    test('should find element using UI_ELEMENTS mapping', async () => {
      const mockPage = createMockPage() as unknown as Page;

      await waitForElementToBeVisible(mockPage, 'AUTH.SIGN_IN_BUTTON');

      // Expect locator to be created based on AUTH.SIGN_IN_BUTTON and waited for
      expect(mockPage.getByRole).toHaveBeenCalled();
    });

    test('should throw error for unknown element key', async () => {
      const mockPage = createMockPage() as unknown as Page;

      await expect(waitForElementToBeVisible(mockPage, 'UNKNOWN.ELEMENT')).rejects.toThrow(
        'Element key not found'
      );
    });

    test('should try fallback strategies when primary selector fails', async () => {
      const mockPage = createMockPage() as unknown as Page;

      // Mock waitFor to fail on first call but succeed on fallback
      const mockLocator = {
        waitFor: jest.fn().mockRejectedValueOnce(new Error('Not found')),
        isVisible: jest.fn().mockResolvedValue(true),
        first: jest.fn().mockReturnThis(),
      };

      mockPage.getByRole = jest.fn().mockReturnValue(mockLocator);
      mockPage.locator = jest.fn().mockReturnValue({
        ...mockLocator,
        waitFor: jest.fn().mockResolvedValue(undefined),
        first: jest.fn().mockReturnThis(),
      });

      await waitForElementToBeVisible(mockPage, 'AUTH.SIGN_IN_BUTTON');

      // First attempt with primary selector
      expect(mockPage.getByRole).toHaveBeenCalled();
      expect(mockLocator.waitFor).toHaveBeenCalled();

      // Then fallback to direct selectors
      expect(mockPage.locator).toHaveBeenCalled();
    });
  });

  describe('waitForElement', () => {
    test('should wait for element with default state', async () => {
      const mockPage = createMockPage() as unknown as Page;
      const mockLocator = {
        waitFor: jest.fn().mockResolvedValue(undefined),
      };

      mockPage.locator = jest.fn().mockReturnValue(mockLocator);

      await waitForElement(mockPage, '.test-selector');

      expect(mockPage.locator).toHaveBeenCalledWith('.test-selector');
      expect(mockLocator.waitFor).toHaveBeenCalled();
    });

    test('should wait for element with custom state', async () => {
      const mockPage = createMockPage() as unknown as Page;
      const mockLocator = {
        waitFor: jest.fn().mockResolvedValue(undefined),
      };

      mockPage.locator = jest.fn().mockReturnValue(mockLocator);

      await waitForElement(mockPage, '.test-selector', { state: 'hidden' });

      expect(mockPage.locator).toHaveBeenCalledWith('.test-selector');
      expect(mockLocator.waitFor).toHaveBeenCalledWith({ state: 'hidden' });
    });
  });

  describe('waitForElementToBeHidden', () => {
    test('should wait for element to be hidden successfully', async () => {
      const mockPage = createMockPage() as unknown as Page;
      const mockLocator = {
        waitFor: jest.fn().mockResolvedValue(undefined),
      };

      mockPage.locator = jest.fn().mockReturnValue(mockLocator);

      await waitForElementToBeHidden(mockPage, '.test-selector');

      expect(mockPage.locator).toHaveBeenCalledWith('.test-selector');
      expect(mockLocator.waitFor).toHaveBeenCalledWith({ state: 'hidden' });
    });

    test('should throw error when element does not become hidden', async () => {
      const mockPage = createMockPage() as unknown as Page;
      const mockLocator = {
        waitFor: jest.fn().mockRejectedValue(new Error('Timeout')),
      };

      mockPage.locator = jest.fn().mockReturnValue(mockLocator);

      await expect(waitForElementToBeHidden(mockPage, '.test-selector')).rejects.toThrow(
        'Element .test-selector did not become hidden'
      );

      expect(mockPage.locator).toHaveBeenCalledWith('.test-selector');
      expect(mockLocator.waitFor).toHaveBeenCalledWith({ state: 'hidden' });
    });
  });
});
