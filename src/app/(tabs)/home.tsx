import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function HomeScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">POS Cooperativa</ThemedText>
      <Link href="/dev" style={styles.link}>
        <ThemedText type="link" themeColor="textSecondary">
          Pruebas (temporal)
        </ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  link: {
    alignSelf: 'flex-start',
  },
});
