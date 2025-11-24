export interface NormalizedError {
  message: string;
  code?: string | number;
  status?: number;
  originalError?: unknown;
}

export function normalizeError(error: unknown): NormalizedError {
  if (error instanceof Error) {
    return {
      message: error.message,
      originalError: error,
    };
  }
  
  if (typeof error === 'string') {
    return { message: error };
  }
  
  if (error && typeof error === 'object') {
    const err = error as any;
    return {
      message: err.message || err.error || err.description || '알 수 없는 오류',
      code: err.code,
      status: err.status || err.statusCode,
      originalError: error,
    };
  }
  
  return { message: '알 수 없는 오류가 발생했습니다.' };
}

export function logError(error: unknown, context?: string): void {
  const normalized = normalizeError(error);
  if (__DEV__) {
    // 개발 모드에서만 에러 로깅 (필요시 활성화)
  }
}

export function handleError(error: unknown, context?: string): string {
  const normalized = normalizeError(error);
  logError(error, context);
  return normalized.message;
}
