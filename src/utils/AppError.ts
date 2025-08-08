class AppError extends Error {
  public statusCode: number;
  public status: string;
  public details: object | null;

  constructor(message: string, statusCode: number, details: object | null = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
