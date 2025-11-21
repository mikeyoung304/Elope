import { describe, test, expect } from 'vitest';
import {
  sanitizeHtml,
  sanitizePlainText,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeSlug,
  sanitizeObject,
} from '../../src/lib/sanitization';

describe('sanitization', () => {
  describe('sanitizeHtml', () => {
    test('should allow safe HTML tags', () => {
      const input = '<p>Hello <strong>world</strong></p>';
      const output = sanitizeHtml(input);
      expect(output).toContain('<p>');
      expect(output).toContain('<strong>');
    });

    test('should strip dangerous HTML', () => {
      const input = '<script>alert("xss")</script><p>Safe</p>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain('<script>');
      expect(output).toContain('<p>');
    });

    test('should strip event handlers', () => {
      const input = '<p onclick="alert(1)">Click me</p>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain('onclick');
    });

    test('should strip iframe tags', () => {
      const input = '<iframe src="evil.com"></iframe><p>Safe</p>';
      const output = sanitizeHtml(input);
      expect(output).not.toContain('<iframe>');
      expect(output).toContain('<p>');
    });
  });

  describe('sanitizePlainText', () => {
    test('should strip all HTML tags', () => {
      const input = '<p>Hello <script>alert(1)</script> world</p>';
      const output = sanitizePlainText(input);
      expect(output).not.toContain('<');
      expect(output).not.toContain('>');
    });

    test('should escape special characters', () => {
      const input = '< > & " \'';
      const output = sanitizePlainText(input);
      expect(output).toContain('&lt;');
      expect(output).toContain('&gt;');
      expect(output).toContain('&amp;');
    });

    test('should handle normal text', () => {
      const input = 'Hello World 123';
      const output = sanitizePlainText(input);
      expect(output).toBe('Hello World 123');
    });
  });

  describe('sanitizeEmail', () => {
    test('should normalize valid email', () => {
      const input = '  USER@EXAMPLE.COM  ';
      const output = sanitizeEmail(input);
      expect(output).toBe('user@example.com');
    });

    test('should return empty for invalid email', () => {
      const input = 'not-an-email';
      const output = sanitizeEmail(input);
      expect(output).toBe('');
    });

    test('should handle valid email with plus addressing', () => {
      const input = 'user+test@example.com';
      const output = sanitizeEmail(input);
      expect(output).toContain('@example.com');
    });

    test('should reject email with script tags', () => {
      const input = '<script>alert(1)</script>@example.com';
      const output = sanitizeEmail(input);
      expect(output).toBe('');
    });
  });

  describe('sanitizeUrl', () => {
    test('should allow valid HTTPS URLs', () => {
      const input = 'https://example.com/path';
      const output = sanitizeUrl(input);
      expect(output).toBe(input);
    });

    test('should allow valid HTTP URLs', () => {
      const input = 'http://example.com/path';
      const output = sanitizeUrl(input);
      expect(output).toBe(input);
    });

    test('should reject javascript: URLs', () => {
      const input = 'javascript:alert(1)';
      const output = sanitizeUrl(input);
      expect(output).toBe('');
    });

    test('should reject data: URLs', () => {
      const input = 'data:text/html,<script>alert(1)</script>';
      const output = sanitizeUrl(input);
      expect(output).toBe('');
    });

    test('should reject URLs without protocol', () => {
      const input = 'example.com';
      const output = sanitizeUrl(input);
      expect(output).toBe('');
    });

    test('should reject file: URLs', () => {
      const input = 'file:///etc/passwd';
      const output = sanitizeUrl(input);
      expect(output).toBe('');
    });
  });

  describe('sanitizeSlug', () => {
    test('should convert to lowercase', () => {
      const input = 'Hello-World';
      const output = sanitizeSlug(input);
      expect(output).toBe('hello-world');
    });

    test('should remove special characters', () => {
      const input = 'hello@world!#$%';
      const output = sanitizeSlug(input);
      expect(output).toBe('helloworld');
    });

    test('should allow hyphens', () => {
      const input = 'hello-world-123';
      const output = sanitizeSlug(input);
      expect(output).toBe('hello-world-123');
    });

    test('should remove leading/trailing hyphens', () => {
      const input = '-hello-world-';
      const output = sanitizeSlug(input);
      expect(output).toBe('hello-world');
    });

    test('should truncate to 100 characters', () => {
      const input = 'a'.repeat(150);
      const output = sanitizeSlug(input);
      expect(output.length).toBe(100);
    });
  });

  describe('sanitizeObject', () => {
    test('should sanitize nested objects', () => {
      const input = {
        name: '<script>alert(1)</script>John',
        email: 'USER@EXAMPLE.COM',
        profile: {
          bio: '<p>Hello</p>',
        },
      };
      const output = sanitizeObject(input);
      expect(output.name).not.toContain('<script>');
      expect(output.email).toBe('user@example.com');
      expect(output.profile.bio).not.toContain('<p>');
    });

    test('should handle arrays', () => {
      const input = {
        tags: ['<script>xss</script>', 'safe-tag'],
      };
      const output = sanitizeObject(input);
      expect(output.tags[0]).not.toContain('<script>');
      expect(output.tags[1]).toBe('safe-tag');
    });

    test('should preserve numbers and booleans', () => {
      const input = {
        count: 42,
        active: true,
        name: 'test',
      };
      const output = sanitizeObject(input);
      expect(output.count).toBe(42);
      expect(output.active).toBe(true);
      expect(output.name).toBe('test');
    });

    test('should sanitize email fields', () => {
      const input = {
        userEmail: 'USER@EXAMPLE.COM',
        contactEmail: '  test@test.com  ',
      };
      const output = sanitizeObject(input);
      expect(output.userEmail).toBe('user@example.com');
      expect(output.contactEmail).toBe('test@test.com');
    });

    test('should sanitize URL fields', () => {
      const input = {
        websiteUrl: 'https://example.com',
        logoUrl: 'javascript:alert(1)',
      };
      const output = sanitizeObject(input);
      expect(output.websiteUrl).toBe('https://example.com');
      expect(output.logoUrl).toBe('');
    });

    test('should allow HTML in specified fields', () => {
      const input = {
        title: '<p>Title</p>',
        description: '<p>Description</p>',
      };
      const output = sanitizeObject(input, { allowHtml: ['description'] });
      expect(output.title).not.toContain('<p>'); // Should be stripped
      expect(output.description).toContain('<p>'); // Should be preserved
    });

    test('should handle null and undefined', () => {
      const input = {
        name: null,
        email: undefined,
      };
      const output = sanitizeObject(input);
      expect(output.name).toBeNull();
      expect(output.email).toBeUndefined();
    });

    test('should handle deeply nested objects', () => {
      const input = {
        level1: {
          level2: {
            level3: {
              name: '<script>xss</script>test',
            },
          },
        },
      };
      const output = sanitizeObject(input);
      expect(output.level1.level2.level3.name).not.toContain('<script>');
    });
  });
});
