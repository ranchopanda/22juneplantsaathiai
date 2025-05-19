import React from 'react';

/**
 * Debugging utilities for the application
 */

/**
 * Safely stringify an object for debugging, handling circular references
 * 
 * @param obj The object to stringify
 * @param space Number of spaces to indent
 * @returns A string representation of the object
 */
export const safeStringify = (obj: any, space = 2): string => {
  const cache = new Set();
  return JSON.stringify(
    obj,
    (key, value) => {
      if (typeof value === 'object' && value !== null) {
        // Check for circular references
        if (cache.has(value)) {
          return '[Circular Reference]';
        }
        cache.add(value);
      }
      return value;
    },
    space
  );
};

/**
 * Log an object safely without crashing the application
 * 
 * @param label A label to identify the log
 * @param obj The object to log
 */
export const debugLog = (label: string, obj: any): void => {
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.group(`🐛 DEBUG: ${label}`);
      console.log(safeStringify(obj));
      console.groupEnd();
    } catch (error) {
      console.error('Error in debugLog:', error);
    }
  }
};

/**
 * Check for common data structure issues in an object
 * 
 * @param obj The object to validate
 * @param requiredKeys An array of keys that should be present
 * @returns An array of issues found, empty if none
 */
export const validateObjectStructure = (obj: any, requiredKeys: string[]): string[] => {
  const issues: string[] = [];
  
  if (!obj) {
    issues.push('Object is null or undefined');
    return issues;
  }
  
  if (typeof obj !== 'object') {
    issues.push(`Expected an object, got ${typeof obj}`);
    return issues;
  }
  
  // Check for required keys
  for (const key of requiredKeys) {
    if (!(key in obj)) {
      issues.push(`Missing required key: ${key}`);
    } else if (obj[key] === undefined || obj[key] === null) {
      issues.push(`Key ${key} has null or undefined value`);
    }
  }
  
  return issues;
};

/**
 * Add debugging to disease detection component
 * This adds visual debug info in non-production environments
 */
export const DebugInfo: React.FC<{data: any, label?: string}> = ({ data, label = 'Debug Data' }) => {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return (
    <details className="mt-4 p-2 border border-gray-200 rounded bg-gray-50">
      <summary className="font-mono text-xs text-gray-500 cursor-pointer">
        🔍 Debug: {label}
      </summary>
      <pre className="mt-2 p-2 text-xs overflow-auto bg-gray-100 rounded max-h-96">
        {safeStringify(data)}
      </pre>
    </details>
  );
};
