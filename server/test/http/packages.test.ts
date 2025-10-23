/**
 * HTTP Contract Tests for /v1/packages
 * P0/P1 Implementation with Vitest + Supertest
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../src/app';
import { loadConfig } from '../../src/lib/core/config';

describe('GET /v1/packages', () => {
  let app: Express;

  beforeAll(() => {
    const config = loadConfig();
    app = createApp({ ...config, ADAPTERS_PRESET: 'mock' });
  });

  it('returns packages list with contract shape', async () => {
    const res = await request(app)
      .get('/v1/packages')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);

    if (res.body.length > 0) {
      const pkg = res.body[0];
      expect(pkg).toHaveProperty('id');
      expect(pkg).toHaveProperty('slug');
      expect(pkg).toHaveProperty('title');
      expect(pkg).toHaveProperty('priceCents');
      expect(typeof pkg.id).toBe('string');
      expect(typeof pkg.slug).toBe('string');
      expect(typeof pkg.title).toBe('string');
      expect(typeof pkg.priceCents).toBe('number');
    }
  });

  it('handles invalid route with 404', async () => {
    await request(app)
      .get('/v1/nonexistent')
      .expect(404);
  });
});

describe('GET /v1/packages/:slug', () => {
  let app: Express;

  beforeAll(() => {
    const config = loadConfig();
    app = createApp({ ...config, ADAPTERS_PRESET: 'mock' });
  });

  it('returns single package by slug', async () => {
    const res = await request(app)
      .get('/v1/packages/classic')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('slug');
    expect(res.body.slug).toBe('classic');
  });

  it('returns 404 for non-existent package', async () => {
    await request(app)
      .get('/v1/packages/nonexistent-slug')
      .expect(404);
  });
});
