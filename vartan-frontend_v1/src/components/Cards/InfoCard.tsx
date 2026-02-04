import MainCard from "@/src/components/Cards/MainCard";
import {Box, Grid, Stack, Typography} from "@mui/material";
import BoxIcon from "@/src/components/Icons/BoxIcon";

export default function InfoCard({
                                     primary,
                                     secondary,
                                     content,
                                     icon,
                                     iconColor,
                                     iconBgColor
                                 }: {
    primary: string,
    secondary: string,
    content?: string,
    icon?: string,
    iconColor?: string,
    iconBgColor?: string
}) {
    return (
        <MainCard
            content={false}
            sx={{
                bgcolor: '#FFFFFF',
                borderRadius: '14px',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                border: '1px solid #E5E7EB',
                p: '16px 18px',
                minHeight: '110px',
                transition: 'all 0.15s ease',
                '&:hover': {
                    boxShadow: '0 4px 12px rgba(82, 140, 158, 0.06)',
                    borderColor: 'rgba(82, 140, 158, 0.25)'
                }
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <Stack spacing={0.75} sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                        variant="body2"
                        sx={{
                            color: '#6B7280',
                            fontSize: '12px',
                            fontWeight: 500,
                            letterSpacing: '0.02em',
                            textTransform: 'uppercase'
                        }}
                    >
                        {primary}
                    </Typography>
                    <Typography
                        variant="h3"
                        sx={{
                            color: '#1F2937',
                            fontSize: '28px',
                            fontWeight: 700,
                            lineHeight: 1.1,
                            letterSpacing: '-0.02em'
                        }}
                    >
                        {secondary}
                    </Typography>
                    {
                        content &&
                        <Typography
                            variant="subtitle2"
                            sx={{
                                color: '#6B7280',
                                fontSize: '12px',
                                fontWeight: 400
                            }}
                        >
                            {content}
                        </Typography>
                    }
                </Stack>
                {
                    icon && (
                        <Box sx={{ flexShrink: 0 }}>
                            <BoxIcon
                                icon={icon}
                                color={iconColor}
                                bgcolor={iconBgColor}
                                size="small"
                            />
                        </Box>
                    )
                }
            </Box>
        </MainCard>
    );
}