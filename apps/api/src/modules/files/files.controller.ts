import type { Context } from "hono";
import { FilesService } from "./files.service";
import { ForbiddenError, ValidationError } from "../../common/errors";
import { parsePaginationParams, buildPaginationMeta } from "../../common/utils/query";

export class FilesController {
  private service = new FilesService();

  uploadFile = async (c: Context) => {
    const user = c.get("user" as any);
    const tenantId = c.get("tenantId" as any) as string | null;
    if (!tenantId) {
      throw new ForbiddenError("El contexto de inquilino es requerido para subir archivos.");
    }

    const body = await c.req.parseBody();
    const file = body["file"] as File | undefined;
    const visibility = (body["visibility"] as "PRIVATE" | "TENANT" | "PUBLIC" | undefined) || "PRIVATE";

    if (!file || !(file instanceof File)) {
      throw new ValidationError("No se ha proporcionado un archivo válido.");
    }

    if (!["PRIVATE", "TENANT", "PUBLIC"].includes(visibility)) {
      throw new ValidationError("La visibilidad proporcionada no es válida.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await this.service.uploadFile(
      tenantId,
      user.id,
      file.name,
      file.type || "application/octet-stream",
      buffer,
      visibility
    );

    return c.json({
      success: true,
      data: result,
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  getFile = async (c: Context) => {
    const tenantId = c.get("tenantId" as any) as string | null;
    if (!tenantId) {
      throw new ForbiddenError("El contexto de inquilino es requerido.");
    }

    const id = c.req.param("id");
    const result = await this.service.getFile(tenantId, id);

    return c.json({
      success: true,
      data: result,
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  deleteFile = async (c: Context) => {
    const user = c.get("user" as any);
    const tenantId = c.get("tenantId" as any) as string | null;
    if (!tenantId) {
      throw new ForbiddenError("El contexto de inquilino es requerido.");
    }

    const id = c.req.param("id");
    await this.service.deleteFile(tenantId, user.id, id);

    return c.json({
      success: true,
      data: { id },
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  listFiles = async (c: Context) => {
    const tenantId = c.get("tenantId" as any) as string | null;
    if (!tenantId) {
      throw new ForbiddenError("El contexto de inquilino es requerido.");
    }

    const { page, pageSize } = parsePaginationParams(c);
    const { items, totalItems } = await this.service.listFiles(tenantId, page, pageSize);

    return c.json({
      success: true,
      data: {
        items,
        totalItems,
      },
      meta: buildPaginationMeta(page, pageSize, totalItems),
      traceId: c.get("traceId" as any),
    });
  };

  localDownload = async (c: Context) => {
    const bucket = c.req.query("bucket");
    const key = c.req.query("key");

    if (!bucket || !key) {
      return c.text("Parámetros 'bucket' y 'key' son requeridos.", 400);
    }

    const { LocalStorageProvider } = require("./storage/local.provider");
    const provider = new LocalStorageProvider();
    
    try {
      const buffer = await provider.downloadFile(bucket, key);
      return c.body(buffer);
    } catch (err) {
      return c.text("Archivo no encontrado", 404);
    }
  };
}
