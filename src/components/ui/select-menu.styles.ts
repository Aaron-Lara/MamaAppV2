// Estilos del menú desplegable compartido.

import { StyleSheet } from 'react-native';

import { Radii, Spacing, TouchTarget } from '@/constants/theme';

export const styles = StyleSheet.create({
  trigger: {
    minHeight: TouchTarget.min,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderWidth: 1,
    borderRadius: Radii.md,
  },
  triggerText: {
    flex: 1,
    gap: Spacing.half,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    gap: Spacing.one,
    padding: Spacing.three,
    borderTopWidth: 1,
    borderTopLeftRadius: Radii.lg,
    borderTopRightRadius: Radii.lg,
  },
  sheetTitle: {
    paddingBottom: Spacing.two,
  },
  options: {
    gap: Spacing.one,
  },
  option: {
    minHeight: TouchTarget.min,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radii.sm,
  },
  pressed: {
    opacity: 0.7,
  },
});
