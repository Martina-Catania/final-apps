import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useThemeTokens } from "../hooks";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) => {
  const { colors, iconSizes, spacing, typography } = useThemeTokens();
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <View style={[styles.container, { gap: spacing.sm }]}> 
      <Pressable
        accessibilityRole="button"
        disabled={currentPage <= 1}
        onPress={() => onPageChange(currentPage - 1)}
        style={({ pressed }) => [
          styles.navButton,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: currentPage <= 1 ? 0.4 : pressed ? 0.75 : 1,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
          },
        ]}
      >
        <Ionicons color={colors.textPrimary} name="chevron-back" size={iconSizes.md} />
      </Pressable>

      <View style={[styles.pages, { gap: spacing.xs }]}> 
        {pages.map((page) => {
          const isActive = page === currentPage;

          return (
            <Pressable
              accessibilityRole="button"
              key={page}
              onPress={() => onPageChange(page)}
              style={({ pressed }) => [
                styles.pageButton,
                {
                  backgroundColor: isActive ? colors.primary : colors.surface,
                  borderColor: isActive ? colors.primary : colors.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Text
                style={{
                  color: isActive ? colors.textInverse : colors.textPrimary,
                  fontSize: typography.secondary.md,
                  fontWeight: isActive
                    ? typography.weights.semibold
                    : typography.weights.medium,
                }}
              >
                {page}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={currentPage >= totalPages}
        onPress={() => onPageChange(currentPage + 1)}
        style={({ pressed }) => [
          styles.navButton,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            opacity: currentPage >= totalPages ? 0.4 : pressed ? 0.75 : 1,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
          },
        ]}
      >
        <Ionicons color={colors.textPrimary} name="chevron-forward" size={iconSizes.md} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  pages: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  pageButton: {
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    minWidth: 36,
    paddingHorizontal: 8,
  },
  navButton: {
    borderRadius: 10,
    borderWidth: 1,
  },
});
