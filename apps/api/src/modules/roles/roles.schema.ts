import { z } from "zod";

export const createRoleSchema = z.object({
  code: z
    .string()
    .min(2, "El código del rol debe tener al menos 2 caracteres.")
    .max(50, "El código del rol no puede superar los 50 caracteres.")
    .regex(/^[A-Z0-9_]+$/, "El código del rol debe estar en mayúsculas y solo contener letras, números o guiones bajos (ej: INVENTORY_ADMIN)."),
  name: z
    .string()
    .min(2, "El nombre del rol debe tener al menos 2 caracteres.")
    .max(150, "El nombre del rol no puede superar los 150 caracteres."),
  description: z
    .string()
    .max(500, "La descripción del rol no puede superar los 500 caracteres.")
    .optional(),
  permissionIds: z
    .array(z.string().uuid("Cada ID de permiso debe ser un UUID válido."))
    .default([]),
  menuIds: z
    .array(z.string().uuid("Cada ID de menú debe ser un UUID válido."))
    .default([]),
});

export const updateRoleSchema = z.object({
  name: z
    .string()
    .min(2, "El nombre del rol debe tener al menos 2 caracteres.")
    .max(150, "El nombre del rol no puede superar los 150 caracteres.")
    .optional(),
  description: z
    .string()
    .max(500, "La descripción del rol no puede superar los 500 caracteres.")
    .optional(),
  permissionIds: z
    .array(z.string().uuid("Cada ID de permiso debe ser un UUID válido."))
    .optional(),
  menuIds: z
    .array(z.string().uuid("Cada ID de menú debe ser un UUID válido."))
    .optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
