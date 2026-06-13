export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details: any[];

  constructor(message: string, status: number = 500, code: string = "INTERNAL_SERVER_ERROR", details: any[] = []) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = "Los datos enviados no son válidos.", details: any[] = []) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "El recurso solicitado no fue encontrado.") {
    super(message, 404, "NOT_FOUND");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "No está autorizado para realizar esta acción.") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Acceso denegado a este recurso.") {
    super(message, 403, "FORBIDDEN");
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Conflicto con el estado actual del recurso.") {
    super(message, 409, "CONFLICT");
  }
}
