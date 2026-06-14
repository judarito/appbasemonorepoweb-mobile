import type { Context } from "hono";
import { setCookie, getCookie, deleteCookie } from "hono/cookie";
import { AuthService } from "./auth.service";
import { loginSchema, refreshSchema } from "./auth.schema";
import { ValidationError, UnauthorizedError } from "../../common/errors";

export class AuthController {
  private service = new AuthService();

  login = async (c: Context) => {
    const body = await c.req.json().catch(() => ({}));
    
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Los datos enviados no son válidos.", parsed.error.issues);
    }

    // Obtener IP y User Agent del request
    const ipAddress = c.req.header("x-forwarded-for") || c.req.header("x-real-ip");
    const userAgent = c.req.header("user-agent");

    const result = await this.service.login({
      ...parsed.data,
      ipAddress,
      userAgent,
    });

    // Establecer refresh token como cookie HttpOnly segura
    setCookie(c, "refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production" || env.NODE_ENV === "staging",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60, // 7 días en segundos
      path: "/",
    });

    return c.json({
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user,
        tenantId: result.tenantId,
      },
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  refresh = async (c: Context) => {
    // Buscar el refresh token en las cookies o en el body de la petición
    let refreshToken = getCookie(c, "refresh_token");
    
    if (!refreshToken) {
      const body = await c.req.json().catch(() => ({}));
      const parsed = refreshSchema.safeParse(body);
      if (parsed.success && parsed.data.refreshToken) {
        refreshToken = parsed.data.refreshToken;
      }
    }

    if (!refreshToken) {
      throw new UnauthorizedError("Token de refresco requerido.");
    }

    const result = await this.service.rotateRefreshToken(refreshToken);

    // Establecer nuevo refresh token rotado en la cookie
    setCookie(c, "refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production" || env.NODE_ENV === "staging",
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return c.json({
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user,
        tenantId: result.tenantId,
      },
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };

  logout = async (c: Context) => {
    // El middleware de autenticación requireAuth ya habrá inyectado el sessionId en el context
    const session = c.get("session" as any);
    const user = c.get("user" as any);
    
    if (session && session.id) {
      await this.service.logout(session.id, user?.id);
    }

    deleteCookie(c, "refresh_token");

    return c.json({
      success: true,
      data: {
        message: "Sesión cerrada exitosamente.",
      },
      meta: null,
      traceId: c.get("traceId" as any),
    });
  };
}

// Para evitar problemas con imports circulares o accesos directos
import { env } from "../../config/env";
