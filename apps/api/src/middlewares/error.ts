import type { ErrorHandler } from "hono";
import { logger } from "./logger";

export const errorHandler = (): ErrorHandler => {
  return (err, c) => {
    const traceId = (c.get("traceId") as string) || crypto.randomUUID();

    logger.error({
      traceId,
      err,
      msg: `[Error] ${err.message}`,
    });

    let status = 500;
    let code = "INTERNAL_SERVER_ERROR";
    let message = "Ocurrió un error inesperado en el servidor.";
    let details: unknown[] = [];

    if (err.name === "ZodError" || (err as any).issues) {
      status = 400;
      code = "VALIDATION_ERROR";
      message = "Los datos enviados no son válidos.";
      details = (err as any).issues || [];
    }

    return c.json(
      {
        success: false,
        error: {
          code,
          message,
          details,
        },
        traceId,
      },
      status as any
    );
  };
};
