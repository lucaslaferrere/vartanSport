"use client";
import {usePathname} from "next/navigation";
import {Breadcrumbs as MuiBreadcrumbs, Grid} from "@mui/material";
import Typography from "@mui/material/Typography";
import Link from '@mui/material/Link';
import NextLink from 'next/link';
import {useEffect, useState} from "react";
import {GetBreadcrumbs, IBreadcrumbItem} from "@utils/getBreadcrumbs";
import MainCard from "@components/Cards/MainCard";
import {useHeaderActions} from "@components/Layouts/HeaderActionsContext";

const Breadcrumbs = () => {
    const pathName = usePathname();
    const [breads, setBreads] = useState<IBreadcrumbItem[]>([]);
    const { headerActions } = useHeaderActions();

    useEffect(() => {
        const b = GetBreadcrumbs(pathName);
        setBreads(b);
    }, [pathName]);

    return (
        <MainCard shadow={"none"} sx={{mb: 3, bgcolor: 'transparent'}} border={false} content={false}>
            <Grid
                container
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={1}
            >
                <Grid size={{ xs: 12 }} sx={{mt: 0.25}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        {breads.length > 1 && (
                            <Typography variant="h2" sx={{display: 'flex', alignItems: 'center'}}>
                                <Link component={NextLink} underline="hover" color="inherit"
                                      href={breads[breads.length - 2].url}>
                                    <i className="fa-regular fa-circle-left" style={{marginRight: "8px", fontSize:"1.25rem"}}/>
                                </Link>
                                {breads[breads.length - 1]?.title}
                            </Typography>
                        )}
                        {headerActions && (
                            <div style={{marginLeft: breads.length > 1 ? "auto" : "0"}}>
                                {headerActions}
                            </div>
                        )}
                    </div>
                </Grid>
            </Grid>
        </MainCard>
    )
}

export default Breadcrumbs;