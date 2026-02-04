import { FormControl, IconButton, MenuItem, Pagination, Select, Stack, TextField, Tooltip, Typography, Grid } from "@mui/material";
import React, { useState } from "react";

type Props = {
    gotoPage: (page: number) => void;
    rowCount: number;
    setPageSize: (size: number) => void;
    pageSize: number;
    pageIndex: number;
    onRefresh?: () => void;
};

export default function TablePagination({ gotoPage, rowCount, setPageSize, pageSize, pageIndex, onRefresh }: Props) {
    const [open, setOpen] = useState(false);

    return (
        <Grid container alignItems="center" justifyContent="space-between" sx={{ width: 'auto' }}>
            <Grid>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption" color="secondary">
                            Filas por página
                        </Typography>
                        <FormControl sx={{ m: 1 }}>
                            <Select
                                open={open}
                                onClose={() => setOpen(false)}
                                onOpen={() => setOpen(true)}
                                value={pageSize}
                                onChange={(e) => setPageSize(Number(e.target.value))}
                                size="small"
                                sx={{ '& .MuiSelect-select': { py: 0.75, px: 1.25 } }}
                            >
                                <MenuItem value={10}>10</MenuItem>
                                <MenuItem value={25}>25</MenuItem>
                                <MenuItem value={50}>50</MenuItem>
                                <MenuItem value={100}>100</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                    <Typography variant="caption" color="secondary">
                        Ir a la página
                    </Typography>
                    <TextField
                        size="small"
                        type="number"
                        value={pageIndex + 1}
                        onChange={(e) => {
                            const page = e.target.value ? Number(e.target.value) : 0;
                            gotoPage(page - 1);
                        }}
                        sx={{ '& .MuiOutlinedInput-input': { py: 0.75, px: 1.25, width: 36 } }}
                    />
                </Stack>
            </Grid>
            <Grid container sx={{ mt: { xs: 2, sm: 0 } }}>
                {
                    onRefresh && (
                        <Grid>
                            <Tooltip title="Refrescar">
                                <IconButton
                                    onClick={onRefresh}
                                    size="small"
                                    sx={{
                                        backgroundColor: (theme) => theme.palette.primary.main,
                                        color: (theme) => theme.palette.primary.contrastText,
                                        '&:hover': {
                                            backgroundColor: (theme) => theme.palette.primary.dark,
                                        }
                                    }}
                                >
                                    <i className="fa-solid fa-rotate" />
                                </IconButton>
                            </Tooltip>
                        </Grid>
                    )
                }
                <Grid>
                    <Pagination
                        count={Math.ceil(rowCount / pageSize)}
                        page={pageIndex + 1}
                        onChange={(e, page) => gotoPage(page - 1)}
                        color="primary"
                        showFirstButton
                        showLastButton
                    />
                </Grid>
            </Grid>

        </Grid>
    )
}