export const openapiSpec = {
  openapi: "3.0.0",
  info: {
    title: "BaseForge SaaS API",
    version: "1.0.0",
    description: "Documentación oficial interactiva de la API de BaseForge SaaS",
  },
  servers: [
    {
      url: "http://localhost:3000/api/v1",
      description: "Servidor de Desarrollo Local",
    },
  ],
  paths: {
    "/health": {
      get: {
        summary: "Estado de Salud de la API",
        description: "Comprueba el estado de salud rápido del servidor API.",
        responses: {
          200: {
            description: "Servidor activo",
          },
        },
      },
    },
    "/ready": {
      get: {
        summary: "Listo para Recibir Conexiones",
        description: "Valida que el servidor y los servicios como la base de datos estén listos.",
        responses: {
          200: {
            description: "Listo para operar",
          },
        },
      },
    },
    "/users": {
      get: {
        summary: "Listar Usuarios de la Plataforma",
        description: "Retorna un listado paginado con la información pública de los usuarios.",
        parameters: [
          {
            name: "page",
            in: "query",
            description: "Número de página (mínimo 1)",
            required: false,
            schema: { type: "integer", default: 1 },
          },
          {
            name: "pageSize",
            in: "query",
            description: "Elementos por página (máximo 100)",
            required: false,
            schema: { type: "integer", default: 20 },
          },
        ],
        responses: {
          200: {
            description: "Listado devuelto con éxito",
          },
        },
      },
      post: {
        summary: "Crear Nuevo Usuario",
        description: "Crea y encripta las credenciales de un nuevo usuario en el sistema.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "firstName", "lastName"],
                properties: {
                  email: { type: "string", format: "email", example: "juan@example.com" },
                  password: { type: "string", example: "securePass123" },
                  firstName: { type: "string", example: "Juan" },
                  lastName: { type: "string", example: "Pérez" },
                  displayName: { type: "string", example: "Juan Pérez" },
                  phone: { type: "string", example: "+573000000000" },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: "Usuario registrado con éxito",
          },
        },
      },
    },
    "/users/{id}": {
      get: {
        summary: "Obtener Usuario por ID",
        description: "Obtiene la información pública detallada de un usuario por su ID único.",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "UUID del usuario",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          200: {
            description: "Usuario retornado con éxito",
          },
        },
      },
      patch: {
        summary: "Actualizar Usuario por ID",
        description: "Actualiza los campos permitidos del perfil de un usuario.",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "UUID del usuario",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  firstName: { type: "string", example: "Juan Modificado" },
                  lastName: { type: "string", example: "Pérez" },
                  displayName: { type: "string", example: "Juan Modificado" },
                  phone: { type: "string", example: "+573000000000" },
                  status: { type: "string", enum: ["ACTIVE", "LOCKED", "SUSPENDED", "DISABLED"], example: "ACTIVE" },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: "Usuario actualizado con éxito",
          },
        },
      },
      delete: {
        summary: "Eliminar Usuario",
        description: "Desactiva y realiza la eliminación lógica de un usuario.",
        parameters: [
          {
            name: "id",
            in: "path",
            description: "UUID del usuario",
            required: true,
            schema: { type: "string", format: "uuid" },
          },
        ],
        responses: {
          200: {
            description: "Usuario eliminado lógicamente con éxito",
          },
        },
      },
    },
  },
};
