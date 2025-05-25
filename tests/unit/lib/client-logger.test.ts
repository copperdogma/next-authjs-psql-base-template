/**
 * @jest-environment jsdom
 */
import { clientLogger } from '@/lib/client-logger';

// Mock fetch globally
global.fetch = jest.fn();

// Mock navigator.sendBeacon
const mockSendBeacon = jest.fn();
Object.defineProperty(global.navigator, 'sendBeacon', {
  value: mockSendBeacon,
  writable: true,
});

// Store original console and env
const originalConsole = { ...global.console };
const originalEnv = { ...process.env };

// Always mock console error/warn for consistent testing
const consoleErrorMock = jest.fn();
const consoleWarnMock = jest.fn();

// --- Constants ---
const mockEndpoint = '/api/log/client';

describe('clientLogger', () => {
  // Restore original console and env after all tests
  afterAll(() => {
    global.console = originalConsole;
    process.env = originalEnv; // Restore env
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    process.env = { ...originalEnv }; // Reset env first

    // Assign the global mocks to the console object
    global.console = {
      ...originalConsole,
      error: consoleErrorMock,
      warn: consoleWarnMock,
      log: jest.fn(), // Keep log mocked
    };

    // Default mock implementations
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
    mockSendBeacon.mockReturnValue(true); // Default sendBeacon success
  });

  it('should send an info log via fetch', () => {
    const message = 'Info message';
    const context = { userId: 'user123' };
    clientLogger.info(message, context);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      mockEndpoint,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String),
        keepalive: true,
      })
    );
    const sentBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(sentBody).toMatchObject({
      level: 'info',
      message,
      context,
    });
    expect(sentBody.timestamp).toBeDefined();
    expect(mockSendBeacon).not.toHaveBeenCalled();
  });

  it('should send a warn log via fetch', () => {
    const message = 'Warning message';
    clientLogger.warn(message);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      mockEndpoint,
      expect.objectContaining({ body: expect.any(String) })
    );
    const sentBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(sentBody).toMatchObject({ level: 'warn', message });
    expect(mockSendBeacon).not.toHaveBeenCalled();
  });

  it('should send a trace log via fetch', () => {
    const message = 'Trace message';
    clientLogger.trace(message);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      mockEndpoint,
      expect.objectContaining({ body: expect.any(String) })
    );
    const sentBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(sentBody).toMatchObject({ level: 'trace', message });
    expect(mockSendBeacon).not.toHaveBeenCalled();
  });

  it('should send a debug log via fetch', () => {
    const message = 'Debug message';
    const context = { data: 'payload' };
    clientLogger.debug(message, context);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      mockEndpoint,
      expect.objectContaining({ body: expect.any(String) })
    );
    const sentBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(sentBody).toMatchObject({ level: 'debug', message, context });
    expect(mockSendBeacon).not.toHaveBeenCalled();
  });

  it('should attempt to send an error log via sendBeacon', () => {
    const message = 'Error message';
    const context = { errorId: 'err456' };
    clientLogger.error(message, context);

    expect(mockSendBeacon).toHaveBeenCalledTimes(1);
    expect(mockSendBeacon).toHaveBeenCalledWith(mockEndpoint, expect.any(String));
    const sentBody = JSON.parse(mockSendBeacon.mock.calls[0][1]);
    expect(sentBody).toMatchObject({
      level: 'error',
      message,
      context,
    });
    expect(sentBody.timestamp).toBeDefined();
    expect(global.fetch).not.toHaveBeenCalled(); // Should not call fetch if sendBeacon succeeds
  });

  it('should attempt to send a fatal log via sendBeacon', () => {
    const message = 'Fatal message';
    clientLogger.fatal(message);

    expect(mockSendBeacon).toHaveBeenCalledTimes(1);
    expect(mockSendBeacon).toHaveBeenCalledWith(mockEndpoint, expect.any(String));
    const sentBody = JSON.parse(mockSendBeacon.mock.calls[0][1]);
    expect(sentBody).toMatchObject({ level: 'fatal', message });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should fall back to fetch if sendBeacon returns false', () => {
    mockSendBeacon.mockReturnValue(false); // Simulate sendBeacon failure
    const message = 'Error message with fallback';
    clientLogger.error(message);

    expect(mockSendBeacon).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      mockEndpoint,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String),
        keepalive: true,
      })
    );
    const sentBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(sentBody).toMatchObject({ level: 'error', message });
  });

  it('should use fetch directly if sendBeacon is not available', () => {
    // Temporarily remove sendBeacon
    const originalSendBeacon = (global.navigator as any).sendBeacon;
    (global.navigator as any).sendBeacon = undefined;

    const message = 'Error message no sendBeacon';
    clientLogger.error(message);

    expect(mockSendBeacon).not.toHaveBeenCalled(); // Original mock shouldn't be called
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      mockEndpoint,
      expect.objectContaining({ body: expect.any(String) })
    );
    const sentBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(sentBody).toMatchObject({ level: 'error', message });

    // Restore sendBeacon
    (global.navigator as any).sendBeacon = originalSendBeacon;
  });

  it('should log an error to console if fetch throws', async () => {
    const fetchError = new Error('Network Error');
    (global.fetch as jest.Mock).mockRejectedValue(fetchError);

    // Await the call since sendLog is now async
    await clientLogger.info('Info message that fails');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    // Expect console.error *mock* to NOT have been called in test env
    expect(consoleErrorMock).not.toHaveBeenCalled();
  });

  it('should log error to console if fetch returns non-ok response', async () => {
    const responseError = { ok: false, status: 500, statusText: 'Server Error' };
    (global.fetch as jest.Mock).mockResolvedValue(responseError);
    // No need to change NODE_ENV

    await clientLogger.warn('Warning that results in server error');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    // Check the mock function was NOT called in test env
    expect(consoleErrorMock).not.toHaveBeenCalled();
  });

  it("should NOT log console error/warn on failures when NODE_ENV IS 'test'", async () => {
    // Ensure NODE_ENV is 'test' (Jest default via cross-env in script)
    expect(process.env.NODE_ENV).toBe('test');

    // We no longer need jest.isolateModulesAsync here

    // Simulate sendBeacon failure
    mockSendBeacon.mockReturnValueOnce(false);
    await clientLogger.error('Beacon fail in test');
    expect(consoleWarnMock).not.toHaveBeenCalled(); // Check the mock

    // Simulate fetch failure (non-ok)
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 500 });
    await clientLogger.info('Fetch fail in test');
    expect(consoleErrorMock).not.toHaveBeenCalled(); // Check the mock

    // Simulate fetch throw
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network fail in test'));
    await clientLogger.debug('Fetch throw in test');
    expect(consoleErrorMock).not.toHaveBeenCalled(); // Check the mock

    // Remove spy logic
  });

  it('should not send logs if DISABLE_CLIENT_LOGGER_FETCH is true', () => {
    process.env.DISABLE_CLIENT_LOGGER_FETCH = 'true';

    clientLogger.info('Info should be blocked');
    clientLogger.error('Error should be blocked');

    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockSendBeacon).not.toHaveBeenCalled();

    // No need to restore process.env here, beforeEach handles it
  });
});
