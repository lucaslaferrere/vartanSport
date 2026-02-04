import React from "react";
import {Column} from "@tanstack/react-table";
import {TableFilterType} from "./TableFilterType";
import TextColumnFilter from "@components/Tables/Filters/TextColumnFilter";
import SelectColumnFilter from "@components/Tables/Filters/SelectColumnFilter";
import DateColumnFilter from "@components/Tables/Filters/DateColumnFilter";
import DateRangeColumnFilter from "@components/Tables/Filters/DateRangeColumnFilter";
import DateTimeColumnFilter from "@components/Tables/Filters/DateTimeColumnFilter";

export default function TableFilter<T>(
    {column, onFilterChange, filters}:
    {
        column: Column<T, unknown>,
        filters: { key: string, value: string | number | boolean | undefined }[],
        onFilterChange: (columnId: string, value: string | number | boolean | undefined) => void
    }
) {
    const {filterVariant, filterAccessorKey, filterProps} = column.columnDef.meta ?? {};

    if (!filterVariant || !filterProps) {
        return null;
    }

    switch (filterVariant) {
        case TableFilterType.Text:
            const fText = filters.find(f => f.key === filterAccessorKey);
            return (
                <TextColumnFilter
                    filterAccessorKey={filterAccessorKey!}
                    filterProps={filterProps as { placeholder: string }}
                    filterValue={fText ? fText.value as string : undefined}
                    onFilterChange={onFilterChange}
                />
            );
        case TableFilterType.Select:
            const fSelect = filters.find(f => f.key === filterAccessorKey);
            return (
                <SelectColumnFilter
                    filterAccessorKey={filterAccessorKey!}
                    filterProps={filterProps as { options: { value: string | number, label: string }[] }}
                    filterValue={fSelect ? fSelect.value as string | number : undefined}
                    onFilterChange={onFilterChange}
                />
            );
        case TableFilterType.Date:
            const fDate = filters.find(f => f.key === filterAccessorKey);
            return (
                <DateColumnFilter
                    filterAccessorKey={filterAccessorKey!}
                    filterProps={filterProps as { placeholder: string }}
                    filterValue={fDate ? fDate.value as string : undefined}
                    onFilterChange={onFilterChange}
                />
            );
        case TableFilterType.DateRange:
            const fDateRangeStart = filters.find(f => f.key === filterProps.filterAccessorKeyStart);
            const fDateRangeEnd = filters.find(f => f.key === filterProps.filterAccessorKeyEnd);
            return (
                <DateRangeColumnFilter
                    filterProps={filterProps as {
                        placeholderStart: string,
                        placeholderEnd: string,
                        filterAccessorKeyStart: string,
                        filterAccessorKeyEnd: string
                    }}
                    filterValueStart={fDateRangeStart ? fDateRangeStart.value as string : undefined}
                    filterValueEnd={fDateRangeEnd ? fDateRangeEnd.value as string : undefined}
                    onFilterChange={onFilterChange}
                />
            );
        case TableFilterType.DateTime:
            const fDateTime = filters.find(f => f.key === filterAccessorKey);
            return (
                <DateTimeColumnFilter
                    filterAccessorKey={filterAccessorKey!}
                    filterProps={filterProps as { placeholder: string }}
                    filterValue={fDateTime ? fDateTime.value as string : undefined}
                    onFilterChange={onFilterChange}
                />
            );
        default:
            return null;
    }
}