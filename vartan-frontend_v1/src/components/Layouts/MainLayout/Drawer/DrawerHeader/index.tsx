// project import
import DrawerHeaderStyled from './DrawerHeaderStyled';
import {Box} from "@mui/material";
import {useAppSelector} from "@redux/hook";
import Image from 'next/image';

// ==============================|| DRAWER HEADER ||============================== //

export default function DrawerHeader({open}: {
    open: boolean;
}) {
    const customization = useAppSelector((state) => state.customization);

    return (
        <DrawerHeaderStyled open={open} sx={{
            minHeight: '64px',
            width: 'inherit',
            paddingTop: '12px',
            paddingBottom: '12px',
            paddingLeft: 0,
            paddingRight: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            {open ? (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: 48,
                        width: "100%",
                        position: 'relative',
                    }}
                >
                    <Image
                        src={customization.logo}
                        alt="Vartan Sports Logo"
                        width={180}
                        height={48}
                        style={{ objectFit: 'contain' }}
                        priority
                    />
                </Box>
            ) : (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        height: 70,
                        width: 70,
                    }}
                >
                    <Image
                        src={customization.icon}
                        alt="Vartan Sports Icon"
                        width={70}
                        height={70}
                        style={{ objectFit: 'contain' }}
                        priority
                    />
                </Box>
            )}
        </DrawerHeaderStyled>
    );
}