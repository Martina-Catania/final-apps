import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useThemeTokens } from "../hooks";
import type { Tag } from "../utils/tag-api";
import { AppTextInput } from "./TextInput";

type ProjectTagEditorProps = {
  tagInput: string;
  selectedTags: Tag[];
  suggestedTags: Tag[];
  tagsError?: string | null;
  onTagInputChange: (value: string) => void;
  onAddTag: () => void | Promise<void>;
  onSelectSuggestedTag: (tag: Tag) => void;
  onRemoveSelectedTag: (tagId: number) => void;
  keyPrefix?: string;
};

export const ProjectTagEditor = ({
  tagInput,
  selectedTags,
  suggestedTags,
  tagsError,
  onTagInputChange,
  onAddTag,
  onSelectSuggestedTag,
  onRemoveSelectedTag,
  keyPrefix = "project",
}: ProjectTagEditorProps) => {
  const { colors, spacing, typography, radius } = useThemeTokens();

  return (
    <View style={{ gap: spacing.sm }}>
      <AppTextInput
        label="Project tags"
        onChangeText={onTagInputChange}
        onSubmitEditing={() => {
          void onAddTag();
        }}
        placeholder="Type a tag name"
        value={tagInput}
        errorText={tagsError ?? undefined}
        helperText="Add existing tags or create new ones."
      />

      {suggestedTags.length > 0 ? (
        <View style={[styles.rowWrap, { gap: spacing.xs }]}> 
          {suggestedTags.map((tag) => (
            <Pressable
              accessibilityRole="button"
              key={`${keyPrefix}-suggested-tag-${tag.id}`}
              onPress={() => onSelectSuggestedTag(tag)}
              style={({ pressed }) => [
                styles.tagPill,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderColor: colors.border,
                  borderRadius: radius.pill,
                  opacity: pressed ? 0.8 : 1,
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
            </Pressable>
          ))}
        </View>
      ) : null}

      {selectedTags.length > 0 ? (
        <View style={[styles.rowWrap, { gap: spacing.xs }]}> 
          {selectedTags.map((tag) => (
            <Pressable
              accessibilityRole="button"
              key={`${keyPrefix}-selected-tag-${tag.id}`}
              onPress={() => onRemoveSelectedTag(tag.id)}
              style={({ pressed }) => [
                styles.tagPill,
                {
                  backgroundColor: colors.secondaryMuted,
                  borderColor: colors.secondary,
                  borderRadius: radius.pill,
                  opacity: pressed ? 0.8 : 1,
                  paddingHorizontal: spacing.sm,
                  paddingVertical: spacing.xs,
                },
              ]}
            >
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: typography.secondary.sm,
                  fontWeight: typography.weights.semibold,
                }}
              >
                {tag.name}  x
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.secondary.sm,
          }}
        >
          No tags selected yet.
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tagPill: {
    borderWidth: 1,
  },
});
