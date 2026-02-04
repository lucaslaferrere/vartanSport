import {FormControl} from "@mui/material";
import {DateTimePicker, LocalizationProvider} from "@mui/x-date-pickers";
import {AdapterDateFns} from "@mui/x-date-pickers/AdapterDateFns";
import {format} from "date-fns";

export default function DateTimeColumnFilter({
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
        const d = new Date(`${value}`);
        const userTimezoneOffset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() + userTimezoneOffset);
    }

    return (
        <FormControl>
            <LocalizationProvider dateAdapter={AdapterDateFns} localeText={{
                clearButtonLabel: 'Limpiar',
            }}>
                <DateTimePicker
                    format="dd/MM/yyyy HH:mm"
                    value={filterValue === undefined || filterValue === "" ? null : getDate(filterValue)}
                    onChange={(date) => {
                        try {
                            onFilterChange(filterAccessorKey, date ? format(date, "yyyy-MM-dd HH:mm") : "");
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
                    timeSteps={{ minutes: 1 }}
                />
            </LocalizationProvider>
        </FormControl>
    )
}