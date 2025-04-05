/**
 * Logging utilities for performance metrics
 * This further splits functionality from metrics.ts to reduce statement count
 */
import { PerformanceMetrics } from './metrics';

/**
 * Process performance metrics from CDP response into a more usable format
 */
export function processPerformanceMetrics(
  performanceMetrics: PerformanceMetrics
): Record<string, number> {
  const metrics: Record<string, number> = {};
  for (const metric of performanceMetrics.metrics) {
    metrics[metric.name] = metric.value;
  }
  return metrics;
}

/**
 * Log basic navigation time metrics
 */
export function logNavigationTime(route: string, navigationTime: number) {
  console.log(`Navigation timing for ${route}:`);
  console.log(`  - Navigation time: ${navigationTime}ms`);

  // Set basic performance expectations
  if (navigationTime > 5000) {
    console.log(`  ⚠️ Navigation time for ${route} is high: ${navigationTime}ms`);
  } else {
    console.log(`  ✓ Navigation time for ${route} is acceptable: ${navigationTime}ms`);
  }
}

/**
 * Log detailed performance metrics
 */
export function logDetailedMetrics(metrics: Record<string, number>) {
  console.log(`  - First Paint: ${Math.round(metrics['FirstPaint'] || 0)}ms`);
  console.log(`  - DOM Content Loaded: ${Math.round(metrics['DOMContentLoaded'] || 0)}ms`);
  console.log(`  - Load Event: ${Math.round(metrics['LoadEvent'] || 0)}ms`);
}

/**
 * Extract and log key performance metrics
 */
export function logPerformanceMetrics(
  metrics: Record<string, number>,
  route: string,
  navigationTime: number
) {
  // Log basic navigation time information
  logNavigationTime(route, navigationTime);

  // Log detailed metrics
  logDetailedMetrics(metrics);
}
