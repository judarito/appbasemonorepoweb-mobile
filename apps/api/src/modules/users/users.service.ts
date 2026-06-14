import { UsersRepository } from "./users.repository";
import type { CreateUserInput, UpdateUserInput } from "./users.schema";
import { ConflictError, NotFoundError, ForbiddenError } from "../../common/errors";
import { auditService } from "../../common/audit.service";
import { db } from "../../database/db";
import { roles, userRoles } from "../../database/schema";
import { eq, and, isNull } from "drizzle-orm";

export class UsersService {
  private repository = new UsersRepository();

  private sanitizeUser(user: any) {
    if (!user) return null;
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  async getUserById(id: string, tenantId: string | null) {
    const user = await this.repository.findById(id, tenantId);
    if (!user) {
      throw new NotFoundError(`Usuario con ID '${id}' no encontrado.`);
    }
    return this.sanitizeUser(user);
  }

  async getUsers(
    tenantId: string | null,
    page: number,
    pageSize: number,
    filters: { search?: string; status?: string; roleId?: string; orderBy?: string; orderDirection?: "asc" | "desc" } = {}
  ) {
    const [users, totalItems] = await Promise.all([
      this.repository.findMany(tenantId, page, pageSize, filters),
      this.repository.count(tenantId, filters),
    ]);

    return {
      items: users.map(this.sanitizeUser),
      totalItems,
    };
  }

  async createUser(tenantId: string | null, data: CreateUserInput) {
    const passwordHash = await Bun.password.hash(data.password, {
      algorithm: "argon2id",
      memoryCost: 65536,
      timeCost: 3,
    });

    if (!tenantId) {
      // Creación global (fuera de un tenant, p. ej., Superadmin creando otro usuario plataforma global)
      const existing = await this.repository.findByEmail(data.email);
      if (existing) {
        throw new ConflictError(`El correo electrónico '${data.email}' ya está registrado.`);
      }

      const user = await this.repository.createGlobal({
        ...data,
        passwordHash,
      });
      return this.sanitizeUser(user);
    }

    // Creación en contexto Multitenant
    // 1. Resolver rol por defecto del tenant si no se suministra roleId
    let targetRoleId = data.roleId;
    if (!targetRoleId) {
      const defaultRole = await db
        .select()
        .from(roles)
        .where(
          and(
            eq(roles.tenantId, tenantId),
            eq(roles.isDefault, true),
            isNull(roles.deletedAt)
          )
        )
        .limit(1)
        .then((res) => res[0]);

      if (defaultRole) {
        targetRoleId = defaultRole.id;
      } else {
        // Fallback al rol del sistema TENANT_USER de ese tenant
        const systemUserRole = await db
          .select()
          .from(roles)
          .where(
            and(
              eq(roles.tenantId, tenantId),
              eq(roles.code, "TENANT_USER"),
              isNull(roles.deletedAt)
            )
          )
          .limit(1)
          .then((res) => res[0]);

        if (!systemUserRole) {
          throw new ConflictError("No se pudo determinar el rol por defecto del inquilino.");
        }
        targetRoleId = systemUserRole.id;
      }
    } else {
      // Validar que el roleId suministrado pertenezca al tenant actual
      const roleExists = await db
        .select()
        .from(roles)
        .where(
          and(
            eq(roles.id, targetRoleId),
            eq(roles.tenantId, tenantId),
            isNull(roles.deletedAt)
          )
        )
        .limit(1)
        .then((res) => res[0]);

      if (!roleExists) {
        throw new NotFoundError(`El rol con ID '${targetRoleId}' no existe en este inquilino.`);
      }
    }

    try {
      const user = await this.repository.createInTenant(tenantId, {
        ...data,
        passwordHash,
        roleId: targetRoleId,
        defaultRoleId: targetRoleId,
      });
      const sanitized = this.sanitizeUser(user);
      auditService.log({
        tenantId,
        action: "USER_CREATE",
        entityType: "USER",
        entityId: user?.id,
        result: "SUCCESS",
        afterData: sanitized,
      });
      return sanitized;
    } catch (err: any) {
      if (err.message === "MEMBER_ALREADY_EXISTS") {
        throw new ConflictError(`El usuario ya es miembro activo de este inquilino.`);
      }
      throw err;
    }
  }

  async updateUser(id: string, tenantId: string | null, data: UpdateUserInput, actorUserId?: string) {
    const before = await this.getUserById(id, tenantId);
    const user = await this.repository.update(id, tenantId, data);
    const sanitized = this.sanitizeUser(user);
    auditService.log({
      tenantId,
      actorUserId: actorUserId ?? null,
      action: "USER_UPDATE",
      entityType: "USER",
      entityId: id,
      result: "SUCCESS",
      beforeData: before,
      afterData: sanitized,
    });
    return sanitized;
  }

  async deleteUser(id: string, tenantId: string | null) {
    const user = await this.getUserById(id, tenantId); // Valida existencia

    // Salvaguarda: si estamos borrando al usuario, y es en contexto de tenant,
    // validar que no sea el último administrador activo
    if (tenantId) {
      const isAdmin = await db
        .select()
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(
          and(
            eq(userRoles.userId, id),
            eq(userRoles.tenantId, tenantId),
            eq(roles.code, "TENANT_ADMIN"),
            isNull(userRoles.revokedAt)
          )
        )
        .limit(1)
        .then((res) => res.length > 0);

      if (isAdmin) {
        const activeAdminsCount = await this.repository.countActiveTenantAdmins(tenantId);
        if (activeAdminsCount <= 1) {
          throw new ForbiddenError(
            "No se puede eliminar al usuario porque es el único administrador activo en este inquilino."
          );
        }
      }
    }

    const deleted = await this.repository.delete(id, tenantId);
    const sanitized = this.sanitizeUser(deleted);
    auditService.log({
      tenantId,
      action: "USER_DELETE",
      entityType: "USER",
      entityId: id,
      result: "SUCCESS",
      beforeData: { id },
    });
    return sanitized;
  }

  async updateStatus(id: string, tenantId: string | null, status: "ACTIVE" | "DISABLED", actorUserId: string) {
    await this.getUserById(id, tenantId); // Valida existencia

    if (tenantId) {
      // Validar si intentan desactivar al último administrador
      if (status === "DISABLED") {
        const isAdmin = await db
          .select()
          .from(userRoles)
          .innerJoin(roles, eq(userRoles.roleId, roles.id))
          .where(
            and(
              eq(userRoles.userId, id),
              eq(userRoles.tenantId, tenantId),
              eq(roles.code, "TENANT_ADMIN"),
              isNull(userRoles.revokedAt)
            )
          )
          .limit(1)
          .then((res) => res.length > 0);

        if (isAdmin) {
          const activeAdminsCount = await this.repository.countActiveTenantAdmins(tenantId);
          if (activeAdminsCount <= 1) {
            throw new ForbiddenError(
              "No se puede desactivar al usuario porque es el único administrador activo en este inquilino."
            );
          }
        }
      }

      await this.repository.updateMembershipStatus(id, tenantId, status);
      // Revocar sesiones si es desactivado
      if (status === "DISABLED") {
        await this.repository.revokeUserSessions(id, tenantId);
      }
    } else {
      await this.repository.updatePlatformStatus(id, status);
      if (status === "DISABLED") {
        await this.repository.revokeUserSessions(id, null);
      }
    }

    return await this.getUserById(id, tenantId);
  }

  async getUserSessions(id: string, tenantId: string | null) {
    await this.getUserById(id, tenantId); // Valida existencia
    return await this.repository.getUserSessions(id, tenantId);
  }

  async revokeUserSessions(id: string, tenantId: string | null) {
    await this.getUserById(id, tenantId); // Valida existencia
    await this.repository.revokeUserSessions(id, tenantId);
    return { success: true };
  }

  async assignRoles(id: string, tenantId: string, roleIds: string[], actorUserId: string) {
    await this.getUserById(id, tenantId); // Valida existencia

    // 1. Validar que todos los roles seleccionados pertenezcan a este tenant
    const validRoles = await db
      .select({ id: roles.id, code: roles.code })
      .from(roles)
      .where(
        and(
          eq(roles.tenantId, tenantId),
          isNull(roles.deletedAt)
        )
      );

    const validRoleIds = validRoles.map((r) => r.id);
    const allValid = roleIds.every((rId) => validRoleIds.includes(rId));
    if (!allValid) {
      throw new NotFoundError("Uno o más roles seleccionados no existen en este inquilino.");
    }

    // 2. Salvaguarda: si el usuario actualmente es TENANT_ADMIN
    const wasAdmin = await db
      .select()
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(
        and(
          eq(userRoles.userId, id),
          eq(userRoles.tenantId, tenantId),
          eq(roles.code, "TENANT_ADMIN"),
          isNull(userRoles.revokedAt)
        )
      )
      .limit(1)
      .then((res) => res.length > 0);

    if (wasAdmin) {
      // Verificar si el nuevo listado de roles no incluye TENANT_ADMIN
      const newRoles = validRoles.filter((r) => roleIds.includes(r.id));
      const willBeAdmin = newRoles.some((r) => r.code === "TENANT_ADMIN");

      if (!willBeAdmin) {
        const activeAdminsCount = await this.repository.countActiveTenantAdmins(tenantId);
        if (activeAdminsCount <= 1) {
          throw new ForbiddenError(
            "No se puede revocar el rol de administrador porque este usuario es el único administrador activo en este inquilino."
          );
        }
      }
    }

    await this.repository.assignUserRoles(id, tenantId, roleIds);
    return { success: true };
  }
}
