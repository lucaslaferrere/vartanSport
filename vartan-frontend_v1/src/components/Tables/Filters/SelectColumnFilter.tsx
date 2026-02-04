import {MenuItem, Select, FormControl} from "@mui/material";
import colors from "@/src/theme/colors";

export default function SelectColumnFilter({
                                               filterAccessorKey,
                                               filterProps,
                                               filterValue,
                                               onFilterChange
                                           }: {
    filterAccessorKey: string;
    filterProps: {
        options: { value: string | number, label: string }[];
    };
    filterValue: string | number | undefined;
    onFilterChange: (columnId: string, value: string | number | boolean | undefined) => void;
}) {
    return (
        <FormControl fullWidth size="small">
            <Select
                displayEmpty
                value={filterValue?.toString() || ''}
                onChange={(e) => {
                    const value = e.target.value;
                    onFilterChange(filterAccessorKey, value === '' ? undefined : value as string | number | undefined);
                }}
                sx={{
                    borderRadius: '6px',
                    fontSize: '13px',
                    bgcolor: colors.white,
                    '& fieldset': { borderColor: colors.border },
                    '&:hover fieldset': { borderColor: colors.borderLight },
                    '&.Mui-focused fieldset': { borderColor: colors.primary },
                    '& .MuiSelect-select': {
                        py: 0.75,
                        px: 1.5,
                    }
                }}
            >
                <MenuItem value="">
                    <em style={{ color: colors.textMuted }}>Todos</em>
                </MenuItem>
                {filterProps.options.map((option) => (
                    <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                ))}
            </Select>
        </FormControl>
    )
}