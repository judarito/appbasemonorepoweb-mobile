import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { app } from "../../main";
import { db } from "../../database/db";
import { files } from "../../database/schema";
import { eq } from "drizzle-orm";
import { FilesService } from "../files/files.service";
import {
  createTestContext,
  createUserHelper,
  createTenantHelper,
  createTenantUserMembership,
  generateAuthToken,
  cleanUpTestEntities,
} from "../../common/test-helpers";

describe("Multi-Tenant Isolation Suite", () => {
  const ctx = createTestContext();
  const filesService = new FilesService();

  let userA: any;
  let tenantA: any;
  let userB: any;
  let tenantB: any;

  let fileAId: string;
  let fileBId: string;

  beforeAll(async () => {
    // 1. Crear Tenants
    tenantA = await createTenantHelper(ctx, "TENANT_A");
    tenantB = await createTenantHelper(ctx, "TENANT_B");

    // 2. Crear Usuarios
    userA = await createUserHelper(ctx, "user_a");
    userB = await createUserHelper(ctx, "user_b");

    // 3. Crear Membresías
    await createTenantUserMembership(tenantA.id, userA.id);
    await createTenantUserMembership(tenantB.id, userB.id);

    // 4. Subir archivos de prueba directamente usando el servicio
    const fileContentA = Buffer.from("Contenido de Tenant A");
    const docA = await filesService.uploadFile(
      tenantA.id,
      userA.id,
      "doc_a.txt",
      "text/plain",
      fileContentA,
      "PRIVATE"
    );
    fileAId = docA.id;

    const fileContentB = Buffer.from("Contenido de Tenant B");
    const docB = await filesService.uploadFile(
      tenantB.id,
      userB.id,
      "doc_b.txt",
      "text/plain",
      fileContentB,
      "PRIVATE"
    );
    fileBId = docB.id;
  });

  afterAll(async () => {
    // Limpiar archivos creados físicamente/lógicamente
    if (fileAId) {
      await db.delete(files).where(eq(files.id, fileAId));
    }
    if (fileBId) {
      await db.delete(files).where(eq(files.id, fileBId));
    }
    await cleanUpTestEntities(ctx);
  });

  test("Usuario A debería listar únicamente archivos de Tenant A", async () => {
    const tokenA = await generateAuthToken(userA.id, tenantA.id, ["MEMBER"], ["files.read"]);
    const res = await app.request("/api/v1/files", {
      headers: {
        "Authorization": `Bearer ${tokenA}`,
      },
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    
    // Todos los archivos listados deben pertenecer a Tenant A
    const items = json.data.items;
    expect(items.length).toBeGreaterThan(0);
    for (const file of items) {
      expect(file.tenantId).toBe(tenantA.id);
      expect(file.tenantId).not.toBe(tenantB.id);
    }
  });

  test("Usuario A no debería poder ver detalles de un archivo de Tenant B", async () => {
    const tokenA = await generateAuthToken(userA.id, tenantA.id, ["MEMBER"], ["files.read"]);
    const res = await app.request(`/api/v1/files/${fileBId}`, {
      headers: {
        "Authorization": `Bearer ${tokenA}`,
      },
    });

    // Debe retornar 404 ya que el scope del archivo está limitado al tenant del usuario
    expect(res.status).toBe(404);
  });

  test("Usuario A no debería poder borrar un archivo de Tenant B", async () => {
    const tokenA = await generateAuthToken(userA.id, tenantA.id, ["MEMBER"], ["files.delete"]);
    const res = await app.request(`/api/v1/files/${fileBId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${tokenA}`,
      },
    });

    expect(res.status).toBe(404);

    // Verificar en DB que el archivo de B sigue estando activo (no borrado)
    const dbRecord = await db
      .select()
      .from(files)
      .where(eq(files.id, fileBId))
      .then((res) => res[0]);
    expect(dbRecord.status).toBe("ACTIVE");
  });

  test("Usuario A no debería poder suplantar al Tenant B enviando x-tenant-id en cabecera", async () => {
    const tokenA = await generateAuthToken(userA.id, tenantA.id, ["MEMBER"], ["files.read"]);
    const res = await app.request("/api/v1/files", {
      headers: {
        "Authorization": `Bearer ${tokenA}`,
        "x-tenant-id": tenantB.id, // Suplantación no autorizada
      },
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    const items = json.data.items;
    
    // A pesar de la cabecera, la respuesta solo debe incluir archivos de Tenant A
    for (const file of items) {
      expect(file.tenantId).toBe(tenantA.id);
      expect(file.tenantId).not.toBe(tenantB.id);
    }
  });
});
