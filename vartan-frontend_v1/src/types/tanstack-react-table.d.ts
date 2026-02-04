import {RowData} from "@tanstack/react-table";
import {TableFilterType} from "@components/Tables/Filters/TableFilterType";

declare module '@tanstack/react-table' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface ColumnMeta<TData extends RowData, TValue> {
        filterVariant?: TableFilterType;
        filterAccessorKey?: string;
        filterProps?: {
            placeholder?: string;
            placeholderStart?: string;
            placeholderEnd?: string;
            options?: { value: string | number, label: string }[];
            multiple?: boolean;
            filterAccessorKeyStart?: string;
            filterAccessorKeyEnd?: string;
            dateFormat?: string;
        };
        align?: "left" | "center" | "right";
    }

}