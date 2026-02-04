export const colors = {
  primary: '#528c9f',
  primaryLight: 'rgba(82, 140, 159, 0.1)',
  primaryMedium: 'rgba(82, 140, 159, 0.15)',
  primaryHover: 'rgba(82, 140, 159, 0.08)',
  primarySelected: 'rgba(82, 140, 159, 0.12)',
  primarySelectedHover: 'rgba(82, 140, 159, 0.16)',
  primaryDark: '#3d6a78',

  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',

  background: '#F5F5F5',
  backgroundLight: '#F9FAFB',
  backgroundCard: '#FFFFFF',
  backgroundHover: '#F9FAFB',

  border: '#E5E7EB',
  borderLight: '#F3F4F6',

  success: '#059669',
  successLight: 'rgba(16, 185, 129, 0.1)',
  warning: '#D97706',
  warningLight: 'rgba(245, 158, 11, 0.1)',
  error: '#DC2626',
  errorLight: 'rgba(239, 68, 68, 0.1)',
  info: '#2563EB',
  infoLight: 'rgba(59, 130, 246, 0.1)',
  purple: '#7C3AED',
  purpleLight: 'rgba(139, 92, 246, 0.1)',

  white: '#FFFFFF',
  black: '#000000',
};

export const chipColors = {
  proveedor: { bg: colors.warningLight, color: colors.warning },
  alquiler: { bg: colors.purpleLight, color: colors.purple },
  mercaderia: { bg: colors.infoLight, color: colors.info },
  servicios: { bg: colors.successLight, color: colors.success },
  otros: { bg: 'rgba(107, 114, 128, 0.1)', color: '#4B5563' },
  efectivo: { bg: colors.successLight, color: colors.success },
  transferencia: { bg: colors.warningLight, color: colors.warning },
  tarjeta: { bg: colors.purpleLight, color: colors.purple },
  default: { bg: 'rgba(107, 114, 128, 0.1)', color: '#4B5563' },
};

export const transitions = {
  drawer: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  default: 'all 0.2s ease',
  fast: 'all 0.15s ease',
};

export default colors;

