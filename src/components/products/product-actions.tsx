// Acciones de un producto existente: desactivar/reactivar y ajustar stock.
// No escribe SQL: el estado y el stock pasan por src/db.

import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { ThemedText } from '@/components/themed-text';
import { setProductActive } from '@/db/products-manage';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  productId: number;
  isActive: boolean;
  trackStock: boolean;
  /** Mientras el formulario guarda, las acciones quedan bloqueadas. */
  disabled?: boolean;
  /** Avisa al formulario para que también bloquee su botón Guardar. */
  onBusyChange?: (busy: boolean) => void;
};

export function ProductActions({
  productId,
  isActive,
  trackStock,
  disabled = false,
  onBusyChange,
}: Props) {
  const db = useSQLiteContext();
  const theme = useTheme();
  const [toggling, setToggling] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const busy = disabled || toggling;

  useEffect(() => {
    onBusyChange?.(toggling);
  }, [onBusyChange, toggling]);

  const toggleActive = async () => {
    if (toggling) {
      return;
    }
    setToggling(true);
    setStatusError(null);
    try {
      await setProductActive(db, productId, !isActive);
      router.back();
    } catch {
      setStatusError('No se pudo cambiar el estado del producto. Inténtalo de nuevo.');
      setToggling(false);
    }
  };

  const confirmToggle = () => {
    Alert.alert(
      isActive ? '¿Desactivar producto?' : '¿Reactivar producto?',
      isActive
        ? 'Dejará de aparecer para vender. Sus ventas y su stock se conservan.'
        : 'Volverá a aparecer para vender.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: isActive ? 'Desactivar' : 'Reactivar',
          style: isActive ? 'destructive' : 'default',
          onPress: () => void toggleActive(),
        },
      ]
    );
  };

  return (
    <>
      <AppButton
        label={isActive ? 'Desactivar producto' : 'Reactivar producto'}
        variant="secondary"
        disabled={busy}
        onPress={confirmToggle}
      />

      {trackStock ? (
        <AppButton
          label="Ajustar stock"
          variant="secondary"
          disabled={busy}
          onPress={() =>
            router.push({ pathname: '/stock-adjust', params: { id: String(productId) } })
          }
        />
      ) : null}

      {statusError ? (
        <ThemedText type="small" style={{ color: theme.danger }}>
          {statusError}
        </ThemedText>
      ) : null}
    </>
  );
}
