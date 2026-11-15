// Colores de estado legibles en claro y oscuro, tomados del tema.

import { useTheme } from '@/hooks/use-theme';

export function useStatusColors(): { error: string; warning: string } {
  const theme = useTheme();
  return { error: theme.danger, warning: theme.warning };
}
