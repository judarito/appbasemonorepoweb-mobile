import { z } from "zod";

export const createMenuSchema = z.object({
  parentId: z.string().uuid("El parentId debe ser un UUID válido.").optional().nullable(),
  code: z.string().min(1, "El código del menú es requerido."),
  label: z.string().min(1, "La etiqueta (label) es requerida."),
  description: z.string().optional().nullable(),
  route: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
  platform: z.enum(["WEB", "MOBILE", "BOTH"]).default("BOTH"),
  requiredPermissionId: z.string().uuid("El ID de permiso requerido debe ser un UUID válido.").optional().nullable(),
  requiredFeatureCode: z.string().optional().nullable(),
  isVisible: z.boolean().default(true),
  isActive: z.boolean().default(true),
  metadata: z.record(z.any()).default({}),
});

export const updateMenuSchema = z.object({
  parentId: z.string().uuid("El parentId debe ser un UUID válido.").optional().nullable(),
  code: z.string().min(1, "El código del menú no puede estar vacío.").optional(),
  label: z.string().min(1, "La etiqueta no puede estar vacía.").optional(),
  description: z.string().optional().nullable(),
  route: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  sortOrder: z.number().int().optional(),
  platform: z.enum(["WEB", "MOBILE", "BOTH"]).optional(),
  requiredPermissionId: z.string().uuid("El ID de permiso requerido debe ser un UUID válido.").optional().nullable(),
  requiredFeatureCode: z.string().optional().nullable(),
  isVisible: z.boolean().optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.any()).optional(),
});

export const associateRolesSchema = z.object({
  roleIds: z.array(z.string().uuid("Cada ID de rol debe ser un UUID válido.")),
});

export type CreateMenuInput = z.infer<typeof createMenuSchema>;
export type UpdateMenuInput = z.infer<typeof updateMenuSchema>;
export type AssociateRolesInput = z.infer<typeof associateRolesSchema>;
