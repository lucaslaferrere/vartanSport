// material-ui
import Chip from '@mui/material/Chip';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';

// project import
import {useAppSelector} from "@redux/hook";
import {Tooltip} from "@mui/material";

import {usePathname} from 'next/navigation'
import {IMenuItem} from "@routes/getMenuItems";
import colors from "@/src/theme/colors";

export default function NavItem({item, level}: {
    item: IMenuItem;
    level: number;
}) {
    const drawerOpen = useAppSelector((state) => state.customization.drawerOpen);

    const itemIcon = item.icon ?
        <i style={{fontSize: '16px', overflow: 'visible'}} className={item.icon}/> : false;

    const pathname = usePathname();
    const isSelected = pathname.startsWith(item.url ?? '');

    return (
        <ListItemButton
            component={NextLink}
            href={item.url!}
            disabled={item.disabled}
            selected={isSelected}
            sx={{
                overflowX: 'hidden !important',
                zIndex: 1201,
                height: '40px',
                minHeight: '40px',
                mb: 0.5,
                mx: drawerOpen ? 1.5 : 'auto',
                px: drawerOpen ? 2 : 0,
                py: 0,
                borderRadius: '8px',
                transition: 'all 0.15s ease',
                justifyContent: 'center',
                width: drawerOpen ? 'auto' : '48px',
                ...(drawerOpen && {
                    justifyContent: 'flex-start',
                    '&:hover': {
                        bgcolor: colors.primaryHover,
                    },
                    '&.Mui-selected': {
                        bgcolor: colors.primarySelected,
                        color: colors.primary,
                        '&:hover': {
                            bgcolor: colors.primarySelectedHover,
                        }
                    }
                }),
                ...(!drawerOpen && {
                    '&:hover': {
                        bgcolor: colors.primaryHover
                    },
                    '&.Mui-selected': {
                        bgcolor: colors.primarySelected,
                        '&:hover': {
                            bgcolor: colors.primarySelectedHover
                        }
                    }
                })
            }}
        >
            {itemIcon && (
                <Tooltip title={item.title} placement="right" disableHoverListener={drawerOpen}>
                    <ListItemIcon
                        sx={{
                            minWidth: drawerOpen ? 28 : 0,
                            mr: drawerOpen ? 1.5 : 0,
                            color: isSelected ? colors.primary : colors.textSecondary,
                            fontSize: '18px',
                            justifyContent: 'center',
                            ...(!drawerOpen && {
                                width: 40,
                                height: 40,
                                alignItems: 'center',
                                justifyContent: 'center',
                            })
                        }}
                    >
                        {itemIcon}
                    </ListItemIcon>
                </Tooltip>
            )}
            {(drawerOpen || (!drawerOpen && level !== 1)) && (
                <ListItemText
                    primary={
                        <Typography
                            variant="body2"
                            sx={{
                                color: isSelected ? '#528c9e' : '#1F2937',
                                fontSize: '14px',
                                fontWeight: isSelected ? 600 : 500,
                                lineHeight: 1
                            }}
                        >
                            {item.title}
                        </Typography>
                    }
                />
            )}
            {(drawerOpen || (!drawerOpen && level !== 1)) && item.chip && (
                <Chip
                    color={item.chip.color}
                    size="small"
                    label={item.chip.label}
                />
            )}
        </ListItemButton>
    );
}
