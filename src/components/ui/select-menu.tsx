// Menú desplegable compacto: trigger de 48 dp y hoja inferior con opciones.

import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { AppIcon, AppIcons } from '@/components/ui/app-icon';
import { styles } from '@/components/ui/select-menu.styles';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type SelectOption<T> = { value: T; label: string };

export type SelectMenuProps<T> = {
  label: string;
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function SelectMenu<T>({
  label,
  value,
  options,
  onChange,
  accessibilityLabel,
  style,
}: SelectMenuProps<T>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);
  const close = () => setOpen(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${accessibilityLabel ?? label}: ${selected?.label ?? ''}`}
        accessibilityState={{ expanded: open }}
        style={({ pressed }) => [
          styles.trigger,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.border,
            opacity: pressed ? 0.7 : 1,
          },
          style,
        ]}>
        <View style={styles.triggerText}>
          <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
            {label}
          </ThemedText>
          <ThemedText type="smallBold" numberOfLines={1}>
            {selected?.label ?? ''}
          </ThemedText>
        </View>
        <AppIcon name={AppIcons.chevron} color={theme.textSecondary} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={close}>
        <View style={[styles.backdrop, { backgroundColor: theme.overlay }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Cerrar menú"
          />
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
                paddingBottom: insets.bottom + Spacing.three,
              },
            ]}>
            <ThemedText type="sectionTitle" style={styles.sheetTitle}>
              {label}
            </ThemedText>
            <ScrollView
              style={{ maxHeight: height * 0.6 }}
              contentContainerStyle={styles.options}>
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <Pressable
                    key={String(option.value)}
                    onPress={() => {
                      onChange(option.value);
                      close();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={option.label}
                    accessibilityState={{ selected: isSelected }}
                    style={({ pressed }) => [
                      styles.option,
                      isSelected && { backgroundColor: theme.primarySoft },
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText
                      type={isSelected ? 'smallBold' : 'small'}
                      style={isSelected ? { color: theme.primary } : undefined}>
                      {option.label}
                    </ThemedText>
                    {isSelected ? (
                      <ThemedText type="smallBold" style={{ color: theme.primary }}>
                        ✓
                      </ThemedText>
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}
