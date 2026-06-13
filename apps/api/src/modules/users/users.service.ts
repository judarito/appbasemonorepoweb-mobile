import { UsersRepository } from "./users.repository";
import type { CreateUserInput, UpdateUserInput } from "./users.schema";
import { ConflictError, NotFoundError } from "../../common/errors";

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

  async getUsers(tenantId: string | null, page: number, pageSize: number) {
    const [users, totalItems] = await Promise.all([
      this.repository.findMany(tenantId, page, pageSize),
      this.repository.count(tenantId),
    ]);

    return {
      items: users.map(this.sanitizeUser),
      totalItems,
    };
  }

  async createUser(data: CreateUserInput) {
    const existing = await this.repository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError(`El correo electrónico '${data.email}' ya está registrado.`);
    }

    const passwordHash = await Bun.password.hash(data.password, {
      algorithm: "argon2id",
      memoryCost: 65536,
      timeCost: 3,
    });

    const user = await this.repository.create({
      ...data,
      passwordHash,
    });

    return this.sanitizeUser(user);
  }

  async updateUser(id: string, tenantId: string | null, data: UpdateUserInput) {
    await this.getUserById(id, tenantId); // Valida que exista en el contexto del tenant

    const user = await this.repository.update(id, tenantId, data);
    return this.sanitizeUser(user);
  }

  async deleteUser(id: string, tenantId: string | null) {
    await this.getUserById(id, tenantId); // Valida que exista en el contexto del tenant

    const user = await this.repository.delete(id, tenantId);
    return this.sanitizeUser(user);
  }
}
