import { createHash } from 'crypto';

/**
 * Cache keys written before variants were grouped under their original:
 * `cache/{md5}.{ext}`, flat. Nothing reads them any more; they only exist so a
 * cleanup can tell them apart from the current layout.
 */
export const LEGACY_CACHE_KEY = /^cache\/[0-9a-f]{32}\.[^/]+$/;

export class KeyGenerator {
  /**
   * Generates a unique key for the file based on path and parameters.
   *
   * Variants live under their original - `cache/{originalPath}/{md5}.{ext}` -
   * so every variant of one file can be listed by prefix. With a flat
   * `cache/{md5}.{ext}` layout the only way to find them was to list the whole
   * cache and read each object's metadata, which made every delete scale with
   * the size of the entire bucket's cache.
   */
  static generateKey(originalPath: string, params: any): string {
    const paramsString = JSON.stringify(params);
    const hash = createHash('md5').update(originalPath + paramsString).digest('hex');
    const ext = originalPath.split('.').pop();
    return `${this.variantsPrefix(originalPath)}${hash}.${ext}`;
  }

  /**
   * Prefix all cached variants of one original share: `cache/{originalPath}/`.
   */
  static variantsPrefix(originalPath: string): string {
    return `cache/${originalPath.replace(/^\/+/, '').replace(/\/+$/, '')}/`;
  }

  /**
   * Whether a key listed under `variantsPrefix(path)` is a variant of that very
   * file. A folder can share a name with a file (`a/b.jpg` and `a/b.jpg/c.png`),
   * so the prefix also matches the nested file's variants - those sit one
   * level deeper and are left alone.
   */
  static isVariantOf(originalPath: string, key: string): boolean {
    const prefix = this.variantsPrefix(originalPath);
    return key.startsWith(prefix) && !key.slice(prefix.length).includes('/');
  }

  /**
   * Generates cache key for existence check
   */
  static generateCacheKey(originalPath: string, params?: any): string {
    if (params) {
      const key = this.generateKey(originalPath, params);
      return `exists:${key}`;
    }
    return `original:${originalPath}`;
  }
}
