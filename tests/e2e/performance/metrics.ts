/**
 * Performance metrics collection utilities
 * Extracted from performance.spec.ts to reduce file size
 */
import { processPerformanceMetrics, logPerformanceMetrics } from './metrics-log';

// Define types for CDP responses to fix linter errors
export interface PerformanceMetrics {
  metrics: Array<{
    name: string;
    value: number;
  }>;
}

export interface MemoryInfo {
  [key: string]: any; // Using index signature for dynamic properties
}

export interface RequestInfo {
  url: string;
  resourceType: string;
  method: string;
}

/**
 * Clear performance metrics for a clean measurement
 */
async function clearPerformanceMetrics(client: any) {
  try {
    await client.send('Performance.clearMetrics' as any);
  } catch (clearError) {
    console.log(
      `Note: Performance.clearMetrics not available - this is expected in some browser versions:`,
      clearError
    );
    // Continue without clearing metrics - this is non-blocking
  }
}

/**
 * Navigate to a page and measure navigation time
 */
async function navigateAndMeasureTime(page: any, route: string): Promise<number> {
  console.log(`Testing performance for route: ${route}`);
  const navigationStart = Date.now();
  await page.goto(route, { waitUntil: 'networkidle', timeout: 10000 });
  const navigationEnd = Date.now();

  return navigationEnd - navigationStart;
}

/**
 * Navigate to a route and collect performance metrics
 */
export async function measureRoutePerformance(page: any, client: any, route: string) {
  try {
    // Clear metrics before navigation
    await clearPerformanceMetrics(client);

    // Navigate to the page and measure time
    const navigationTime = await navigateAndMeasureTime(page, route);

    // Get performance metrics
    const performanceMetrics = (await client.send('Performance.getMetrics')) as PerformanceMetrics;

    // Process metrics into a more usable format
    const metrics = processPerformanceMetrics(performanceMetrics);

    // Log performance metrics
    logPerformanceMetrics(metrics, route, navigationTime);
  } catch (e: any) {
    console.log(`Could not test performance for ${route}: ${e.message}`);
    // Continue with the next route, don't skip the entire test
  }
}

/**
 * Get and log memory usage information
 */
export async function getMemoryUsage(client: any) {
  // Get memory usage information
  const memoryInfo = (await client.send('Memory.getBrowserMemoryUsage' as any)) as MemoryInfo;

  // Log memory usage
  console.log('Browser memory usage:');
  for (const [key, value] of Object.entries(memoryInfo)) {
    console.log(`  - ${key}: ${value}`);
  }

  // Additional performance metrics
  const performanceMetrics = (await client.send('Performance.getMetrics')) as PerformanceMetrics;

  const jsHeapSizeLimit = performanceMetrics.metrics?.find(m => m.name === 'JSHeapUsedSize')?.value;
  const jsHeapSize = performanceMetrics.metrics?.find(m => m.name === 'JSHeapTotalSize')?.value;

  if (jsHeapSize && jsHeapSizeLimit) {
    const usedPercentage = (jsHeapSize / jsHeapSizeLimit) * 100;
    console.log(
      `  - JS Heap: ${Math.round(jsHeapSize / 1024 / 1024)}MB / ${Math.round(
        jsHeapSizeLimit / 1024 / 1024
      )}MB (${Math.round(usedPercentage)}%)`
    );
  }

  return memoryInfo;
}
