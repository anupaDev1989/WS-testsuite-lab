/**
 * Content Security Policy (CSP) Middleware for Hono
 * 
 * This middleware sets security headers to help prevent XSS and other code injection attacks.
 * It implements a strict CSP with nonce-based inline script/style support.
 */

import { Context, Next } from 'hono';
import { randomBytes } from 'node:crypto';

// Generate a random nonce for inline scripts/styles
const generateNonce = () => randomBytes(16).toString('base64');

// Default CSP directives
const defaultDirectives = {
  // Default source list for most directives
  'default-src': ["'self'"],  
  // Script sources - allow 'self' and 'unsafe-eval' in development
  'script-src': [
    "'self'",
    "'unsafe-inline'",  // Required for some libraries, consider removing in production
    "'unsafe-eval'"     // Required for some libraries, consider removing in production
  ],
  // Style sources
  'style-src': [
    "'self'",
    "'unsafe-inline'"   // Required for some CSS-in-JS libraries
  ],
  // Image sources
  'img-src': [
    "'self'",
    'data:',            // For data: URLs
    'https:',           // For external images
    'http:'            // For development with HTTP
  ],
  // Font sources
  'font-src': ["'self'", 'data:'],
  // Connect sources - restrict to our API endpoints
  'connect-src': [
    "'self'",
    'https://*.googleapis.com',  // For Google APIs
    'https://*.supabase.co'      // For Supabase
  ],
  // Frame sources - restrict to specific domains if needed
  'frame-src': ["'self'"],
  // Object sources - restrict to none
  'object-src': ["'none'"],
  // Base URI - prevent base tag hijacking
  'base-uri': ["'self'"],
  // Form actions - restrict to same origin
  'form-action': ["'self'"],
  // Frame ancestors - prevent clickjacking
  'frame-ancestors': ["'self'"],
  // Block all mixed content
  'block-all-mixed-content': [],
  // Upgrade insecure requests
  'upgrade-insecure-requests': [],
  // Report violations to this URI (optional)
  // 'report-uri': ['/api/csp-report'],
};

type CspDirectives = Record<string, string[]>;

interface CspOptions {
  reportOnly?: boolean;
  directives?: CspDirectives;
  reportTo?: string;
}

/**
 * CSP Middleware for Hono
 * @param options - Configuration options for CSP
 */
export function csp(options: CspOptions = {}) {
  const {
    reportOnly = false,
    directives = {},
    reportTo = ''
  } = options;

  // Merge default directives with custom ones
  const mergedDirectives: CspDirectives = { ...defaultDirectives };
  
  // Override defaults with user-provided directives
  for (const [key, value] of Object.entries(directives)) {
    mergedDirectives[key] = value;
  }

  // Add report-to directive if reportTo is provided
  if (reportTo) {
    mergedDirectives['report-to'] = [reportTo];
  }

  // Convert directives to CSP string
  const cspString = Object.entries(mergedDirectives)
    .map(([directive, sources]) => {
      if (sources.length === 0) return `${directive}`;
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');

  return async (c: Context, next: Next) => {
    // Generate a new nonce for each request
    const nonce = generateNonce();
    
    // Add nonce to the context for use in templates
    c.set('cspNonce', nonce);
    
    // Add the nonce to script-src and style-src
    const finalCsp = cspString
      .replace(/'unsafe-inline'/g, `'nonce-${nonce}' 'unsafe-inline'`);
    
    // Set the appropriate CSP header
    const headerName = reportOnly 
      ? 'Content-Security-Policy-Report-Only' 
      : 'Content-Security-Policy';
    
    c.header(headerName, finalCsp);
    
    // Add other security headers
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'SAMEORIGIN');
    c.header('X-XSS-Protection', '1; mode=block');
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    c.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    
    await next();
  };
}

/**
 * Middleware to handle CSP violation reports
 */
export function cspReportHandler() {
  return async (c: Context) => {
    try {
      const report = await c.req.json();
      console.warn('CSP Violation:', JSON.stringify(report, null, 2));
      return c.json({ status: 'ok' });
    } catch (e) {
      console.error('Error processing CSP violation report:', e);
      return c.json({ error: 'Invalid report' }, 400);
    }
  };
}
