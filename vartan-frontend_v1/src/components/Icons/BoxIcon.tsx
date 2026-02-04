import {Box} from "@mui/material";

export default function BoxIcon({
                                    icon,
                                    bgcolor = "primary.main",
                                    color = "inherit",
                                    borderRadius = '10px',
                                    size = "small",
                                }: {
    icon: string,
    bgcolor?: string,
    color?: string,
    borderRadius?: string,
    size?: "xsmall" | "small" | "medium" | "large"
}) {
    const dimensions = size === "xsmall" ? "32px" : size === "small" ? "44px" : size === "medium" ? "52px" : "60px";
    const iconSize = size === 'xsmall' ? '14px' : size === 'small' ? '18px' : size === 'medium' ? '22px' : '26px';

    return (
        <Box
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: bgcolor,
                color,
                borderRadius,
                width: dimensions,
                height: dimensions,
                flexShrink: 0
            }}
        >
            <i
                className={icon}
                style={{fontSize: iconSize}}
            />
        </Box>
    );
}