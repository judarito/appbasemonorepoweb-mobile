import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { ProtectedRoute } from "../components/ProtectedRoute";

// 1. Mock de react-router-dom Navigate
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    Navigate: vi.fn(({ to }) => <div data-testid="navigate-mock" data-to={to}>Redirecting to {to}</div>),
  };
});

// 2. Mocks del Auth Store
let mockToken: string | null = null;
let mockUser: any = null;

vi.mock("../store/authStore", () => ({
  useAuthStore: () => ({
    token: mockToken,
    user: mockUser,
  }),
}));

describe("ProtectedRoute Component Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToken = null;
    mockUser = null;
  });

  test("Debería redirigir a /login si no hay token ni usuario", () => {
    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div data-testid="protected-content">Contenido Protegido</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    const redirectEl = screen.getByTestId("navigate-mock");
    expect(redirectEl).toBeInTheDocument();
    expect(redirectEl.getAttribute("data-to")).toBe("/login");
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  test("Debería mostrar Acceso Denegado si el usuario no es SUPER_ADMIN", () => {
    mockToken = "valid_user_token";
    mockUser = { id: "user-1", email: "member@local", roles: ["MEMBER"] };

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div data-testid="protected-content">Contenido Protegido</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText("Acceso Denegado")).toBeInTheDocument();
    expect(screen.getByText(/No tienes los privilegios de SUPER_ADMIN/i)).toBeInTheDocument();
    expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
  });

  test("Debería renderizar children si el usuario es SUPER_ADMIN", () => {
    mockToken = "valid_super_admin_token";
    mockUser = { id: "admin-1", email: "superadmin@local", roles: ["SUPER_ADMIN"] };

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div data-testid="protected-content">Contenido Protegido</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    expect(screen.getByText("Contenido Protegido")).toBeInTheDocument();
    expect(screen.queryByText("Acceso Denegado")).not.toBeInTheDocument();
  });
});
