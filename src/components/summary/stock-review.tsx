// "Por revisar": agotados y por agotarse, siempre en texto.

import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useStatusColors } from '@/hooks/use-status-colors';
import { useTheme } from '@/hooks/use-theme';
import type { StockReview } from '@/lib/stock-review';

type Props = { review: StockReview };

function outLabel(count: number): string {
  return count === 1 ? '1 producto agotado' : `${count} productos agotados`;
}

function lowLabel(count: number): string {
  return count === 1 ? '1 producto por agotarse' : `${count} productos por agotarse`;
}

export function StockReviewSection({ review }: Props) {
  const theme = useTheme();
  const statusColors = useStatusColors();
  const empty = review.outCount === 0 && review.lowCount === 0;

  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">Por revisar</ThemedText>
      {empty ? (
        <ThemedText type="small" themeColor="textSecondary">
          Todo en orden.
        </ThemedText>
      ) : (
        <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
          {review.outCount > 0 ? (
            <ThemedText type="smallBold" style={{ color: statusColors.error }}>
              {outLabel(review.outCount)}
            </ThemedText>
          ) : null}
          {review.lowCount > 0 ? (
            <ThemedText type="smallBold" style={{ color: statusColors.warning }}>
              {lowLabel(review.lowCount)}
            </ThemedText>
          ) : null}
          <ThemedText type="small" themeColor="textSecondary">
            Solo informativo.
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  card: {
    padding: Spacing.three,
    borderRadius: 12,
    gap: Spacing.one,
  },
});
