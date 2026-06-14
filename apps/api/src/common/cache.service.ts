/**
 * LRU Cache Service — BaseForge SaaS
 *
 * Caché en memoria con expiración por TTL y eliminación LRU.
 * Diseñado para datos que cambian con baja frecuencia pero se leen
 * en cada request (feature flags, menús, settings del tenant).
 *
 * TTL recomendados:
 *   - Feature flags del tenant: 5 minutos
 *   - Árbol de menús: 10 minutos
 *   - Settings del tenant: 5 minutos
 *
 * Para entornos multi-instancia, reemplazar con Redis en la Fase de Despliegue.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  lastAccessed: number;
}

export class LruCache<T = unknown> {
  private store = new Map<string, CacheEntry<T>>();
  private readonly maxSize: number;
  private readonly defaultTtlMs: number;

  constructor(options: { maxSize?: number; defaultTtlMs?: number } = {}) {
    this.maxSize = options.maxSize ?? 500;
    this.defaultTtlMs = options.defaultTtlMs ?? 5 * 60 * 1000; // 5 minutos por defecto
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    // Actualizar tiempo de último acceso (LRU tracking)
    entry.lastAccessed = Date.now();
    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    // Si se supera el tamaño máximo, eliminar el entry menos recientemente usado
    if (this.store.size >= this.maxSize && !this.store.has(key)) {
      this.evictLru();
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
      lastAccessed: Date.now(),
    });
  }

  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Invalida todas las entradas cuya clave empiece con el prefijo dado.
   * Útil para invalidar todo el caché de un tenant: invalidatePrefix(`tenant:${tenantId}:`)
   */
  invalidatePrefix(prefix: string): number {
    let count = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Elimina todas las entradas expiradas.
   */
  purgeExpired(): number {
    const now = Date.now();
    let count = 0;
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }

  private evictLru(): void {
    let oldestKey: string | null = null;
    let oldestAccess = Infinity;

    for (const [key, entry] of this.store.entries()) {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.store.delete(oldestKey);
    }
  }
}

// -----------------------------------------------------------------------
// Instancias globales de caché por tipo de dato
// -----------------------------------------------------------------------

/** Caché de feature flags: `tenant:{tenantId}:feature:{featureCode}` → boolean */
export const featureCache = new LruCache<boolean>({
  maxSize: 1000,
  defaultTtlMs: 5 * 60 * 1000, // 5 minutos
});

/** Caché de árbol de menús: `tenant:{tenantId}:menus` → MenuItem[] */
export const menuCache = new LruCache<unknown[]>({
  maxSize: 200,
  defaultTtlMs: 10 * 60 * 1000, // 10 minutos
});

/** Caché de settings del tenant: `tenant:{tenantId}:settings` → Record */
export const settingsCache = new LruCache<Record<string, unknown>>({
  maxSize: 200,
  defaultTtlMs: 5 * 60 * 1000, // 5 minutos
});

// Purga automática de entradas expiradas cada 5 minutos para evitar memory leaks
setInterval(() => {
  featureCache.purgeExpired();
  menuCache.purgeExpired();
  settingsCache.purgeExpired();
}, 5 * 60 * 1000);
