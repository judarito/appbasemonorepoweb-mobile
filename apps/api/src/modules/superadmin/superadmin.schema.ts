import { z } from "zod";

export const createTenantSchema = z.object({
  code: z.string().min(2, "El código debe tener al menos 2 caracteres.").max(50),
  slug: z.string().min(2, "El slug debe tener al menos 2 caracteres.").max(50),
  displayName: z.string().min(2, "El nombre comercial debe tener al menos 2 caracteres.").max(150),
  legalName: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  countryCode: z.string().length(2, "El código de país debe tener exactamente 2 caracteres.").default("CO"),
  currencyCode: z.string().length(3, "El código de moneda debe tener exactamente 3 caracteres.").default("COP"),
  timezone: z.string().default("America/Bogota"),
  locale: z.string().default("es-CO"),
  planId: z.string().uuid("El ID de plan debe ser un UUID válido."),
  adminEmail: z.string().email("El correo electrónico del administrador no es válido."),
  adminPassword: z.string().min(6, "La contraseña del administrador debe tener al menos 6 caracteres."),
});

export const updateTenantSchema = z.object({
  displayName: z.string().min(2, "El nombre comercial debe tener al menos 2 caracteres.").max(150).optional(),
  legalName: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  countryCode: z.string().length(2).optional(),
  currencyCode: z.string().length(3).optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
});

export const tenantStatusSchema = z.object({
  status: z.enum(["PENDING", "TRIAL", "ACTIVE", "SUSPENDED", "CANCELED", "ARCHIVED"], {
    errorMap: () => ({ message: "El estado de tenant no es válido." }),
  }),
});

export const supportSessionSchema = z.object({
  tenantId: z.string().uuid("El ID de tenant debe ser un UUID válido."),
  durationMinutes: z.number().int().min(5).max(1440).default(60),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type TenantStatusInput = z.infer<typeof tenantStatusSchema>;
export type SupportSessionInput = z.infer<typeof supportSessionSchema>;
