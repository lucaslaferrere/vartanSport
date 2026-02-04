import {Box, styled} from "@mui/material";

const DrawerFooterStyled = styled(Box)(
    ({theme}) => ({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: theme.spacing(2)
    })
);

export default DrawerFooterStyled;