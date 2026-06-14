import { RolesRepository } from "./roles.repository";
import type { CreateRoleInput, UpdateRoleInput } from "./roles.schema";
import { ConflictError, NotFoundError, ForbiddenError } from "../../common/errors";
import { auditService } from "../../common/audit.service";

export class RolesService {
  private repository = new RolesRepository();

  async getRoles(tenantId: string | null, page: number, pageSize: number) {
    const [items, totalItems] = await Promise.all([
      this.repository.findMany(tenantId, page, pageSize),
      this.repository.count(tenantId),
    ]);

    return {
      items,
      totalItems,
    };
  }

  async getRole(id: string, tenantId: string | null) {
    const role = await this.repository.findById(id, tenantId);
    if (!role) {
      throw new NotFoundError(`Rol con ID '${id}' no encontrado.`);
    }

    const [permissions, menuIds] = await Promise.all([
      this.repository.getRolePermissions(id),
      this.repository.getRoleMenus(id),
    ]);
    return {
      ...role,
      permissions,
      menuIds,
    };
  }

  async createRole(tenantId: string | null, data: CreateRoleInput, actorUserId?: string) {
    const existing = await this.repository.findByCode(data.code, tenantId);
    if (existing) {
      throw new ConflictError(`El código de rol '${data.code.toUpperCase()}' ya está registrado.`);
    }

    const role = await this.repository.create({
      ...data,
      tenantId,
    });

    auditService.log({
      tenantId,
      actorUserId: actorUserId ?? null,
      action: "ROLE_CREATE",
      entityType: "ROLE",
      entityId: role.id,
      result: "SUCCESS",
      afterData: { code: data.code, name: data.name },
    });

    return await this.getRole(role.id, tenantId);
  }

  async updateRole(id: string, tenantId: string | null, data: UpdateRoleInput, actorUserId?: string) {
    const existing = await this.repository.findById(id, tenantId);
    if (!existing) {
      throw new NotFoundError(`Rol con ID '${id}' no encontrado.`);
    }

    if (existing.code === "TENANT_ADMIN") {
      throw new ForbiddenError("No se permite modificar el rol Administrador del tenant (TENANT_ADMIN).");
    }

    await this.repository.update(id, tenantId, data);

    auditService.log({
      tenantId,
      actorUserId: actorUserId ?? null,
      action: "ROLE_UPDATE",
      entityType: "ROLE",
      entityId: id,
      result: "SUCCESS",
      beforeData: { name: existing.name, description: existing.description },
      afterData: { name: data.name, description: data.description },
    });

    return await this.getRole(id, tenantId);
  }

  async deleteRole(id: string, tenantId: string | null, actorUserId?: string) {
    const existing = await this.repository.findById(id, tenantId);
    if (!existing) {
      throw new NotFoundError(`Rol con ID '${id}' no encontrado.`);
    }

    if (existing.code === "TENANT_ADMIN") {
      throw new ForbiddenError("No se permite eliminar el rol Administrador del tenant (TENANT_ADMIN).");
    }

    const deletedRole = await this.repository.delete(id, tenantId);

    auditService.log({
      tenantId,
      actorUserId: actorUserId ?? null,
      action: "ROLE_DELETE",
      entityType: "ROLE",
      entityId: id,
      result: "SUCCESS",
      beforeData: { code: existing.code, name: existing.name },
    });

    return deletedRole;
  }
}
