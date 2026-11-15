// Icono multiplataforma: SF Symbols en iOS y Material Symbols en Android/web.

import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import type { StyleProp, ViewStyle } from 'react-native';

import { IconSize } from '@/constants/theme';

export type AppIconName = {
  ios: SFSymbol;
  android: AndroidSymbol;
  web: AndroidSymbol;
};

export const AppIcons = {
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  filter: { ios: 'line.3.horizontal.decrease', android: 'filter_list', web: 'filter_list' },
  grid: { ios: 'square.grid.2x2', android: 'grid_view', web: 'grid_view' },
  category: { ios: 'tag', android: 'tag', web: 'tag' },
  cart: { ios: 'bag', android: 'shopping_bag', web: 'shopping_bag' },
  total: { ios: 'banknote', android: 'payments', web: 'payments' },
  cash: { ios: 'banknote', android: 'payments', web: 'payments' },
  credit: { ios: 'creditcard', android: 'credit_card', web: 'credit_card' },
  customer: { ios: 'person.crop.circle', android: 'person', web: 'person' },
  add: { ios: 'plus', android: 'add', web: 'add' },
  remove: { ios: 'minus', android: 'remove', web: 'remove' },
  chevron: { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' },
  trash: { ios: 'trash', android: 'delete', web: 'delete' },
  checkout: { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' },
} as const satisfies Record<string, AppIconName>;

export type AppIconProps = {
  name: AppIconName;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
};

export function AppIcon({ name, size = IconSize.sm, color, style }: AppIconProps) {
  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={color}
      style={style}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
