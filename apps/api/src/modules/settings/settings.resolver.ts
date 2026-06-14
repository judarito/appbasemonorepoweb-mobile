import { db } from "../../database/db";
import { tenants } from "../../database/schema";
import { eq, and, isNull } from "drizzle-orm";

export async function resolveTenantForPublicRequest(
  host: string,
  headerTenantId?: string | null,
  headerTenantCode?: string | null
) {
  // 1. Resolver por ID del Header
  if (headerTenantId) {
    const t = await db
      .select()
      .from(tenants)
      .where(and(eq(tenants.id, headerTenantId), isNull(tenants.deletedAt)))
      .limit(1)
      .then((r) => r[0]);
    if (t) return t;
  }

  // 2. Resolver por código del Header
  if (headerTenantCode) {
    const t = await db
      .select()
      .from(tenants)
      .where(and(eq(tenants.code, headerTenantCode.toUpperCase()), isNull(tenants.deletedAt)))
      .limit(1)
      .then((r) => r[0]);
    if (t) return t;
  }

  // 3. Resolver por subdominio del Host
  if (host) {
    // Quitar puerto si viene en el Host (ej. localhost:3000 -> localhost)
    const hostname = host.split(":")[0];
    const parts = hostname.split(".");
    
    // Si tenemos algo como demo.localhost o demo.baseforge.local
    if (parts.length > 1) {
      const subdomain = parts[0].toUpperCase();
      
      // Excluir dominios/subdominios de infraestructura base
      const ignoredSubdomains = ["WWW", "API", "LOCALHOST", "MAIL", "DEV", "PORTAL"];
      if (!ignoredSubdomains.includes(subdomain)) {
        const t = await db
          .select()
          .from(tenants)
          .where(and(eq(tenants.code, subdomain), isNull(tenants.deletedAt)))
          .limit(1)
          .then((r) => r[0]);
        if (t) return t;
      }
    }
  }

  return null;
}
