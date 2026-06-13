import { create } from "zustand";

export interface UserSession {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
}

interface AuthState {
  token: string | null;
  user: UserSession | null;
  impersonatedToken: string | null;
  impersonatedTenantId: string | null;
  login: (token: string) => void;
  logout: () => void;
  startImpersonation: (supportToken: string, tenantId: string) => void;
  stopImpersonation: () => void;
  getEffectiveToken: () => string | null;
}

function parseJwt(token: string): any {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

const TOKEN_KEY = "bf_token";
const IMP_TOKEN_KEY = "bf_imp_token";
const IMP_TENANT_KEY = "bf_imp_tenant";

const initialToken = localStorage.getItem(TOKEN_KEY);
const initialImpToken = localStorage.getItem(IMP_TOKEN_KEY);
const initialImpTenant = localStorage.getItem(IMP_TENANT_KEY);

let initialUser: UserSession | null = null;
if (initialToken) {
  const parsed = parseJwt(initialToken);
  if (parsed && parsed.exp * 1000 > Date.now()) {
    initialUser = {
      id: parsed.sub,
      email: parsed.email || "",
      roles: parsed.roles || [],
      permissions: parsed.permissions || [],
    };
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: initialToken && initialUser ? initialToken : null,
  user: initialUser,
  impersonatedToken: initialImpToken,
  impersonatedTenantId: initialImpTenant,

  login: (token) => {
    const parsed = parseJwt(token);
    if (!parsed) return;

    localStorage.setItem(TOKEN_KEY, token);
    set({
      token,
      user: {
        id: parsed.sub,
        email: parsed.email || "",
        roles: parsed.roles || [],
        permissions: parsed.permissions || [],
      },
    });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(IMP_TOKEN_KEY);
    localStorage.removeItem(IMP_TENANT_KEY);
    set({
      token: null,
      user: null,
      impersonatedToken: null,
      impersonatedTenantId: null,
    });
  },

  startImpersonation: (supportToken, tenantId) => {
    localStorage.setItem(IMP_TOKEN_KEY, supportToken);
    localStorage.setItem(IMP_TENANT_KEY, tenantId);
    set({
      impersonatedToken: supportToken,
      impersonatedTenantId: tenantId,
    });
  },

  stopImpersonation: () => {
    localStorage.removeItem(IMP_TOKEN_KEY);
    localStorage.removeItem(IMP_TENANT_KEY);
    set({
      impersonatedToken: null,
      impersonatedTenantId: null,
    });
  },

  getEffectiveToken: () => {
    const { impersonatedToken, token } = get();
    return impersonatedToken || token;
  },
}));
