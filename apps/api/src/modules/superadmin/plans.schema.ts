import { z } from "zod";

export const createPlanSchema = z.object({
  code: z.string().min(2, "El código del plan debe tener al menos 2 caracteres.").max(50),
  name: z.string().min(2, "El nombre del plan debe tener al menos 2 caracteres.").max(150),
  description: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).default("ACTIVE"),
  billingCycle: z.enum(["FREE", "MONTHLY", "ANNUAL", "CUSTOM"]).default("MONTHLY"),
  price: z.union([z.string(), z.number()]).default("0"),
  currencyCode: z.string().length(3).default("COP"),
  trialDays: z.number().int().min(0).default(0),
  isPublic: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const updatePlanSchema = createPlanSchema.partial();

export const createFeatureSchema = z.object({
  code: z.string().min(2, "El código de característica debe tener al menos 2 caracteres.").max(50),
  name: z.string().min(2, "El nombre de característica debe tener al menos 2 caracteres.").max(150),
  description: z.string().optional().nullable(),
  valueType: z.enum(["BOOLEAN", "NUMBER", "STRING", "JSON"]).default("BOOLEAN"),
  defaultValue: z.any().optional().nullable(),
  isSystem: z.boolean().default(true),
});

export const updateFeatureSchema = createFeatureSchema.partial();

export const planFeatureItemSchema = z.object({
  featureId: z.string().uuid("El ID de feature debe ser un UUID válido."),
  enabled: z.boolean().default(true),
  value: z.any().optional().nullable(),
});

export const associatePlanFeaturesSchema = z.object({
  features: z.array(planFeatureItemSchema),
});

export const tenantFeatureOverrideItemSchema = z.object({
  featureId: z.string().uuid("El ID de feature debe ser un UUID válido."),
  enabled: z.boolean().default(true),
  value: z.any().optional().nullable(),
  validUntil: z.string().datetime({ message: "La fecha de validez debe ser un formato ISO válido." }).optional().nullable(),
});

export const overrideTenantFeaturesSchema = z.object({
  features: z.array(tenantFeatureOverrideItemSchema),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type CreateFeatureInput = z.infer<typeof createFeatureSchema>;
export type UpdateFeatureInput = z.infer<typeof updateFeatureSchema>;
export type AssociatePlanFeaturesInput = z.infer<typeof associatePlanFeaturesSchema>;
export type OverrideTenantFeaturesInput = z.infer<typeof overrideTenantFeaturesSchema>;
