/**
 * 에러 처리 유틸리티
 * 일관된 에러 처리 및 사용자 친화적 메시지 제공
 */
import { Alert } from 'react-native';

/**
 * 에러 타입 정의
 */
export interface AppError {
  message: string;
  code?: string;
  status?: number;
  originalError?: unknown;
}

/**
 * 에러를 사용자 친화적 메시지로 변환
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    if (err.message && typeof err.message === 'string') {
      return err.message;
    }
    if (err.error && typeof err.error === 'string') {
      return err.error;
    }
  }
  
  return '알 수 없는 오류가 발생했습니다.';
}

/**
 * 네트워크 에러인지 확인
 */
export function isNetworkError(error: unknown): boolean {
  const message = getErrorMessage(error);
  return (
    message.includes('Network request failed') ||
    message.includes('Failed to fetch') ||
    message.includes('서버에 연결할 수 없습니다') ||
    message.includes('timeout') ||
    message.includes('타임아웃')
  );
}

/**
 * 인증 에러인지 확인
 */
export function isAuthError(error: unknown): boolean {
  const message = getErrorMessage(error);
  return (
    message.includes('인증') ||
    message.includes('로그인') ||
    message.includes('Unauthorized') ||
    message.includes('Forbidden') ||
    message.includes('401') ||
    message.includes('403')
  );
}

/**
 * 에러를 AppError 형식으로 변환
 */
export function normalizeError(error: unknown): AppError {
  const message = getErrorMessage(error);
  
  let code: string | undefined;
  let status: number | undefined;
  
  if (typeof error === 'object' && error !== null) {
    const err = error as Record<string, unknown>;
    if (typeof err.code === 'string') {
      code = err.code;
    }
    if (typeof err.status === 'number') {
      status = err.status;
    } else if (err.response && typeof err.response === 'object') {
      const response = err.response as Record<string, unknown>;
      if (typeof response.status === 'number') {
        status = response.status;
      }
    }
  }
  
  return {
    message,
    code,
    status,
    originalError: error,
  };
}

/**
 * 에러를 Alert로 표시
 */
export function showErrorAlert(error: unknown, title = '오류'): void {
  const normalized = normalizeError(error);
  const message = normalized.message;
  
  Alert.alert(title, message, [{ text: '확인' }]);
}

/**
 * 에러를 콘솔에 로깅 (개발 환경에서만)
 */
export function logError(error: unknown, context?: string): void {
  const normalized = normalizeError(error);
  const prefix = context ? `[${context}]` : '';
  
  if (__DEV__) {
    console.error(`${prefix} 에러 발생:`, {
      message: normalized.message,
      code: normalized.code,
      status: normalized.status,
      originalError: normalized.originalError,
    });
  }
}

/**
 * 에러를 처리하고 사용자에게 표시
 */
export function handleError(error: unknown, context?: string, showAlert = true): AppError {
  const normalized = normalizeError(error);
  
  logError(error, context);
  
  if (showAlert) {
    showErrorAlert(normalized);
  }
  
  return normalized;
}

/**
 * 비동기 함수를 에러 핸들러로 래핑
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: string,
  showAlert = true,
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, context, showAlert);
      throw error;
    }
  }) as T;
}

