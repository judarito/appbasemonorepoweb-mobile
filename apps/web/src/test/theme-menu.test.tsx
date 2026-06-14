import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { ThemeSwitcher } from "../components/ThemeSwitcher";

describe("ThemeSwitcher Component Suite", () => {
  test("Debería renderizar icono Sun y aria-label correcto cuando el tema es dark", () => {
    const onToggleMock = vi.fn();
    render(<ThemeSwitcher theme="dark" onToggle={onToggleMock} />);

    const button = screen.getByRole("button", {
      name: /Cambiar a tema claro/i,
    });
    expect(button).toBeInTheDocument();
  });

  test("Debería renderizar icono Moon y aria-label correcto cuando el tema es light", () => {
    const onToggleMock = vi.fn();
    render(<ThemeSwitcher theme="light" onToggle={onToggleMock} />);

    const button = screen.getByRole("button", {
      name: /Cambiar a tema oscuro/i,
    });
    expect(button).toBeInTheDocument();
  });

  test("Debería disparar onToggle cuando el botón es clickeado", () => {
    const onToggleMock = vi.fn();
    render(<ThemeSwitcher theme="dark" onToggle={onToggleMock} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(onToggleMock).toHaveBeenCalledTimes(1);
  });
});
