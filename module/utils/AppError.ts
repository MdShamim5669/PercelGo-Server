class AppError extends Error {
  public status: number;
  public isOperational: boolean;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
