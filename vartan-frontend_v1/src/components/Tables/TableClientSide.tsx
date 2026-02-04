import React, {useState} from "react";
import {
    ColumnDef,
    flexRender,
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    ColumnFiltersState,
    Updater
} from "@tanstack/react-table";
import {Box, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography} from "@mui/material";
import TablePagination from "./TablePagination";
import IconButton from "@mui/material/IconButton";
import TableNoData from "@components/Tables/TableNoData";
import TableFilter from "@components/Tables/Filters/TableFilter";
import NextLink from "next/link";
import ScrollX from "@components/ScrollX";
import {formatFilterDate} from "@utils/formatDate";

export const DEFAULT_PAGE_INDEX = 0;
export const DEFAULT_PAGE_SIZE = 10;

interface ReactTableProps<TData> {
    data: TData[];
    columns: ColumnDef<TData>[];
    title?: string;
    actions?: {
        icon: string;
        color: string;
        onClick?: (row: TData) => void;
        getLink?: (row: TData) => string;
        disabled?: boolean | ((row: TData) => boolean);
        tooltip?: string;
    }[];
    headerActions?: React.ReactNode;
    showFilters?: boolean;
}

export default function TableClientSide<TData>({
    data,
    columns,
    title,
    actions = [],
    headerActions,
    showFilters = true,
}: ReactTableProps<TData>) {
    const [pagination, setPagination] = useState({
        pageIndex: DEFAULT_PAGE_INDEX,
        pageSize: DEFAULT_PAGE_SIZE,
    });

    const [filters, setFilters] = useState<ColumnFiltersState>([])

    const handleFiltersChange = (filter: Updater<ColumnFiltersState>) => {
        setFilters(prev => {
            return typeof filter === "function" ? filter(prev) : filter;
        });
    };

    const table = useReactTable({
        data: data,
        columns,
        state: {
            pagination,
            columnFilters: filters
        },
        onPaginationChange: setPagination,
        onColumnFiltersChange: handleFiltersChange,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    // Verificar si hay columnas con filtros
    const hasFilters = columns.some(col => col.meta?.filterVariant);

    return (
        <Paper
            elevation={0}
            sx={{
                borderRadius: '12px',
                border: '1px solid #E5E7EB',
                bgcolor: '#FFFFFF',
                overflow: 'hidden',
            }}
        >
            {/* Header con título y acciones */}
            {(title || headerActions) && (
                <Box
                    sx={{
                        p: '16px 20px',
                        borderBottom: '1px solid #E5E7EB',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 2,
                    }}
                >
                    {title && (
                        <Typography
                            variant="h6"
                            sx={{
                                fontSize: '15px',
                                fontWeight: 600,
                                color: '#1F2937',
                            }}
                        >
                            {title}
                        </Typography>
                    )}
                    {headerActions && <Box sx={{ display: 'flex', gap: 1 }}>{headerActions}</Box>}
                </Box>
            )}

            <ScrollX>
                <Stack>
                    <Table size="small" sx={{ tableLayout: 'auto' }}>
                        <TableHead>
                            {/* Header de columnas */}
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableCell
                                            key={header.id}
                                            align={header.column.columnDef.meta?.align || "left"}
                                            sx={{
                                                bgcolor: '#F9FAFB',
                                                borderBottom: '1px solid #E5E7EB',
                                                py: 1.5,
                                                px: 2,
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                color: '#6B7280',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableCell>
                                    ))}
                                    {actions.length > 0 && (
                                        <TableCell
                                            align="center"
                                            sx={{
                                                bgcolor: '#F9FAFB',
                                                borderBottom: '1px solid #E5E7EB',
                                                py: 1.5,
                                                px: 2,
                                                fontSize: '12px',
                                                fontWeight: 600,
                                                color: '#6B7280',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                                whiteSpace: 'nowrap',
                                                width: 100,
                                            }}
                                        >
                                            Acciones
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}

                            {/* Fila de filtros */}
                            {showFilters && hasFilters && table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={`filter-${headerGroup.id}`} sx={{ bgcolor: '#FAFBFC' }}>
                                    {headerGroup.headers.map((header) => {
                                        if (header.column.getCanFilter() && header.column.columnDef.meta?.filterVariant) {
                                            return (
                                                <TableCell
                                                    key={header.id}
                                                    sx={{
                                                        py: 1,
                                                        px: 2,
                                                        borderBottom: '1px solid #E5E7EB',
                                                    }}
                                                >
                                                    <TableFilter
                                                        column={header.column}
                                                        filters={
                                                            filters.map(f => ({
                                                                key: f.id,
                                                                value: f.value as string | number | boolean | undefined
                                                            }))
                                                        }
                                                        onFilterChange={(_: string, value: string | number | boolean | undefined) => {
                                                            if (header.column.columnDef.meta?.filterProps?.dateFormat) {
                                                                const v = formatFilterDate(value as string, header.column.columnDef.meta.filterProps.dateFormat);
                                                                header.column.setFilterValue(v);
                                                            } else {
                                                                header.column.setFilterValue(value);
                                                            }
                                                        }}
                                                    />
                                                </TableCell>
                                            )
                                        } else {
                                            return (
                                                <TableCell
                                                    key={header.id}
                                                    sx={{
                                                        py: 1,
                                                        px: 2,
                                                        borderBottom: '1px solid #E5E7EB',
                                                    }}
                                                />
                                            );
                                        }
                                    })}
                                    {actions.length > 0 && (
                                        <TableCell
                                            sx={{
                                                py: 1,
                                                px: 2,
                                                borderBottom: '1px solid #E5E7EB',
                                            }}
                                        />
                                    )}
                                </TableRow>
                            ))}
                        </TableHead>
                        <TableBody>
                            {table.getRowModel().rows.length > 0
                                ? table.getRowModel().rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        sx={{
                                            '&:hover': { bgcolor: '#F9FAFB' },
                                            '&:last-child td': { borderBottom: 0 },
                                        }}
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <TableCell
                                                key={cell.id}
                                                align={cell.column.columnDef.meta?.align || "left"}
                                                sx={{
                                                    py: 1.5,
                                                    px: 2,
                                                    fontSize: '13px',
                                                    color: '#374151',
                                                    borderBottom: '1px solid #F3F4F6',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </TableCell>
                                        ))}
                                        {actions.length > 0 && (
                                            <TableCell
                                                align="center"
                                                sx={{
                                                    py: 1,
                                                    px: 2,
                                                    borderBottom: '1px solid #F3F4F6',
                                                }}
                                            >
                                                {actions
                                                    .filter(action => {
                                                        if (typeof action.disabled === "function") {
                                                            return !action.disabled(row.original);
                                                        }
                                                        return !action.disabled;
                                                    })
                                                    .map((action, index) => {
                                                        if (action.getLink) {
                                                            return (
                                                                <Tooltip key={index} title={action.tooltip || ""} arrow>
                                                                    <IconButton
                                                                        size="small"
                                                                        sx={{ color: action.color }}
                                                                        component={NextLink}
                                                                        href={action.getLink(row.original)}
                                                                    >
                                                                        <i className={action.icon} style={{ fontSize: '14px' }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            );
                                                        } else if (action.onClick) {
                                                            return (
                                                                <Tooltip key={index} title={action.tooltip || ""} arrow>
                                                                    <IconButton
                                                                        size="small"
                                                                        sx={{ color: action.color }}
                                                                        onClick={() => action.onClick!(row.original)}
                                                                    >
                                                                        <i className={action.icon} style={{ fontSize: '14px' }} />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            );
                                                        }
                                                        return null;
                                                    })}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                                : (
                                    <TableNoData
                                        msg="No hay datos disponibles"
                                        colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
                                    />
                                )
                            }
                        </TableBody>
                    </Table>
                </Stack>
            </ScrollX>

            {/* Paginación */}
            {data.length > 0 && (
                <Box sx={{ p: 2, borderTop: '1px solid #E5E7EB' }}>
                    <TablePagination
                        gotoPage={table.setPageIndex}
                        rowCount={table.getRowCount()}
                        setPageSize={table.setPageSize}
                        pageSize={table.getState().pagination.pageSize}
                        pageIndex={table.getState().pagination.pageIndex}
                    />
                </Box>
            )}
        </Paper>
    );
}

