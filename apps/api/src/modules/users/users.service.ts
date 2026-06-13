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

  async getUserById(id: string) {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundError(`Usuario con ID '${id}' no encontrado.`);
    }
    return this.sanitizeUser(user);
  }

  async getUsers(page: number, pageSize: number) {
    const [users, totalItems] = await Promise.all([
      this.repository.findMany(page, pageSize),
      this.repository.count(),
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

    // Hashear la contraseña usando la API de seguridad nativa de Bun
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

  async updateUser(id: string, data: UpdateUserInput) {
    await this.getUserById(id); // Valida que exista

    const user = await this.repository.update(id, data);
    return this.sanitizeUser(user);
  }

  async deleteUser(id: string) {
    await this.getUserById(id); // Valida que exista

    const user = await this.repository.delete(id);
    return this.sanitizeUser(user);
  }
}
