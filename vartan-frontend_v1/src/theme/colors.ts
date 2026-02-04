// Colores centralizados de la aplicación Vartan Sports
// Modifica este archivo para cambiar los colores en toda la aplicación

export const colors = {
  // Color principal (turquesa corporativo)
  primary: '#528c9e',
  primaryLight: 'rgba(82, 140, 158, 0.1)',
  primaryMedium: 'rgba(82, 140, 158, 0.15)',
  primaryHover: 'rgba(82, 140, 158, 0.08)',
  primarySelected: 'rgba(82, 140, 158, 0.12)',
  primarySelectedHover: 'rgba(82, 140, 158, 0.16)',
  primaryDark: '#3d6a78',

  // Colores para gráficos (variaciones del primario)
  chart: ['#528c9e', '#6a9fae', '#82b2be', '#9ac5ce', '#b2d8de'],

  // Texto
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',

  // Fondos
  background: '#F5F5F5',
  backgroundLight: '#F9FAFB',
  backgroundCard: '#FFFFFF',
  backgroundHover: '#F9FAFB',
  backgroundTable: '#FAFBFC',

  // Bordes
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderFocus: '#528c9e',

  // Estados
  success: '#059669',
  successLight: 'rgba(16, 185, 129, 0.1)',
  warning: '#D97706',
  warningLight: 'rgba(245, 158, 11, 0.1)',
  error: '#DC2626',
  errorLight: 'rgba(239, 68, 68, 0.1)',
  info: '#2563EB',
  infoLight: 'rgba(59, 130, 246, 0.1)',

  // Otros
  white: '#FFFFFF',
  black: '#000000',
};

// Estilos comunes reutilizables
export const commonStyles = {
  // Card base
  card: {
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
    bgcolor: colors.backgroundCard,
  },

  // Input focus
  inputFocus: {
    '&.Mui-focused fieldset': { borderColor: colors.primary },
  },

  // Hover para items de lista
  listItemHover: {
    '&:hover': { bgcolor: colors.primaryHover },
  },

  // Item seleccionado
  listItemSelected: {
    bgcolor: colors.primarySelected,
    color: colors.primary,
    '&:hover': { bgcolor: colors.primarySelectedHover },
  },
};

export default colors;