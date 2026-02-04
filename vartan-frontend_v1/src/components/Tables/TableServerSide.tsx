import React from "react";
import ScrollX from "@components/ScrollX";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    PaginationState,
    useReactTable,
    OnChangeFn,
    SortingState,
} from "@tanstack/react-table";
import {
    Stack, Table, TableBody,
    TableCell,
    TableHead,
    TableRow,
    TableSortLabel,
    Tooltip,
} from "@mui/material";
import TablePagination from "./TablePagination";
import IconButton from "@mui/material/IconButton";
import TableNoData from "@components/Tables/TableNoData";
import TableFilter from "@components/Tables/Filters/TableFilter";
import NextLink from "next/link";
import { PermissionType } from "@models/enums/PermissionType";
import PermissionValidator from "../Validators/PermissionValidator";

interface ReactTableProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    pagination: PaginationState;
    onPaginationChange: OnChangeFn<PaginationState>;
    rowCount: number;
    hidePagination?: boolean;
    hideFilters?: boolean;
    actions: {
        icon: string;
        color: string;
        onClick?: (row: T) => void;
        getLink?: (row: T) => string;
        disabled?: boolean | ((row: T) => boolean);
        permissions?: PermissionType[];
        tooltip?: string;
    }[],
    filters: { key: string, value: string | number | boolean | undefined }[];
    onFilterChange: (columnId: string, value: string | number | boolean | undefined) => void;
    sorting: SortingState;
    onSortingChange: OnChangeFn<SortingState>;
    onRefresh: () => void;
}

export default function TableServerSide<T>(
    {
        data,
        columns,
        pagination,
        onPaginationChange,
        rowCount,
        actions = [],
        filters,
        onFilterChange,
        sorting,
        onSortingChange,
        onRefresh,
        hidePagination = false,
        hideFilters = false
    }: ReactTableProps<T>
) {
    const table = useReactTable({
        data,
        columns,
        state: { pagination, sorting },
        onPaginationChange,
        onSortingChange,
        rowCount,
        manualFiltering: true,
        manualPagination: true,
        manualSorting: true,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <ScrollX>
            <Stack>
                <Table size={"small"}>
                    <TableHead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    const sorted = header.column.getIsSorted();
                                    const direction = sorted === "asc" ? "asc" : sorted === "desc" ? "desc" : undefined;

                                    return (
                                        <TableCell
                                            key={header.id}
                                            colSpan={header.colSpan}
                                            align={header.column.columnDef.meta?.align || "left"}
                                        >
                                            {header.column.columnDef.enableSorting ? (
                                                <TableSortLabel
                                                    active={!!sorted}
                                                    direction={direction ?? "asc"}
                                                    hideSortIcon={false}
                                                    onClick={header.column.getToggleSortingHandler()}
                                                >
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                </TableSortLabel>
                                            ) : (
                                                flexRender(header.column.columnDef.header, header.getContext())
                                            )}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))}
                        {!hideFilters && table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={`filters-${headerGroup.id}`}>
                                {headerGroup.headers.map((header) => {
                                    if (header.column.getCanFilter() && header.column.columnDef.meta?.filterVariant) {
                                        return (
                                            <TableCell key={`filter-${header.id}`}>
                                                <TableFilter
                                                    column={header.column}
                                                    filters={filters}
                                                    onFilterChange={onFilterChange}
                                                />
                                            </TableCell>
                                        )
                                    } else {
                                        return (
                                            <TableCell key={`filter-${header.id}`} colSpan={header.colSpan} />
                                        );
                                    }
                                })}
                            </TableRow>
                        ))}
                    </TableHead>
                    <TableBody>
                        {table.getRowModel().rows.length > 0
                            ? table.getRowModel().rows.map((row) => {
                                return (
                                    <TableRow key={row.id}>
                                        {row.getVisibleCells().map((cell) => {
                                            if (cell.column.id === "actions") {
                                                return (
                                                    <TableCell key={cell.id}
                                                        align={cell.column.columnDef.meta?.align || "left"}>
                                                        {actions
                                                            .filter(action => {
                                                                if (typeof action.disabled === "function") {
                                                                    return !action.disabled(row.original);
                                                                }
                                                                return !action.disabled;
                                                            })
                                                            .map((action, index) => {
                                                                const component = () => {
                                                                    if (action.getLink) {
                                                                        return (
                                                                            <Tooltip key={index} title={action.tooltip || ""} arrow>
                                                                                <IconButton
                                                                                    sx={{ color: action.color }}
                                                                                    component={NextLink}
                                                                                    href={action.getLink(row.original)}
                                                                                >
                                                                                    <i className={action.icon} />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                        );
                                                                    } else if (action.onClick) {
                                                                        return (
                                                                            <Tooltip key={index} title={action.tooltip || ""} arrow>
                                                                                <IconButton
                                                                                    sx={{ color: action.color }}
                                                                                    onClick={() => action.onClick!(row.original)}
                                                                                >
                                                                                    <i className={action.icon} />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                        )
                                                                    } else {
                                                                        return null
                                                                    }
                                                                }

                                                                if (action.permissions) {
                                                                    return (
                                                                        <PermissionValidator
                                                                            key={index}
                                                                            permissions={action.permissions}
                                                                        >
                                                                            {component()}
                                                                        </PermissionValidator>
                                                                    );
                                                                }
                                                                return component();
                                                            })}
                                                    </TableCell>
                                                );
                                            }
                                            return (
                                                <TableCell key={cell.id}
                                                    align={cell.column.columnDef.meta?.align || "left"}>
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                );
                            })
                            : (
                                <TableNoData
                                    msg="No hay datos disponibles"
                                    colSpan={actions.length + columns.length}
                                />
                            )
                        }
                        {!hidePagination && (
                            <TableRow>
                                <TableCell sx={{ p: 2 }} colSpan={actions.length + columns.length}>
                                    <TablePagination
                                        gotoPage={table.setPageIndex}
                                        rowCount={rowCount}
                                        setPageSize={table.setPageSize}
                                        pageSize={table.getState().pagination.pageSize}
                                        pageIndex={table.getState().pagination.pageIndex}
                                        onRefresh={onRefresh}
                                    />
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Stack>
        </ScrollX>
    );
}
