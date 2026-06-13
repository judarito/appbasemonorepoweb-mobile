import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email({ message: "Formato de email inválido." }),
  password: z.string().min(8, { message: "La contraseña debe tener al menos 8 caracteres." }),
  firstName: z.string().min(1, { message: "El nombre es requerido." }),
  lastName: z.string().min(1, { message: "El apellido es requerido." }),
  displayName: z.string().optional(),
  phone: z.string().optional(),
  locale: z.string().default("es-CO"),
  timezone: z.string().default("America/Bogota"),
  roleId: z.string().uuid({ message: "El ID de rol debe ser un UUID válido." }).optional(),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1, { message: "El nombre no puede estar vacío." }).optional(),
  lastName: z.string().min(1, { message: "El apellido no puede estar vacío." }).optional(),
  displayName: z.string().optional(),
  phone: z.string().optional(),
  locale: z.string().optional(),
  timezone: z.string().optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(["ACTIVE", "DISABLED"], {
    errorMap: () => ({ message: "El estado debe ser ACTIVE o DISABLED." }),
  }),
});

export const assignRolesSchema = z.object({
  roleIds: z
    .array(z.string().uuid("Cada ID de rol debe ser un UUID válido."))
    .min(1, "Debe seleccionar al menos un rol para el usuario."),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type AssignRolesInput = z.infer<typeof assignRolesSchema>;
