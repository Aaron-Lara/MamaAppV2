import { NativeTabs } from 'expo-router/native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Vender</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="cart" md="shopping_cart" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="inventory">
        <NativeTabs.Trigger.Label>Inventario</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="shippingbox" md="inventory_2" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="debts">
        <NativeTabs.Trigger.Label>Fiados</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.2" md="group" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="summary">
        <NativeTabs.Trigger.Label>Resumen</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.bar" md="bar_chart" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
