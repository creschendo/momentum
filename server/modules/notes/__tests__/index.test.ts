import { describe, it, expect, vi, beforeEach } from 'vitest';
import router from '../index.js';
import service from '../service.js';
import {
  getRouteMethodsByPath,
  hasRoute,
  getRouteHandler,
  runRoute
} from '../../__tests__/routerTestUtils.js';

vi.mock('../service.js', () => ({
  default: {
    listNotes: vi.fn(),
    createNote: vi.fn(),
    updateNote: vi.fn(),
    removeNote: vi.fn()
  }
}));

const mockNote = {
  id: 1,
  title: 'Test note',
  content: 'Some content',
  createdAt: '2026-03-12T10:00:00.000Z',
  updatedAt: '2026-03-12T10:00:00.000Z'
};

describe('notes router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('route registration', () => {
    it('registers all expected routes', () => {
      const routes = getRouteMethodsByPath(router);

      expect(hasRoute(routes, '/status', 'get')).toBe(true);
      expect(hasRoute(routes, '/', 'get')).toBe(true);
      expect(hasRoute(routes, '/', 'post')).toBe(true);
      expect(hasRoute(routes, '/:id', 'patch')).toBe(true);
      expect(hasRoute(routes, '/:id', 'delete')).toBe(true);
    });
  });

  describe('GET /status', () => {
    it('returns module status payload', async () => {
      const handler = getRouteHandler(router, 'get', '/status');
      const res = await runRoute(handler, { user: { id: 1 } });

      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ module: 'notes', status: 'ok', info: 'Notes module ready' });
    });
  });

  describe('GET /', () => {
    it('returns the list of notes for the user', async () => {
      const notes = [mockNote, { ...mockNote, id: 2, title: 'Second' }];
      vi.spyOn(service, 'listNotes').mockResolvedValueOnce(notes);

      const handler = getRouteHandler(router, 'get', '/');
      const res = await runRoute(handler, { user: { id: 1 } });

      expect(service.listNotes).toHaveBeenCalledWith({ userId: 1 });
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(notes);
    });

    it('returns 500 when service throws', async () => {
      vi.spyOn(service, 'listNotes').mockRejectedValueOnce(new Error('db error'));

      const handler = getRouteHandler(router, 'get', '/');
      const res = await runRoute(handler, { user: { id: 1 } });

      expect(res.statusCode).toBe(500);
    });
  });

  describe('POST /', () => {
    it('creates a note and returns 201', async () => {
      vi.spyOn(service, 'createNote').mockResolvedValueOnce(mockNote);

      const handler = getRouteHandler(router, 'post', '/');
      const res = await runRoute(handler, {
        user: { id: 1 },
        body: { title: 'Test note', content: 'Some content' }
      });

      expect(service.createNote).toHaveBeenCalledWith({ userId: 1, title: 'Test note', content: 'Some content' });
      expect(res.statusCode).toBe(201);
      expect(res.body).toEqual(mockNote);
    });

    it('returns 400 when title is missing', async () => {
      const handler = getRouteHandler(router, 'post', '/');
      const res = await runRoute(handler, {
        user: { id: 1 },
        body: { content: 'No title here' }
      });

      expect(res.statusCode).toBe(400);
      expect(res.body).toEqual({ error: 'title: Invalid input: expected string, received undefined' });
      expect(service.createNote).not.toHaveBeenCalled();
    });

    it('returns 400 when title is empty string', async () => {
      const handler = getRouteHandler(router, 'post', '/');
      const res = await runRoute(handler, {
        user: { id: 1 },
        body: { title: '   ' }
      });

      expect(res.statusCode).toBe(400);
      expect(service.createNote).not.toHaveBeenCalled();
    });

    it('creates a note without content', async () => {
      vi.spyOn(service, 'createNote').mockResolvedValueOnce({ ...mockNote, content: '' });

      const handler = getRouteHandler(router, 'post', '/');
      const res = await runRoute(handler, {
        user: { id: 1 },
        body: { title: 'Title only' }
      });

      expect(res.statusCode).toBe(201);
      expect(service.createNote).toHaveBeenCalledWith({ userId: 1, title: 'Title only', content: undefined });
    });

    it('returns 500 when service throws', async () => {
      vi.spyOn(service, 'createNote').mockRejectedValueOnce(new Error('db error'));

      const handler = getRouteHandler(router, 'post', '/');
      const res = await runRoute(handler, {
        user: { id: 1 },
        body: { title: 'Boom' }
      });

      expect(res.statusCode).toBe(500);
    });
  });

  describe('PATCH /:id', () => {
    it('updates a note and returns the updated row', async () => {
      const updated = { ...mockNote, title: 'Updated title' };
      vi.spyOn(service, 'updateNote').mockResolvedValueOnce(updated);

      const handler = getRouteHandler(router, 'patch', '/:id');
      const res = await runRoute(handler, {
        user: { id: 1 },
        params: { id: '1' },
        body: { title: 'Updated title' }
      });

      expect(service.updateNote).toHaveBeenCalledWith({
        userId: 1,
        id: '1',
        patch: { title: 'Updated title', content: undefined }
      });
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual(updated);
    });

    it('returns 404 when note is not found', async () => {
      vi.spyOn(service, 'updateNote').mockResolvedValueOnce(null);

      const handler = getRouteHandler(router, 'patch', '/:id');
      const res = await runRoute(handler, {
        user: { id: 1 },
        params: { id: '999' },
        body: { title: 'x' }
      });

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ error: 'not found' });
    });

    it('returns 500 when service throws', async () => {
      vi.spyOn(service, 'updateNote').mockRejectedValueOnce(new Error('db error'));

      const handler = getRouteHandler(router, 'patch', '/:id');
      const res = await runRoute(handler, {
        user: { id: 1 },
        params: { id: '1' },
        body: {}
      });

      expect(res.statusCode).toBe(500);
    });
  });

  describe('DELETE /:id', () => {
    it('deletes a note and returns 204', async () => {
      vi.spyOn(service, 'removeNote').mockResolvedValueOnce(true);

      const handler = getRouteHandler(router, 'delete', '/:id');
      const res = await runRoute(handler, {
        user: { id: 1 },
        params: { id: '1' }
      });

      expect(service.removeNote).toHaveBeenCalledWith({ userId: 1, id: '1' });
      expect(res.statusCode).toBe(204);
      expect(res.ended).toBe(true);
    });

    it('returns 404 when note is not found', async () => {
      vi.spyOn(service, 'removeNote').mockResolvedValueOnce(false);

      const handler = getRouteHandler(router, 'delete', '/:id');
      const res = await runRoute(handler, {
        user: { id: 1 },
        params: { id: '999' }
      });

      expect(res.statusCode).toBe(404);
      expect(res.body).toEqual({ error: 'not found' });
    });

    it('returns 500 when service throws', async () => {
      vi.spyOn(service, 'removeNote').mockRejectedValueOnce(new Error('db error'));

      const handler = getRouteHandler(router, 'delete', '/:id');
      const res = await runRoute(handler, {
        user: { id: 1 },
        params: { id: '1' }
      });

      expect(res.statusCode).toBe(500);
    });
  });
});
