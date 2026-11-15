import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, Typography, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'title'
    | 'small'
    | 'smallBold'
    | 'sectionTitle'
    | 'subtitle'
    | 'link'
    | 'linkPrimary'
    | 'code'
    | 'caption'
    | 'buttonLarge'
    | 'price';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();
  const colorKey: ThemeColor =
    themeColor ?? (type === 'linkPrimary' ? 'primary' : type === 'link' ? 'link' : 'text');

  return <Text style={[{ color: theme[colorKey] }, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  default: Typography.body,
  small: Typography.bodySmall,
  smallBold: Typography.bodySmallBold,
  sectionTitle: Typography.sectionTitle,
  title: Typography.title,
  subtitle: Typography.subtitle,
  caption: Typography.caption,
  buttonLarge: Typography.buttonLarge,
  price: { ...Typography.price, fontVariant: ['tabular-nums'] },
  link: Typography.link,
  linkPrimary: Typography.linkPrimary,
  code: {
    fontFamily: Fonts.mono,
    fontWeight: Platform.select({ android: 700 }) ?? 500,
    fontSize: 12,
  },
});
