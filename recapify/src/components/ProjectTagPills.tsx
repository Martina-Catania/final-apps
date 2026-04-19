import { useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useThemeTokens } from "../hooks";
import type { FlatTag } from "../utils/tag-utils";
import { AppActionSheet } from "./ActionSheet";

type ProjectTagPillsProps = {
  tags: FlatTag[];
  maxVisible?: number;
};

export const ProjectTagPills = ({
  tags,
  maxVisible = 3,
}: ProjectTagPillsProps) => {
  const { colors, radius, spacing, typography } = useThemeTokens();
  const [isHiddenTagsSheetOpen, setIsHiddenTagsSheetOpen] = useState(false);

  const visibleTags = useMemo(() => tags.slice(0, maxVisible), [maxVisible, tags]);
  const hiddenTags = useMemo(() => tags.slice(maxVisible), [maxVisible, tags]);

  if (visibleTags.length === 0) {
    return null;
  }

  return (
    <>
      <View style={[styles.row, { gap: spacing.xs }]}> 
        {visibleTags.map((tag) => (
          <View
            key={`project-tag-${tag.id}`}
            style={[
              styles.pill,
              {
                backgroundColor: colors.surfaceMuted,
                borderColor: colors.border,
                borderRadius: radius.pill,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
              },
            ]}
          >
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.secondary.sm,
                fontWeight: typography.weights.medium,
              }}
            >
              {tag.name}
            </Text>
          </View>
        ))}

        {hiddenTags.length > 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setIsHiddenTagsSheetOpen(true)}
            style={({ pressed }) => [
              styles.pill,
              {
                backgroundColor: colors.primaryMuted,
                borderColor: colors.primary,
                borderRadius: radius.pill,
                opacity: pressed ? 0.8 : 1,
                paddingHorizontal: spacing.sm,
                paddingVertical: spacing.xs,
              },
            ]}
          >
            <Text
              style={{
                color: colors.textInverse,
                fontSize: typography.secondary.sm,
                fontWeight: typography.weights.semibold,
              }}
            >
              +{hiddenTags.length}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {hiddenTags.length > 0 ? (
        <AppActionSheet
          isOpen={isHiddenTagsSheetOpen}
          items={hiddenTags.map((tag) => ({
            label: tag.name,
            value: String(tag.id),
            iconName: "pricetag-outline",
          }))}
          onClose={() => setIsHiddenTagsSheetOpen(false)}
          onSelect={() => {
            // Selection is intentionally inert; this sheet reveals hidden tags only.
          }}
          title="Project tags"
        />
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
  },
  pill: {
    borderWidth: 1,
  },
});
