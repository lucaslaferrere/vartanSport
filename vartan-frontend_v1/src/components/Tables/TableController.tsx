import { useEffect, useState } from "react";
import { IPagedResponseOffsetResponse } from "@models/response/data/iPagedResponseOffsetResponse";
import { ColumnDef, PaginationState, SortingState, Updater } from "@tanstack/react-table";
import TableServerSide from "@components/Tables/TableServerSide";
import { PermissionType } from "@models/enums/PermissionType";

export default function TableController<T, TQueryParams>({
    searchFn,
    data,
    columns,
    actions = [],
    defaultFilters = [],
    hidePagination = false,
    hideFilters = false
}: {
    searchFn: (args: TQueryParams) => void;
    data: IPagedResponseOffsetResponse<T> | undefined;
    columns: ColumnDef<T>[]
    actions: {
        icon: string;
        color: string;
        onClick?: (row: T) => void;
        getLink?: (row: T) => string;
        disabled?: boolean | ((row: T) => boolean);
        permissions?: PermissionType[];
        tooltip?: string;
    }[],
    defaultFilters: {
        key: string;
        value: string | number | boolean | undefined;
    }[],
    hidePagination?: boolean;
    hideFilters?: boolean;
}) {
    const [paginationState, setPaginationState] = useState({
        pageIndex: 0,
        pageSize: 10,
    });
    const [filters, setFilters] = useState<{
        key: string;
        value: string | number | boolean | undefined;
    }[]>([]);
    const [sorting, setSorting] = useState<SortingState>([]);

    const handleSearch = (pageIndex: number, pageSize: number, params: {
        key: string;
        value: string | number | boolean | undefined;
    }[]) => {
        const ps: Record<string, string | number | boolean | undefined> = {
            page: pageIndex,
            pageSize: pageSize,
        };

        for (const p of params) ps[p.key] = p.value;

        const s = sorting[0];
        if (s) {
            ps["sortBy"] = s.id;
            ps["sortDir"] = s.desc ? "desc" : "asc";
        }
        searchFn(ps as TQueryParams);
    }

    const handlePaginationChange = (pagination: Updater<PaginationState>) => {
        setPaginationState(prev => {
            const newPagination = typeof pagination === "function" ? pagination(prev) : pagination;
            return newPagination.pageIndex === prev.pageIndex && newPagination.pageSize === prev.pageSize
                ? prev
                : newPagination;
        });
    };

    const handleFilterChange = (columnId: string, value: string | number | boolean | undefined) => {
        setFilters(prevFilters => {
            const index = prevFilters.findIndex(f => f.key === columnId);
            const newFilters = [...prevFilters];
            if (index === -1) {
                newFilters.push({ key: columnId, value });
            } else {
                newFilters[index] = { key: columnId, value };
            }
            return newFilters;
        });

        setPaginationState(prev => ({ ...prev, pageIndex: 0 }));
    };

    const refresh = () => {
        const f = [...defaultFilters, ...filters];
        handleSearch(paginationState.pageIndex + 1, paginationState.pageSize, f);
    };
    
    useEffect(() => {
        setPaginationState((p) => ({ ...p, pageIndex: 0 }));
    }, [sorting]);

    useEffect(() => {
        const f = [...defaultFilters, ...filters];

        handleSearch(paginationState.pageIndex + 1, paginationState.pageSize, f);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, paginationState, defaultFilters, sorting]);

    return (
        <TableServerSide
            data={data?.data ?? []}
            columns={columns}
            pagination={paginationState}
            onPaginationChange={handlePaginationChange}
            rowCount={data?.totalRecords ?? 0}
            actions={actions}
            filters={filters}
            onFilterChange={handleFilterChange}
            sorting={sorting}
            onSortingChange={setSorting}
            onRefresh={refresh}
            hidePagination={hidePagination}
            hideFilters={hideFilters}
        />
    );
}