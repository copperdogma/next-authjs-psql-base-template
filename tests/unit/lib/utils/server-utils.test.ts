import { getClientIp } from '@/lib/utils/server-utils';
import { headers } from 'next/headers';
import { logger } from '@/lib/logger';

// Mock next/headers
const mockHeadersGet = jest.fn();
jest.mock('next/headers', () => ({
  __esModule: true, // This is important for modules with default exports or specific structures
  headers: jest.fn(() => ({ get: mockHeadersGet })),
}));

// Mock logger
jest.mock('@/lib/logger', () => {
  const mockChildLogger = {
    warn: jest.fn(),
    error: jest.fn(),
    // Add other methods if child logger uses them
  };
  return {
    logger: {
      warn: jest.fn(),
      error: jest.fn(), // Add error here if base logger uses it directly
      child: jest.fn(() => mockChildLogger), // Mock the child method
    },
    // If createLogger or loggers are used directly by the module under test, mock them too.
    // createLogger: jest.fn(() => mockChildLogger),
    // loggers: { /* mock individual loggers if needed */ },
  };
});

describe('getClientIp', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockHeadersGet.mockReset();
    // Resetting the base logger's methods
    (logger.warn as jest.Mock).mockReset();
    (logger.error as jest.Mock).mockReset(); // Reset error if you added it to the base mock

    // Resetting the child logger's methods
    // Access the child mock through the mocked logger.child call
    const mockChild = logger.child({ module: 'test' }); // Call child to get the mock instance
    (mockChild.warn as jest.Mock).mockReset();
    (mockChild.error as jest.Mock).mockReset();

    // Ensure headers itself is reset if it's a jest.fn()
    (headers as jest.Mock).mockClear();
    // Re-establish the mock implementation for headers() in case a test overrides it
    (headers as jest.Mock).mockImplementation(() => ({ get: mockHeadersGet }));
  });

  it('should return IP from x-forwarded-for (single IP)', async () => {
    mockHeadersGet.mockImplementation((headerName: string) => {
      if (headerName === 'x-forwarded-for') return '123.123.123.123';
      return null;
    });
    expect(await getClientIp()).toBe('123.123.123.123');
  });

  it('should return the first IP from x-forwarded-for (multiple IPs)', async () => {
    mockHeadersGet.mockImplementation((headerName: string) => {
      if (headerName === 'x-forwarded-for') return '123.123.123.123, 4.5.6.7, 8.9.10.11';
      return null;
    });
    expect(await getClientIp()).toBe('123.123.123.123');
  });

  it('should return IP from x-real-ip if x-forwarded-for is not present', async () => {
    mockHeadersGet.mockImplementation((headerName: string) => {
      if (headerName === 'x-forwarded-for') return null;
      if (headerName === 'x-real-ip') return '192.168.1.1';
      return null;
    });
    expect(await getClientIp()).toBe('192.168.1.1');
  });

  it('should return fallback IP if no IP headers are present', async () => {
    mockHeadersGet.mockReturnValue(null);
    expect(await getClientIp()).toBe('0.0.0.0');
  });

  it('should return fallback IP and log warning if headers() throws an error', async () => {
    (headers as jest.Mock).mockImplementation(() => {
      throw new Error('Test error getting headers');
    });
    // The getClientIp function uses the child logger instance `log`
    // So we expect `log.error` to be called, not `logger.warn` or `logger.error`
    const childLoggerInstance = logger.child({ module: 'server-utils' }); // Get the child logger instance

    expect(await getClientIp()).toBe('0.0.0.0');
    // Check that the child logger's error method was called
    expect(childLoggerInstance.error).toHaveBeenCalledTimes(1);
    expect(childLoggerInstance.error).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({ message: 'Test error getting headers', name: 'Error' }),
        details: 'Error retrieving client IP from headers.',
      }),
      'getClientIp failed, using fallback IP.'
    );
  });

  it('should handle x-forwarded-for with only spaces after comma', async () => {
    mockHeadersGet.mockImplementation((headerName: string) => {
      if (headerName === 'x-forwarded-for') return '123.123.123.123,   ';
      return null;
    });
    expect(await getClientIp()).toBe('123.123.123.123');
  });

  it('should return fallback IP if x-forwarded-for is an empty string', async () => {
    mockHeadersGet.mockImplementation((headerName: string) => {
      if (headerName === 'x-forwarded-for') return '';
      return null;
    });
    expect(await getClientIp()).toBe('0.0.0.0');
  });

  it('should return fallback IP if x-real-ip is an empty string', async () => {
    mockHeadersGet.mockImplementation((headerName: string) => {
      if (headerName === 'x-real-ip') return '';
      return null;
    });
    expect(await getClientIp()).toBe('0.0.0.0');
  });
});
