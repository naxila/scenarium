export function interpolate(value: any, context: Record<string, any>): any {
  if (typeof value === 'string') {
    return value.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      try {
        // Support simple paths and dotted paths
        return getValueByPath(context, path) || match;
      } catch (error) {
        console.error(`Interpolation error for path "${path}":`, error);
        return match;
      }
    });
  }
  return value;
}

// Function to get value by path
function getValueByPath(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }
  
  return current;
}

export function interpolateObject(obj: any, context: Record<string, any>): any {
  if (Array.isArray(obj)) {
    return obj.map(item => interpolateObject(item, context));
  } else if (typeof obj === 'object' && obj !== null) {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = interpolateObject(value, context);
    }
    return result;
  } else {
    return interpolate(obj, context);
  }
}
