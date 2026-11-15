// Campo de búsqueda con lupa, compartido por las listas.

import { StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppIcon, AppIcons } from '@/components/ui/app-icon';
import { Radii, Spacing, TouchTarget, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type SearchFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function SearchField({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  style,
}: SearchFieldProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.box,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        style,
      ]}>
      <AppIcon name={AppIcons.search} color={theme.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        accessibilityLabel={accessibilityLabel ?? placeholder}
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="while-editing"
        underlineColorAndroid="transparent"
        style={[styles.input, { color: theme.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    minHeight: TouchTarget.min,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderRadius: Radii.md,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
    fontSize: Typography.body.fontSize,
  },
});
