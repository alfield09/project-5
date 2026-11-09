import type { StorageLike } from './characterStorage'

/** Keeps text in memory like the browser's storage does. Used by tests as a stand-in for localStorage. */
export class MemoryStorage implements StorageLike {
  items = new Map<string, string>()

  getItem(key: string): string | null {
    return this.items.get(key) ?? null
  }

  setItem(key: string, value: string): void {
    this.items.set(key, value)
  }

  removeItem(key: string): void {
    this.items.delete(key)
  }
}
