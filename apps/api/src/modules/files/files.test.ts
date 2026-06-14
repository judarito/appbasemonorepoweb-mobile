import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { db } from "../../database/db";
import { platformUsers, tenants, files } from "../../database/schema";
import { eq } from "drizzle-orm";
import { FilesService } from "./files.service";
import { NotFoundError } from "../../common/errors";

describe("FilesService", () => {
  const service = new FilesService();
  const testEmail = "temp_files_test@baseforge.local";
  let testUserId: string;
  let testTenantId: string;

  const secondaryEmail = "temp_secondary_test@baseforge.local";
  let secondaryUserId: string;
  let secondaryTenantId: string;

  beforeAll(async () => {
    await db.delete(platformUsers).where(eq(platformUsers.email, testEmail));
    await db.delete(platformUsers).where(eq(platformUsers.email, secondaryEmail));
    await db.delete(tenants).where(eq(tenants.code, "FILES_TEST_TENANT"));
    await db.delete(tenants).where(eq(tenants.code, "FILES_SEC_TENANT"));

    const [tenant] = await db
      .insert(tenants)
      .values({
        code: "FILES_TEST_TENANT",
        slug: "files-test-tenant",
        displayName: "Files Test Tenant",
      })
      .returning();
    testTenantId = tenant.id;

    const [user] = await db
      .insert(platformUsers)
      .values({
        email: testEmail,
        passwordHash: "dummyhash",
        firstName: "File",
        lastName: "Owner",
        status: "ACTIVE",
      })
      .returning();
    testUserId = user.id;

    const [secTenant] = await db
      .insert(tenants)
      .values({
        code: "FILES_SEC_TENANT",
        slug: "files-sec-tenant",
        displayName: "Secondary Files Tenant",
      })
      .returning();
    secondaryTenantId = secTenant.id;

    const [secUser] = await db
      .insert(platformUsers)
      .values({
        email: secondaryEmail,
        passwordHash: "dummyhash",
        firstName: "Secondary",
        lastName: "User",
        status: "ACTIVE",
      })
      .returning();
    secondaryUserId = secUser.id;
  });

  afterAll(async () => {
    if (testUserId) {
      await db.delete(platformUsers).where(eq(platformUsers.id, testUserId));
    }
    if (secondaryUserId) {
      await db.delete(platformUsers).where(eq(platformUsers.id, secondaryUserId));
    }
    if (testTenantId) {
      await db.delete(tenants).where(eq(tenants.id, testTenantId));
    }
    if (secondaryTenantId) {
      await db.delete(tenants).where(eq(tenants.id, secondaryTenantId));
    }
  });

  test("Debería subir un archivo privado con éxito", async () => {
    const fileContent = Buffer.from("Hola, este es un archivo de prueba para almacenamiento seguro.");
    const originalName = "test_document.txt";
    const mimeType = "text/plain";

    const result = await service.uploadFile(
      testTenantId,
      testUserId,
      originalName,
      mimeType,
      fileContent,
      "PRIVATE"
    );

    expect(result.id).toBeDefined();
    expect(result.originalName).toBe(originalName);
    expect(result.mimeType).toBe(mimeType);
    expect(result.sizeBytes).toBe(fileContent.length);
    expect(result.visibility).toBe("PRIVATE");
    expect(result.status).toBe("ACTIVE");
    expect(result.url).toBeDefined();
    expect(result.url).toContain("local-download");
  });

  test("Debería subir un archivo público con éxito", async () => {
    const fileContent = Buffer.from("Contenido público");
    const originalName = "public_doc.txt";
    const mimeType = "text/plain";

    const result = await service.uploadFile(
      testTenantId,
      testUserId,
      originalName,
      mimeType,
      fileContent,
      "PUBLIC"
    );

    expect(result.id).toBeDefined();
    expect(result.visibility).toBe("PUBLIC");
    expect(result.url).toBeDefined();
    expect(result.url).toContain("local-download");
  });

  test("Debería retornar listado de archivos activos del tenant", async () => {
    const list = await service.listFiles(testTenantId, 1, 10);
    expect(list.items.length).toBeGreaterThanOrEqual(2);
    expect(list.totalItems).toBeGreaterThanOrEqual(2);
    expect(list.items[0].tenantId).toBe(testTenantId);
  });

  test("No debería listar archivos de otro tenant (aislamiento)", async () => {
    const list = await service.listFiles(secondaryTenantId, 1, 10);
    expect(list.items.length).toBe(0);
  });

  test("No debería permitir descargar un archivo de otro tenant", async () => {
    const fileContent = Buffer.from("Archivo altamente confidencial");
    const doc = await service.uploadFile(
      testTenantId,
      testUserId,
      "confidential.txt",
      "text/plain",
      fileContent,
      "PRIVATE"
    );

    expect(service.getFile(secondaryTenantId, doc.id)).rejects.toThrow(NotFoundError);
  });

  test("Debería realizar soft-delete de archivo físico y lógico", async () => {
    const fileContent = Buffer.from("Eliminar este contenido");
    const doc = await service.uploadFile(
      testTenantId,
      testUserId,
      "to_delete.txt",
      "text/plain",
      fileContent,
      "PRIVATE"
    );

    await service.deleteFile(testTenantId, testUserId, doc.id);

    expect(service.getFile(testTenantId, doc.id)).rejects.toThrow(NotFoundError);

    const dbRecord = await db
      .select()
      .from(files)
      .where(eq(files.id, doc.id))
      .then((res) => res[0]);

    expect(dbRecord.status).toBe("DELETED");
    expect(dbRecord.deletedAt).toBeDefined();
    expect(dbRecord.deletedBy).toBe(testUserId);
  });
});
