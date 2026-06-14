import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Limpiar el DOM después de cada prueba
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Mock de matchMedia (requerido por algunas librerías UI o componentes responsivos)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecado
    removeListener: vi.fn(), // Deprecado
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
