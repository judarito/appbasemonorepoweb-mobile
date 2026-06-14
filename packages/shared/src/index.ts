// Tipos y respuestas unificadas de la API
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedData<T> {
  items: T[];
  totalItems: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Entidades DTO compartidas
export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName?: string;
  phone?: string;
  locale: string;
  timezone: string;
  status: "ACTIVE" | "DISABLED";
  roles: string[];
}

export interface RoleDto {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
}

export interface NotificationDto {
  id: string;
  tenantId: string;
  recipientUserId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, any>;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  readAt: string | null;
  archivedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface FileDto {
  id: string;
  tenantId: string;
  uploadedBy: string | null;
  storageProvider: string;
  bucket: string | null;
  objectKey: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  checksumSha256: string | null;
  visibility: "PRIVATE" | "TENANT" | "PUBLIC";
  status: "PENDING" | "ACTIVE" | "QUARANTINED" | "DELETED";
  url?: string;
  createdAt: string;
  updatedAt: string;
}

