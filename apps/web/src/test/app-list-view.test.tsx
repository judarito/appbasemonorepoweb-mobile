import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { AppListView } from "../components/AppListView";
import type { ColumnDefinition } from "../components/AppListView.types";

interface TestItem {
  id: string;
  name: string;
  role: string;
}

const columns: ColumnDefinition<TestItem>[] = [
  { key: "name", header: "Nombre", sortable: true },
  { key: "role", header: "Rol", sortable: false },
];

describe("AppListView Component Suite", () => {
  let mockFetcher: any;
  const mockItems: TestItem[] = [
    { id: "1", name: "Alice", role: "Developer" },
    { id: "2", name: "Bob", role: "Designer" },
  ];

  beforeEach(() => {
    mockFetcher = vi.fn().mockResolvedValue({
      items: mockItems,
      totalItems: 2,
    });
  });

  test("Debería renderizar título, columnas y registros obtenidos del fetcher", async () => {
    render(
      <AppListView
        title="Test List"
        fetcher={mockFetcher}
        columns={columns}
      />
    );

    // Debe mostrar cargando inicialmente (skeleton/spinner)
    expect(screen.getByText("Test List")).toBeInTheDocument();

    // Esperar que carguen los datos
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
      expect(screen.getByText("Developer")).toBeInTheDocument();
      expect(screen.getByText("Designer")).toBeInTheDocument();
    });

    expect(mockFetcher).toHaveBeenCalled();
  });

  test("Debería llamar al fetcher con parámetros de búsqueda cuando el input cambia", async () => {
    render(
      <AppListView
        title="Test List"
        fetcher={mockFetcher}
        columns={columns}
        searchPlaceholder="Buscar test"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Buscar test");
    fireEvent.change(searchInput, { target: { value: "Alice" } });

    // Esperar debounce (400ms) más tiempo de resolución
    await waitFor(() => {
      expect(mockFetcher).toHaveBeenLastCalledWith(expect.objectContaining({
        search: "Alice",
      }));
    }, { timeout: 1000 });
  });

  test("Debería llamar al fetcher con parámetros de ordenamiento al presionar el encabezado", async () => {
    render(
      <AppListView
        title="Test List"
        fetcher={mockFetcher}
        columns={columns}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    const nameHeader = screen.getByText("Nombre");
    fireEvent.click(nameHeader);

    // Debe llamar con sortBy name y asc direction
    await waitFor(() => {
      expect(mockFetcher).toHaveBeenLastCalledWith(expect.objectContaining({
        sortBy: "name",
        sortDirection: "asc",
      }));
    });

    // Clic de nuevo para cambiar dirección
    fireEvent.click(nameHeader);
    await waitFor(() => {
      expect(mockFetcher).toHaveBeenLastCalledWith(expect.objectContaining({
        sortBy: "name",
        sortDirection: "desc",
      }));
    });
  });

  test("Debería permitir selección múltiple y activar acciones en masa (Bulk)", async () => {
    const bulkActionMock = vi.fn();
    render(
      <AppListView
        title="Test List"
        fetcher={mockFetcher}
        columns={columns}
        bulkActions={[
          {
            label: "Eliminar",
            onClick: bulkActionMock,
            variant: "danger",
          },
        ]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    // Encontrar checkboxes
    const rows = screen.getAllByRole("row");
    // Fila 0 es header. Filas 1 y 2 son los items.
    const aliceCheckbox = rows[1].querySelector(".app-list-cell-checkbox");
    expect(aliceCheckbox).toBeDefined();

    fireEvent.click(aliceCheckbox!);

    // Debe aparecer botón bulk
    const deleteBulkBtn = screen.getByRole("button", { name: /Eliminar/i });
    expect(deleteBulkBtn).toBeInTheDocument();

    fireEvent.click(deleteBulkBtn);
    expect(bulkActionMock).toHaveBeenCalledWith([mockItems[0]]);
  });
});
