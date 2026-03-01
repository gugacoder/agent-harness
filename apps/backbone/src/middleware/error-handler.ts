import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";
import type { AppType } from "../types.js";

/**
 * Global error handler — catches unhandled errors and returns a
 * standard JSON response: { error, message, statusCode }.
 *
 * Handles:
 *   - ZodError (validation) → 400 with field-level details
 *   - HTTPException (Hono)  → uses its status code
 *   - Everything else        → 500 with generic message
 */
export const errorHandler: ErrorHandler<AppType> = (err, c) => {
  // Zod validation errors → 400
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      path: e.path.join("."),
      message: e.message,
    }));

    return c.json(
      {
        error: "Bad Request",
        message: "Validation failed",
        statusCode: 400,
        details,
      },
      400
    );
  }

  // Hono HTTPException → preserve status
  if (err instanceof HTTPException) {
    const status = err.status;
    return c.json(
      {
        error: err.message || "Error",
        message: err.message,
        statusCode: status,
      },
      status
    );
  }

  // Unhandled errors → 500
  console.error("Unhandled error:", err);
  return c.json(
    {
      error: "Internal Server Error",
      message: "An unexpected error occurred",
      statusCode: 500,
    },
    500
  );
};
