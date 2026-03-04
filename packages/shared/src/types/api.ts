export interface ApiSuccess<T> {
  data: T;
}

export interface ApiError {
  code: string;
  message: string;
  detail?: unknown;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
}
