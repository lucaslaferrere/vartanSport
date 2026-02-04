import React from "react";
import {TextField} from "@mui/material";
import colors from "@/src/theme/colors";

export default function TextColumnFilter({
                                             filterAccessorKey,
                                             filterProps,
                                             filterValue,
                                             onFilterChange
                                         }: {
    filterAccessorKey: string;
    filterProps: {
        placeholder: string;
    };
    filterValue: string | undefined;
    onFilterChange: (columnId: string, value: string | number | boolean | undefined) => void;
}) {
    return (
        <TextField
            fullWidth
            value={filterValue || ''}
            onChange={(e) => {
                onFilterChange(filterAccessorKey, e.target.value || undefined);
            }}
            placeholder={filterProps?.placeholder || 'Buscar...'}
            size="small"
            sx={{
                '& .MuiOutlinedInput-root': {
                    borderRadius: '6px',
                    fontSize: '13px',
                    bgcolor: colors.white,
                    '& fieldset': { borderColor: colors.border },
                    '&:hover fieldset': { borderColor: colors.borderLight },
                    '&.Mui-focused fieldset': { borderColor: colors.primary },
                },
                '& .MuiInputBase-input': {
                    py: 0.75,
                    px: 1.5,
                }
            }}
        />
    )
}