import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Response {
    success: (_data?: unknown, _message?: string, _statusCode?: number) => Response;
    created: (_data?: unknown, _message?: string) => Response;
    fail: (_message: string, _statusCode?: number, _details?: unknown) => Response;
  }
}

export {};
