import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import LoginView from "../views/LoginView";

// 1. Mocks de react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: { from: { pathname: "/superadmin/dashboard" } } }),
  };
});

// 2. Mocks de la API
vi.mock("../lib/api", () => ({
  api: {
    post: vi.fn(),
  },
}));

// 3. Mocks del Auth Store
const mockLogin = vi.fn();
let mockToken: string | null = null;
let mockUser: any = null;

vi.mock("../store/authStore", () => ({
  useAuthStore: () => ({
    login: mockLogin,
    token: mockToken,
    user: mockUser,
  }),
}));

import { api } from "../lib/api";

describe("LoginView Component Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToken = null;
    mockUser = null;
  });

  test("Debería renderizar todos los campos del formulario de login", () => {
    render(
      <MemoryRouter>
        <LoginView />
      </MemoryRouter>
    );

    expect(screen.getByPlaceholderText("superadmin@baseforge.local")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••••••")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Iniciar Sesión/i })).toBeInTheDocument();
  });

  test("Debería mostrar un mensaje de error si las credenciales fallan", async () => {
    const apiPostMock = api.post as any;
    apiPostMock.mockRejectedValueOnce(new Error("Credenciales inválidas."));

    render(
      <MemoryRouter>
        <LoginView />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText("superadmin@baseforge.local");
    const passwordInput = screen.getByPlaceholderText("••••••••••••");
    const submitBtn = screen.getByRole("button", { name: /Iniciar Sesión/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });
    fireEvent.click(submitBtn);

    // Esperar a que se muestre el spinner o texto de cargando
    expect(submitBtn).toBeDisabled();

    // Esperar a que la alerta de error esté en pantalla
    await waitFor(() => {
      expect(screen.getByText("Credenciales inválidas.")).toBeInTheDocument();
    });
    expect(submitBtn).not.toBeDisabled();
  });

  test("Debería llamar a login y redirigir ante credenciales correctas", async () => {
    const apiPostMock = api.post as any;
    apiPostMock.mockResolvedValueOnce({ accessToken: "valid_mock_jwt_token" });

    render(
      <MemoryRouter>
        <LoginView />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText("superadmin@baseforge.local");
    const passwordInput = screen.getByPlaceholderText("••••••••••••");
    const submitBtn = screen.getByRole("button", { name: /Iniciar Sesión/i });

    fireEvent.change(emailInput, { target: { value: "superadmin@baseforge.local" } });
    fireEvent.change(passwordInput, { target: { value: "CorrectPassword123!" } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalledWith("/auth/login", {
        email: "superadmin@baseforge.local",
        password: "CorrectPassword123!",
      });
      expect(mockLogin).toHaveBeenCalledWith("valid_mock_jwt_token");
    });
  });

  test("Debería redirigir automáticamente si el usuario ya está autenticado", () => {
    mockToken = "already_logged_in_token";
    mockUser = { id: "1", email: "admin@local", roles: ["SUPER_ADMIN"] };

    render(
      <MemoryRouter>
        <LoginView />
      </MemoryRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith("/superadmin/dashboard", { replace: true });
  });
});
