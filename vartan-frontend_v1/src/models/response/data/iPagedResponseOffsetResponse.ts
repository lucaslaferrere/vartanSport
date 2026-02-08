export interface IPagedResponseOffsetResponse<T> {
    pageNumber: number;
    pageSize: number;
    totalRecords: number;
    lastPage: number;
    data: T[];
}