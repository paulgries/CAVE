import fs from 'fs';
import os from 'os';
import path from 'path';

const WORKER_SUFFIX = process.env.JEST_WORKER_ID ? `-${process.env.JEST_WORKER_ID}` : '';

/** Per-project session file path (includes the jest worker id to avoid collisions). */
export function sessionFilePath(projectId: string): string {
  return path.join(
    os.tmpdir(),
    `clean-arch-cli-session-${projectId}${WORKER_SUFFIX}.json`
  );
}

/**
 * A per-project, in-memory session store with debounced disk persistence.
 *
 * Each instance is scoped to a single `projectId` and persists to its own file
 * (`clean-arch-cli-session-<projectId>.json` in the OS temp dir), so different
 * projects never collide on disk. `set()` updates memory immediately and
 * schedules a debounced write; call `flush()` to force a synchronous write
 * (e.g. before a read, at a checkpoint, or before process exit).
 */
export class SessionDB<T extends object> {
  private data: Partial<T> = {};
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly projectId: string = 'default',
    private readonly debounceMs: number = 100
  ) {}

  private get filePath(): string {
    return sessionFilePath(this.projectId);
  }

  set<K extends keyof T>(key: K, value: T[K]): void {
    this.data[key] = value;
    this.scheduleWrite();
  }

  get<K extends keyof T>(key: K): T[K] | undefined {
    return this.data[key];
  }

  load(): void {
    if (!fs.existsSync(this.filePath)) return;
    const raw = fs.readFileSync(this.filePath, 'utf-8');
    if (!raw.trim()) return;
    this.data = JSON.parse(raw) as Partial<T>;
  }

  exists(): boolean {
    return fs.existsSync(this.filePath);
  }

  clear(): void {
    this.cancelWrite();
    this.data = {};
    if (this.exists()) fs.unlinkSync(this.filePath);
  }

  /** Force a synchronous write of the current in-memory state to disk. */
  flush(): void {
    this.cancelWrite();
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
  }

  private scheduleWrite(): void {
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = undefined;
      this.flush();
    }, this.debounceMs);
  }

  private cancelWrite(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }
}
