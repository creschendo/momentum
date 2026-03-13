import { describe, it, expect, vi, beforeEach } from 'vitest';
import pool from '../../../db.js';
import service from '../service.js';

vi.mock('../../../db.js', () => ({
  default: {
    query: vi.fn()
  }
}));

const mockNote = {
  id: 1,
  title: 'Test note',
  content: 'Some content',
  createdAt: '2026-03-12T10:00:00.000Z',
  updatedAt: '2026-03-12T10:00:00.000Z'
};

describe('notes service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createNote', () => {
    it('inserts a note and returns the created row', async () => {
      (pool.query as any).mockResolvedValueOnce({ rows: [mockNote] });

      const result = await service.createNote({ userId: 1, title: 'Test note', content: 'Some content' });

      expect(result).toEqual(mockNote);
      expect(pool.query).toHaveBeenCalledTimes(1);
      const [sql, params] = (pool.query as any).mock.calls[0];
      expect(sql).toMatch(/INSERT INTO notes/i);
      expect(params[0]).toBe(1);
      expect(params[1]).toBe('Test note');
      expect(params[2]).toBe('Some content');
    });

    it('truncates title to 256 characters', async () => {
      (pool.query as any).mockResolvedValueOnce({ rows: [{ ...mockNote, title: 'x'.repeat(256) }] });

      await service.createNote({ userId: 1, title: 'x'.repeat(300) });

      const params = (pool.query as any).mock.calls[0][1];
      expect(params[1]).toHaveLength(256);
    });

    it('truncates content to 10000 characters', async () => {
      (pool.query as any).mockResolvedValueOnce({ rows: [mockNote] });

      await service.createNote({ userId: 1, title: 'T', content: 'c'.repeat(15000) });

      const params = (pool.query as any).mock.calls[0][1];
      expect(params[2]).toHaveLength(10000);
    });

    it('stores empty string when content is omitted', async () => {
      (pool.query as any).mockResolvedValueOnce({ rows: [{ ...mockNote, content: '' }] });

      await service.createNote({ userId: 1, title: 'No content' });

      const params = (pool.query as any).mock.calls[0][1];
      expect(params[2]).toBe('');
    });
  });

  describe('listNotes', () => {
    it('returns all notes for the user ordered newest-first', async () => {
      const rows = [mockNote, { ...mockNote, id: 2, title: 'Second' }];
      (pool.query as any).mockResolvedValueOnce({ rows });

      const result = await service.listNotes({ userId: 1 });

      expect(result).toEqual(rows);
      expect(pool.query).toHaveBeenCalledTimes(1);
      const [sql, params] = (pool.query as any).mock.calls[0];
      expect(sql).toMatch(/ORDER BY created_at DESC/i);
      expect(params[0]).toBe(1);
    });

    it('returns an empty array when the user has no notes', async () => {
      (pool.query as any).mockResolvedValueOnce({ rows: [] });

      const result = await service.listNotes({ userId: 99 });

      expect(result).toEqual([]);
    });
  });

  describe('getNote', () => {
    it('returns the note when it belongs to the user', async () => {
      (pool.query as any).mockResolvedValueOnce({ rows: [mockNote] });

      const result = await service.getNote({ userId: 1, id: 1 });

      expect(result).toEqual(mockNote);
    });

    it('returns null when the note does not exist', async () => {
      (pool.query as any).mockResolvedValueOnce({ rows: [] });

      const result = await service.getNote({ userId: 1, id: 999 });

      expect(result).toBeNull();
    });

    it('returns null when the note belongs to a different user', async () => {
      (pool.query as any).mockResolvedValueOnce({ rows: [] });

      const result = await service.getNote({ userId: 2, id: 1 });

      expect(result).toBeNull();
      const params = (pool.query as any).mock.calls[0][1];
      expect(params[0]).toBe(2);
    });
  });

  describe('updateNote', () => {
    it('fetches existing note then writes the update', async () => {
      (pool.query as any)
        .mockResolvedValueOnce({ rows: [mockNote] })
        .mockResolvedValueOnce({ rows: [{ ...mockNote, title: 'Updated', updatedAt: '2026-03-12T11:00:00.000Z' }] });

      const result = await service.updateNote({ userId: 1, id: 1, patch: { title: 'Updated' } });

      expect(result?.title).toBe('Updated');
      expect(pool.query).toHaveBeenCalledTimes(2);
    });

    it('retains existing values for omitted patch fields', async () => {
      (pool.query as any)
        .mockResolvedValueOnce({ rows: [mockNote] })
        .mockResolvedValueOnce({ rows: [mockNote] });

      await service.updateNote({ userId: 1, id: 1, patch: {} });

      const updateParams = (pool.query as any).mock.calls[1][1];
      expect(updateParams[0]).toBe(mockNote.title);
      expect(updateParams[1]).toBe(mockNote.content);
    });

    it('returns null when the note is not found', async () => {
      (pool.query as any).mockResolvedValueOnce({ rows: [] });

      const result = await service.updateNote({ userId: 1, id: 999, patch: { title: 'x' } });

      expect(result).toBeNull();
      expect(pool.query).toHaveBeenCalledTimes(1);
    });

    it('truncates patched title to 256 characters', async () => {
      (pool.query as any)
        .mockResolvedValueOnce({ rows: [mockNote] })
        .mockResolvedValueOnce({ rows: [mockNote] });

      await service.updateNote({ userId: 1, id: 1, patch: { title: 't'.repeat(300) } });

      const updateParams = (pool.query as any).mock.calls[1][1];
      expect(updateParams[0]).toHaveLength(256);
    });
  });

  describe('removeNote', () => {
    it('returns true when a row is deleted', async () => {
      (pool.query as any).mockResolvedValueOnce({ rowCount: 1 });

      const result = await service.removeNote({ userId: 1, id: 1 });

      expect(result).toBe(true);
      const params = (pool.query as any).mock.calls[0][1];
      expect(params[0]).toBe(1);
      expect(params[1]).toBe(1);
    });

    it('returns false when no row is deleted', async () => {
      (pool.query as any).mockResolvedValueOnce({ rowCount: 0 });

      const result = await service.removeNote({ userId: 1, id: 999 });

      expect(result).toBe(false);
    });
  });
});
