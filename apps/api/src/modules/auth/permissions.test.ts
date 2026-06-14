import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { app } from "../../main";
import { createTestContext, createUserHelper, createTenantHelper, createTenantUserMembership, generateAuthToken, cleanUpTestEntities } from "../../common/test-helpers";

describe("Authorization and Permissions Middleware Suite", () => {
  const ctx = createTestContext();
  let normalUser: any;
  let superadminUser: any;
  let privilegedUser: any;
  let tenant: any;

  beforeAll(async () => {
    tenant = await createTenantHelper(ctx, "PERM_TEST");
    normalUser = await createUserHelper(ctx, "normal_user");
    superadminUser = await createUserHelper(ctx, "superadmin_user");
    privilegedUser = await createUserHelper(ctx, "privileged_user");

    // Crear membresías para que pase el tenantContext middleware
    await createTenantUserMembership(tenant.id, normalUser.id);
    await createTenantUserMembership(tenant.id, privilegedUser.id);
  });

  afterAll(async () => {
    await cleanUpTestEntities(ctx);
  });

  test("Debería rechazar acceso a una ruta protegida si no hay cabecera Authorization", async () => {
    const res = await app.request("/api/v1/users");
    expect(res.status).toBe(401);
  });

  test("Debería denegar acceso a rutas de superadmin para un usuario común", async () => {
    // Generar token para usuario común sin el rol SUPER_ADMIN
    const token = await generateAuthToken(normalUser.id, tenant.id, ["MEMBER"], []);
    const res = await app.request("/api/v1/superadmin/tenants", {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("FORBIDDEN");
  });

  test("Debería permitir acceso a rutas de superadmin para un usuario con rol SUPER_ADMIN", async () => {
    const token = await generateAuthToken(superadminUser.id, null, ["SUPER_ADMIN"], []);
    const res = await app.request("/api/v1/superadmin/tenants", {
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });

    // No debería dar 403 ni 401
    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(401);
  });

  test("Debería denegar acceso a una ruta que requiere permiso si el usuario no lo posee", async () => {
    // Intentar leer usuarios sin tener el permiso 'users.read'
    const token = await generateAuthToken(normalUser.id, tenant.id, ["MEMBER"], ["some.other.permission"]);
    const res = await app.request("/api/v1/users", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "x-tenant-id": tenant.id,
      },
    });

    expect(res.status).toBe(403);
  });

  test("Debería permitir acceso a una ruta que requiere permiso si el usuario lo posee", async () => {
    // Con permiso 'users.read'
    const token = await generateAuthToken(privilegedUser.id, tenant.id, ["MEMBER"], ["users.read"]);
    const res = await app.request("/api/v1/users", {
      headers: {
        "Authorization": `Bearer ${token}`,
        "x-tenant-id": tenant.id,
      },
    });

    expect(res.status).toBe(200);
  });
});
