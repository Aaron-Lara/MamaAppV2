// Pie de una vista del modal: siempre al fondo y con espacio inferior seguro.

import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';

const MODAL_FOOTER_MIN_BOTTOM = 40;

export type ModalFooterProps = {
  children: ReactNode;
};

export function ModalFooter({ children }: ModalFooterProps) {
  const insets = useSafeAreaInsets();
  // Dentro del Modal el inset puede ser 0: se garantiza un mínimo de 24 dp.
  const paddingBottom = Math.max(insets.bottom, MODAL_FOOTER_MIN_BOTTOM) + Spacing.two;

  return <View style={[styles.footer, { paddingBottom }]}>{children}</View>;
}

const styles = StyleSheet.create({
  footer: {
    marginTop: 'auto',
  },
});
