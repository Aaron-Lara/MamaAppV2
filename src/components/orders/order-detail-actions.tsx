// Acciones del detalle de un pedido pendiente: entregar o cancelar.
// Entregado o cancelado ya no muestran botones.

import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  canDeliver: boolean;
  canCancel: boolean;
  onDeliver: () => void;
  onCancel: () => void;
};

export function OrderDetailActions({
  canDeliver,
  canCancel,
  onDeliver,
  onCancel,
}: Props) {
  const theme = useTheme();

  if (!canDeliver && !canCancel) {
    return null;
  }

  return (
    <View style={styles.container}>
      {canDeliver ? (
        <AppButton label="Entregar pedido" onPress={onDeliver} />
      ) : null}

      {canCancel ? (
        <AppButton
          label="Cancelar pedido"
          variant="secondary"
          onPress={onCancel}
          labelStyle={{ color: theme.danger }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
});
