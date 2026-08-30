/**
 * A private generic collection repository used by `SessionDBAccess`.
 *
 * Infrastructure-internal only — it is NOT part of `SessionDBAccessInterface`
 * and is never exposed to the use-case layer. It collapses the duplicated
 * upsert/remove/getAll boilerplate across the files/edges/nodes/useCases
 * collections into one implementation, keyed by an identity function.
 */
export class CollectionRepository<T> {
  private items: T[] = [];

  constructor(private readonly keyOf: (item: T) => string) {}

  /** Replace the entire collection. */
  set(items: T[]): void {
    this.items = items;
  }

  /** Insert if absent (by key), otherwise replace the matching entry. */
  upsert(item: T): void {
    const key = this.keyOf(item);
    const idx = this.items.findIndex((i) => this.keyOf(i) === key);
    this.items =
      idx === -1
        ? [...this.items, item]
        : this.items.map((i) => (this.keyOf(i) === key ? item : i));
  }

  /** Remove the entry with the given key. */
  remove(key: string): void {
    this.items = this.items.filter((i) => this.keyOf(i) !== key);
  }

  getAll(): T[] {
    return [...this.items];
  }

  getByKey(key: string): T | undefined {
    return this.items.find((i) => this.keyOf(i) === key);
  }

  find(predicate: (item: T) => boolean): T[] {
    return this.items.filter(predicate);
  }

  findOne(predicate: (item: T) => boolean): T | undefined {
    return this.items.find(predicate);
  }
}
