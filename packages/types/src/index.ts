export type Identifier = string;

export interface ApiResponse<T> {
  data: T;
  timestamp: string;
}

