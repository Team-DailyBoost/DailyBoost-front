export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    usedFallback?: boolean;
    reason?: string;
  };
}

