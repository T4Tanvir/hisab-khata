/**
 * An expected, user-facing error. The global error handler returns its
 * message and status to the client; any other error is logged and hidden.
 */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly status: 400 | 401 | 403 | 404 | 409 = 400,
    public readonly code = 'BAD_REQUEST'
  ) {
    super(message);
    this.name = 'AppError';
  }
}
