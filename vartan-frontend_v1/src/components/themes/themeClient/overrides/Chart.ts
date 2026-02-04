import { useTheme } from '@mui/material/styles';

export const Chart = () => {
    const theme = useTheme();

    return {
        colors: {
            sms: theme.palette.error.main,
            whatsapp: theme.palette.success.main,

            email: theme.palette.primary.main,
            procesosDeFirma: theme.palette.primary.main,

            feDeVida: theme.palette.warning.main,
            comparacionFacial: theme.palette.secondary.main || '#a855f7',

            bonificado: theme.palette.info.main || '#06b6d4',
        },
        axis: {
            tick: {
                fill: theme.palette.text.secondary,
                fontSize: 12
            },
            line: {
                stroke: theme.palette.divider
            }
        },
        grid: {
            stroke: theme.palette.divider,
            strokeDasharray: '3 3'
        },
        tooltip: {
            contentStyle: {
                backgroundColor: theme.palette.background.paper,
                borderColor: theme.palette.divider,
                color: theme.palette.text.primary,
                borderRadius: 4,
                boxShadow: theme.shadows[3]
            },
            itemStyle: {
                color: theme.palette.text.primary
            }
        },
        legend: {
            color: theme.palette.text.primary
        }
    };
};