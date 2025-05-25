import { describe, expect /*, it */ } from '@jest/globals';
import { calculateBackoffTime, BackoffOptions } from '../../../tests/mocks/lib/auth/token-refresh';

describe('Exponential Backoff', () => {
  it('should increase delay based on attempt number', () => {
    const delay1 = calculateBackoffTime(1);
    const delay2 = calculateBackoffTime(2);
    const delay3 = calculateBackoffTime(3);

    // Each delay should be roughly double the previous one, accounting for jitter
    expect(delay2).toBeGreaterThan(delay1);
    expect(delay3).toBeGreaterThan(delay2);
  });

  it('should respect maximum delay', () => {
    const options: BackoffOptions = {
      baseDelayMs: 1000,
      maxDelayMs: 5000,
      jitterFactor: 0,
    };

    // With these options, attempt 10 would exceed maxDelay without capping
    const delay = calculateBackoffTime(10, options);
    expect(delay).toBeLessThanOrEqual(options.maxDelayMs as number);
  });

  it('should use default options if none provided', () => {
    const delay = calculateBackoffTime(1);
    expect(delay).toBeGreaterThan(0);
  });

  it('should apply jitter to the delay', () => {
    // Use high jitter for testing
    const options: BackoffOptions = {
      baseDelayMs: 1000,
      maxDelayMs: 10000,
      jitterFactor: 0.5,
    };

    // Run multiple times to account for randomness
    const delays: number[] = [];
    for (let i = 0; i < 10; i++) {
      delays.push(calculateBackoffTime(1, options));
    }

    // With high jitter, we should have different values
    const uniqueDelays = new Set(delays);
    expect(uniqueDelays.size).toBeGreaterThan(1);
  });
});
