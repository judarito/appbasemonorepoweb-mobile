import { ApiResponse, PaginatedData, PaginationParams, UserDto, RoleDto, NotificationDto } from "@baseforge/shared";
import { LoginInput, ForgotPasswordInput, ResetPasswordInput } from "@baseforge/validation";

export interface ApiClientConfig {
  baseURL: string;
  getToken: () => string | null | Promise<string | null>;
  getRefreshToken: () => string | null | Promise<string | null>;
  onTokenRefresh?: (accessToken: string, refreshToken: string) => void | Promise<void>;
  onAuthError?: () => void | Promise<void>;
}

export class ApiClient {
  private baseURL: string;
  private getToken: () => string | null | Promise<string | null>;
  private getRefreshToken: () => string | null | Promise<string | null>;
  private onTokenRefresh?: (accessToken: string, refreshToken: string) => void | Promise<void>;
  private onAuthError?: () => void | Promise<void>;

  // Cola coordinada para evitar múltiples refresh simultáneos
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL.replace(/\/$/, "");
    this.getToken = config.getToken;
    this.getRefreshToken = config.getRefreshToken;
    this.onTokenRefresh = config.onTokenRefresh;
    this.onAuthError = config.onAuthError;
  }

  private subscribeTokenRefresh(cb: (token: string) => void) {
    this.refreshSubscribers.push(cb);
  }

  private onRefreshed(token: string) {
    this.refreshSubscribers.forEach((cb) => cb(token));
    this.refreshSubscribers = [];
  }

  // Petición HTTP base con interceptor y reintento en error 401
  async request<T = any>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}/${path.replace(/^\//, "")}`;
    const token = await this.getToken();

    const headers = new Headers(options.headers);
    if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
      headers.set("Content-Type", "application/json");
    }
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const fetchOptions: RequestInit = {
      ...options,
      headers,
    };

    let response = await fetch(url, fetchOptions);

    // Si la respuesta es 401 Unauthorized, intentar refrescar el token
    if (response.status === 401) {
      try {
        const newAccessToken = await this.handleTokenRefresh();
        
        // Actualizar la cabecera de la petición original con el nuevo token
        headers.set("Authorization", `Bearer ${newAccessToken}`);
        response = await fetch(url, fetchOptions);
      } catch (err) {
        if (this.onAuthError) {
          await this.onAuthError();
        }
        throw new Error("Sesión expirada.");
      }
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Error en el servidor");
    }

    return data;
  }

  // Manejo unificado de renovación coordinada de tokens
  private async handleTokenRefresh(): Promise<string> {
    if (this.isRefreshing) {
      return new Promise<string>((resolve) => {
        this.subscribeTokenRefresh((token) => {
          resolve(token);
        });
      });
    }

    this.isRefreshing = true;

    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) throw new Error("No hay refresh token.");

      const res = await fetch(`${this.baseURL}/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error("No se pudo refrescar el token.");
      }

      const { accessToken: newAccess, refreshToken: newRefresh } = resData.data;

      if (this.onTokenRefresh) {
        await this.onTokenRefresh(newAccess, newRefresh);
      }

      this.onRefreshed(newAccess);
      return newAccess;
    } catch (error) {
      this.refreshSubscribers = [];
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  // --- MÓDULO DE AUTENTICACIÓN ---
  auth = {
    login: async (input: LoginInput) => {
      return this.request<any>("auth/login", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    forgotPassword: async (input: ForgotPasswordInput) => {
      return this.request<any>("auth/forgot-password", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    resetPassword: async (input: ResetPasswordInput) => {
      return this.request<any>("auth/reset-password", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    logout: async () => {
      return this.request<any>("auth/logout", {
        method: "POST",
      });
    },
  };

  // --- MÓDULO DE USUARIOS ---
  users = {
    list: async (params?: PaginationParams) => {
      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined) query.append(key, val.toString());
        });
      }
      return this.request<PaginatedData<UserDto>>(`users?${query.toString()}`);
    },
    get: async (id: string) => {
      return this.request<UserDto>(`users/${id}`);
    },
    create: async (input: any) => {
      return this.request<UserDto>("users", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    update: async (id: string, input: any) => {
      return this.request<UserDto>(`users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
    },
    delete: async (id: string) => {
      return this.request<any>(`users/${id}`, {
        method: "DELETE",
      });
    },
  };

  // --- MÓDULO DE ROLES ---
  roles = {
    list: async () => {
      return this.request<RoleDto[]>("roles");
    },
  };

  // --- MÓDULO DE NOTIFICACIONES ---
  notifications = {
    list: async (params?: PaginationParams) => {
      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined) query.append(key, val.toString());
        });
      }
      return this.request<PaginatedData<NotificationDto>>(`notifications?${query.toString()}`);
    },
    markAsRead: async (id: string) => {
      return this.request<NotificationDto>(`notifications/${id}/read`, {
        method: "PATCH",
      });
    },
    markAllAsRead: async () => {
      return this.request<any>("notifications/read-all", {
        method: "POST",
      });
    },
    getPreferences: async () => {
      return this.request<any>("notifications/preferences");
    },
    updatePreferences: async (preferences: { emailEnabled: boolean; pushEnabled: boolean; inAppEnabled: boolean }) => {
      return this.request<any>("notifications/preferences", {
        method: "PUT",
        body: JSON.stringify(preferences),
      });
    },
  };

  files = {
    upload: async (file: File | Blob, originalFileName?: string, visibility: "PRIVATE" | "TENANT" | "PUBLIC" = "PRIVATE") => {
      const formData = new FormData();
      formData.append("file", file, originalFileName);
      formData.append("visibility", visibility);
      return this.request<any>("files/upload", {
        method: "POST",
        body: formData,
      });
    },
    list: async (params?: PaginationParams) => {
      const query = new URLSearchParams();
      if (params?.page) query.append("page", String(params.page));
      if (params?.limit) query.append("pageSize", String(params.limit));
      const queryString = query.toString() ? `?${query.toString()}` : "";
      return this.request<PaginatedData<any>>(`files${queryString}`);
    },
    get: async (id: string) => {
      return this.request<any>(`files/${id}`);
    },
    delete: async (id: string) => {
      return this.request<any>(`files/${id}`, {
        method: "DELETE",
      });
    },
  };
}

