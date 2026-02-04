// project import
import DrawerFooterStyled from "./DrawerFooterStyled";
import {Box} from "@mui/material";
import {ThemeChanger} from "@components/themes/themeButton/themeButton";

// ==============================|| DRAWER FOOTER ||============================== //

export default function DrawerFooter() {
    return (
        <DrawerFooterStyled sx={{
            minHeight: '60px',
            width: 'inherit',
            paddingTop: '8px',
            paddingBottom: '8px',
            paddingLeft: 0
        }}>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 35,
                    width: "100%",
                }}
            >
                <ThemeChanger />
            </Box>
        </DrawerFooterStyled>
    )
}