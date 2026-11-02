// Pie de una vista del modal: siempre al fondo y con espacio inferior seguro.

import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';

export type ModalFooterProps = {
  children: ReactNode;
};

export function ModalFooter({ children }: ModalFooterProps) {
  const insets = useSafeAreaInsets();
  // Dentro del Modal el inset puede ser 0: se garantiza un mínimo de 16 dp.
  const paddingBottom = Math.max(insets.bottom, 0) + Spacing.three;

  return <View style={[styles.footer, { paddingBottom }]}>{children}</View>;
}

const styles = StyleSheet.create({
  footer: {
    marginTop: 'auto',
  },
});
