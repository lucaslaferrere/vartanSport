import {FormControl, Stack} from "@mui/material";
import React from "react";
import {DatePicker, LocalizationProvider} from "@mui/x-date-pickers";
import {AdapterDateFns} from "@mui/x-date-pickers/AdapterDateFns";
import {format} from "date-fns";

export default function DateRangeColumnFilter({
                                                  filterProps,
                                                  filterValueStart,
                                                  filterValueEnd,
                                                  onFilterChange
                                              }: {
    filterProps: {
        placeholderStart: string;
        placeholderEnd: string;
        filterAccessorKeyStart: string;
        filterAccessorKeyEnd: string;
    };
    filterValueStart: string | undefined;
    filterValueEnd: string | undefined;
    onFilterChange: (columnId: string, value: string | number | boolean | undefined) => void;
}) {
    const getDate = (value: string | undefined) => {
        if (value === undefined) return undefined;
        const d = new Date(`${value}T00:00:00`);
        const userTimezoneOffset = d.getTimezoneOffset() * 60000;
        return new Date(d.getTime() + userTimezoneOffset);
    }

    return (
        <Stack direction="row" alignItems="center" spacing={1} sx={{minWidth: 168, maxWidth: 250}}>
            <FormControl>
                <LocalizationProvider dateAdapter={AdapterDateFns} localeText={{
                    clearButtonLabel: 'Limpiar',
                }}>
                    <DatePicker
                        format="dd/MM/yyyy"
                        value={filterValueStart === undefined || filterValueStart === "" ? null : getDate(filterValueStart)}
                        onChange={(date) => {
                            try {
                                onFilterChange(filterProps.filterAccessorKeyStart, date ? format(date, "yyyy-MM-dd") : "");
                            } catch {
                                onFilterChange(filterProps.filterAccessorKeyStart, undefined);
                            }
                        }}
                        slotProps={{
                            textField: {
                                placeholder: filterProps.placeholderStart,
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
            <i className="fa fa-minus"/>
            <FormControl>
                <LocalizationProvider dateAdapter={AdapterDateFns} localeText={{
                    clearButtonLabel: 'Limpiar',
                }}>
                    <DatePicker
                        format="dd/MM/yyyy"
                        value={filterValueEnd === undefined || filterValueEnd === "" ? null : getDate(filterValueEnd)}
                        onChange={(date) => {
                            try {
                                onFilterChange(filterProps.filterAccessorKeyEnd, date ? format(date, "yyyy-MM-dd") : "");
                            } catch {
                                onFilterChange(filterProps.filterAccessorKeyEnd, undefined);
                            }
                        }}
                        slotProps={{
                            textField: {
                                placeholder: filterProps.placeholderEnd,
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
        </Stack>
    )
}