import {FormControl} from "@mui/material";
import {DatePicker, LocalizationProvider} from "@mui/x-date-pickers";
import {AdapterDateFns} from "@mui/x-date-pickers/AdapterDateFns";
import {format} from "date-fns";

export default function DateColumnFilter({
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
    const getDate = (value: string | undefined) => {
        if (value === undefined) return undefined;
        const d = new Date(`${value}T00:00:00`);
        const userTimezoneOffset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() + userTimezoneOffset);
    }

    return (
        <FormControl>
            <LocalizationProvider dateAdapter={AdapterDateFns} localeText={{
                clearButtonLabel: 'Limpiar',
            }}>
                <DatePicker
                    format="dd/MM/yyyy"
                    value={filterValue === undefined || filterValue === "" ? null : getDate(filterValue)}
                    onChange={(date) => {
                        try {
                            onFilterChange(filterAccessorKey, date ? format(date, "yyyy-MM-dd") : "");
                        } catch {
                            onFilterChange(filterAccessorKey, undefined);
                        }
                    }}
                    slotProps={{
                        textField: {
                            placeholder: filterProps.placeholder,
                            size: "small",
                            fullWidth: true
                        },
                        field: { clearable: true },
                        actionBar: {
                            actions: [
                                'clear'
                            ]
                        }
                    }}
                />
            </LocalizationProvider>
        </FormControl>
    )
}