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
          <Stack.Screen name="stock-adjust" options={{ title: 'Ajustar stock' }} />
          <Stack.Screen name="customer-detail" options={{ title: 'Detalle del cliente' }} />
        </Stack>
      </ThemeProvider>
    </SQLiteProvider>
  );
}
