export interface IPagedResponseOffsetResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}