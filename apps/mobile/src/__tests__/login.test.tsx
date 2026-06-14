import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { Alert } from "react-native";
import Login from "../../app/(auth)/login";

// Mock Auth Context
const mockLogin = jest.fn();
jest.mock("../../src/context/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

// Mock Router
const mockReplace = jest.fn();
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
  }),
}));

// Espiar Alert.alert
const alertSpy = jest.spyOn(Alert, "alert");

describe("Mobile Login Screen Component Suite", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  test("Debería renderizar todos los campos e iniciar sesión", () => {
    const { getByPlaceholderText, getByText } = render(<Login />);

    expect(getByPlaceholderText("nombre@ejemplo.com")).toBeTruthy();
    expect(getByPlaceholderText("••••••••••••")).toBeTruthy();
    expect(getByText("Entrar")).toBeTruthy();
  });

  test("Debería alertar si los campos están vacíos al intentar entrar", async () => {
    const { getByText } = render(<Login />);
    const button = getByText("Entrar");

    fireEvent.press(button);

    expect(alertSpy).toHaveBeenCalledWith(
      "Campos requeridos",
      "Por favor ingresa tu correo y contraseña."
    );
  });

  test("Debería llamar al endpoint /auth/login y luego a la función login al recibir éxito", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          accessToken: "mock-jwt-mobile",
          user: { id: "user-123", email: "mobile@local" },
        },
      }),
    });

    const { getByPlaceholderText, getByText } = render(<Login />);
    const emailInput = getByPlaceholderText("nombre@ejemplo.com");
    const passwordInput = getByPlaceholderText("••••••••••••");
    const button = getByText("Entrar");

    fireEvent.changeText(emailInput, "mobile@local");
    fireEvent.changeText(passwordInput, "MyPassword123!");
    fireEvent.press(button);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:3000/api/v1/auth/login",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            email: "mobile@local",
            password: "MyPassword123!",
            accessChannel: "MOBILE",
          }),
        })
      );
      expect(mockLogin).toHaveBeenCalledWith("mock-jwt-mobile", {
        id: "user-123",
        email: "mobile@local",
      });
    });
  });

  test("Debería alertar error si las credenciales son incorrectas", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        message: "Clave errónea",
      }),
    });

    const { getByPlaceholderText, getByText } = render(<Login />);
    const emailInput = getByPlaceholderText("nombre@ejemplo.com");
    const passwordInput = getByPlaceholderText("••••••••••••");
    const button = getByText("Entrar");

    fireEvent.changeText(emailInput, "mobile@local");
    fireEvent.changeText(passwordInput, "wrongpwd");
    fireEvent.press(button);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Error de autenticación", "Clave errónea");
    });
  });
});
