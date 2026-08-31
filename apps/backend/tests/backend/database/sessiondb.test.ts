import fs from 'fs';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import {
  SessionDB,
  sessionFilePath,
} from '../../../src/database/sessionDb.js';
import type { SessionData } from '../../../src/types/sessionData.js';

// Long debounce so the timer never fires during a test: writes are deferred
// until flush() and the deferred-write assertions stay deterministic.
const NO_DEBOUNCE = 10_000;

describe('SessionDB', () => {
  let db: SessionDB<SessionData>;
  const projectId = 'test-project-a';

  beforeEach(() => {
    db = new SessionDB<SessionData>(projectId, NO_DEBOUNCE);
    db.clear();
  });

  afterEach(() => {
    db.clear();
  });

  describe('set() and get()', () => {
    it('sets and gets a string value', () => {
      db.set('projectName', 'CSC207');
      expect(db.get('projectName')).toBe('CSC207');
    });

    it('sets and gets a number value', () => {
      db.set('numUseCases', 5);
      expect(db.get('numUseCases')).toBe(5);
    });

    it('overwrites an existing value', () => {
      db.set('projectName', 'Old Name');
      db.set('projectName', 'New Name');
      expect(db.get('projectName')).toBe('New Name');
    });

    it("returns undefined for a key that hasn't been set", () => {
      expect(db.get('projectName')).toBeUndefined();
    });
  });

  describe('exists()', () => {
    it('returns false when no session file exists', () => {
      expect(db.exists()).toBe(false);
    });

    it('returns true after a value is flushed', () => {
      db.set('projectName', 'CSC207');
      db.flush();
      expect(db.exists()).toBe(true);
    });
  });

  describe('load()', () => {
    it('does nothing if no session file exists', () => {
      db.load();
      expect(db.get('projectName')).toBeUndefined();
    });

    it('restores data from a previous session', () => {
      db.set('projectName', 'CSC207');
      db.set('numUseCases', 10);
      db.flush();

      const db2 = new SessionDB<SessionData>(projectId, NO_DEBOUNCE);
      db2.load();

      expect(db2.get('projectName')).toBe('CSC207');
      expect(db2.get('numUseCases')).toBe(10);
    });

    it('restores nested data correctly', () => {
      const files: SessionData['files'] = [
        {
          filePath: 'src/entities/User.java',
          fileType: 'java',
          layer: 'enterpriseBusinessRules',
          node: 'entities',
        },
      ];
      db.set('files', files);
      db.flush();

      const db2 = new SessionDB<SessionData>(projectId, NO_DEBOUNCE);
      db2.load();

      expect(db2.get('files')).toEqual(files);
    });
  });

  describe('clear()', () => {
    it('removes the session file', () => {
      db.set('projectName', 'CSC207');
      db.flush();
      db.clear();
      expect(db.exists()).toBe(false);
    });

    it('clears in-memory data', () => {
      db.set('projectName', 'CSC207');
      db.clear();
      expect(db.get('projectName')).toBeUndefined();
    });

    it('does nothing if no session file exists', () => {
      expect(() => db.clear()).not.toThrow();
    });
  });

  describe('debounced persistence', () => {
    it('defers writes to disk until flush()', () => {
      db.set('projectName', 'CSC207');
      // write is debounced — nothing on disk yet
      expect(db.exists()).toBe(false);
      db.flush();
      expect(db.exists()).toBe(true);
      const raw = JSON.parse(fs.readFileSync(sessionFilePath(projectId), 'utf-8'));
      expect(raw.projectName).toBe('CSC207');
    });

    it('coalesces multiple set() calls into one flush', () => {
      db.set('projectName', 'CSC207');
      db.set('numUseCases', 20);
      db.set('numViolations', 3);
      expect(db.exists()).toBe(false);

      db.flush();

      const raw = JSON.parse(fs.readFileSync(sessionFilePath(projectId), 'utf-8'));
      expect(raw.projectName).toBe('CSC207');
      expect(raw.numUseCases).toBe(20);
      expect(raw.numViolations).toBe(3);
    });

    it('survives multiple set() calls across flushes', () => {
      db.set('projectName', 'CSC207');
      db.flush();
      db.set('numUseCases', 20);
      db.flush();

      const db2 = new SessionDB<SessionData>(projectId, NO_DEBOUNCE);
      db2.load();
      expect(db2.get('projectName')).toBe('CSC207');
      expect(db2.get('numUseCases')).toBe(20);
    });
  });

  describe('per-project isolation', () => {
    it('does not collide on disk between projects', () => {
      db.set('projectName', 'Project A');
      db.flush();

      const other = new SessionDB<SessionData>('test-project-b', NO_DEBOUNCE);
      other.clear();
      other.set('projectName', 'Project B');
      other.flush();

      // Each project has its own file with its own content.
      const aRaw = JSON.parse(
        fs.readFileSync(sessionFilePath('test-project-a'), 'utf-8')
      );
      const bRaw = JSON.parse(
        fs.readFileSync(sessionFilePath('test-project-b'), 'utf-8')
      );
      expect(aRaw.projectName).toBe('Project A');
      expect(bRaw.projectName).toBe('Project B');

      // Loading project A sees only A's data.
      const reloadA = new SessionDB<SessionData>('test-project-a', NO_DEBOUNCE);
      reloadA.load();
      expect(reloadA.get('projectName')).toBe('Project A');
      expect(reloadA.get('numUseCases')).toBeUndefined();

      other.clear();
    });
  });
});
