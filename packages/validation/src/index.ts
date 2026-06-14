import { z } from "zod";

// --- ESQUEMAS DE AUTENTICACIÓN ---
export const loginSchema = z.object({
  email: z.string().email({ message: "Formato de email inválido." }),
  password: z.string().min(1, { message: "La contraseña es requerida." }),
  tenantId: z.string().uuid().optional(),
  accessChannel: z.enum(["WEB", "MOBILE", "DESKTOP", "API"]).default("WEB"),
  deviceName: z.string().optional(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Formato de email inválido." }),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, { message: "El token de recuperación es requerido." }),
  password: z.string().min(8, { message: "La nueva contraseña debe tener al menos 8 caracteres." }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// --- ESQUEMAS DE USUARIOS ---
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

export const updateNotificationPreferencesSchema = z.object({
  emailEnabled: z.boolean({ required_error: "emailEnabled es requerido." }),
  pushEnabled: z.boolean({ required_error: "pushEnabled es requerido." }),
  inAppEnabled: z.boolean({ required_error: "inAppEnabled es requerido." }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type AssignRolesInput = z.infer<typeof assignRolesSchema>;
export type UpdateNotificationPreferencesInput = z.infer<typeof updateNotificationPreferencesSchema>;

// --- ESQUEMAS DE ARCHIVOS ---
export const uploadFileSchema = z.object({
  visibility: z.enum(["PRIVATE", "TENANT", "PUBLIC"]).default("PRIVATE"),
});

export type UploadFileInput = z.infer<typeof uploadFileSchema>;


