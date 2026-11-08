import { SQLiteProvider } from 'expo-sqlite';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { DATABASE_NAME, migrateDbIfNeeded } from '@/db/database';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="dev" options={{ title: 'Pruebas (temporal)' }} />
          <Stack.Screen name="product-form" options={{ title: 'Nuevo producto' }} />
          <Stack.Screen name="purchase-form" options={{ title: 'Nueva compra' }} />
          <Stack.Screen name="purchases" options={{ title: 'Compras' }} />
          <Stack.Screen name="purchase-detail" options={{ title: 'Detalle de compra' }} />
          <Stack.Screen name="order-form" options={{ title: 'Nuevo pedido' }} />
          <Stack.Screen name="order-detail" options={{ title: 'Detalle de pedido' }} />
          <Stack.Screen name="stock-adjust" options={{ title: 'Ajustar stock' }} />
          <Stack.Screen name="customer-detail" options={{ title: 'Detalle del cliente' }} />
          <Stack.Screen name="expenses" options={{ title: 'Gastos' }} />
          <Stack.Screen name="expense-form" options={{ title: 'Nuevo gasto' }} />
          <Stack.Screen name="expense-detail" options={{ title: 'Detalle de gasto' }} />
        </Stack>
      </ThemeProvider>
    </SQLiteProvider>
  );
}
