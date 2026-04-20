import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { useThemeTokens } from "../hooks";
import type { FlatTag } from "../utils/tag-utils";
import type { ProjectTypeFilterOption } from "../utils/project-search-filters";
import { AppTextInput } from "./TextInput";
import { Button } from "./Button";
import { Card } from "./Card";
import { Accordion } from "./Accordion";

type ProjectSearchFiltersProps<TProjectType extends string> = {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit?: () => void;
  queryLabel?: string;
  queryPlaceholder?: string;
  showSearchButton?: boolean;
  searchButtonLabel?: string;
  showTagFilters?: boolean;
  tagFilterTitle?: string;
  noTagsMessage?: string;
  availableTags?: FlatTag[];
  selectedTagIds?: number[];
  onToggleTag?: (tagId: number) => void;
  isLoadingTags?: boolean;
  showProjectTypeFilters?: boolean;
  projectTypeFilterTitle?: string;
  projectTypeOptions?: ProjectTypeFilterOption<TProjectType>[];
  selectedProjectTypes?: TProjectType[];
  onToggleProjectType?: (projectType: TProjectType) => void;
  style?: StyleProp<ViewStyle>;
};

export function ProjectSearchFilters<TProjectType extends string = string>({
  query,
  onQueryChange,
  onSubmit,
  queryLabel = "Search",
  queryPlaceholder = "Type a project title",
  showSearchButton = false,
  searchButtonLabel = "Search",
  showTagFilters = true,
  tagFilterTitle = "Filter by tags",
  noTagsMessage = "No tags available yet.",
  availableTags = [],
  selectedTagIds = [],
  onToggleTag,
  isLoadingTags = false,
  showProjectTypeFilters = false,
  projectTypeFilterTitle = "Filter by project type",
  projectTypeOptions = [],
  selectedProjectTypes = [],
  onToggleProjectType,
  style,
}: ProjectSearchFiltersProps<TProjectType>) {
  const { colors, spacing, typography } = useThemeTokens();

  return (
    <Card
      style={[
        {
          gap: spacing.md,
          padding: spacing.md,
        },
        style,
      ]}
    >
      <AppTextInput
        label={queryLabel}
        leftIcon="search-outline"
        onChangeText={onQueryChange}
        onSubmitEditing={() => {
          if (onSubmit) {
            onSubmit();
          }
        }}
        placeholder={queryPlaceholder}
        returnKeyType={onSubmit ? "search" : "done"}
        value={query}
      />
      {showTagFilters || showProjectTypeFilters ? (
              <Accordion
                title="More filters"
                defaultExpanded={showTagFilters || showProjectTypeFilters}
              >
                  {showTagFilters ? (
                      <View style={{ gap: spacing.xs }}>
                          <Text
                              style={{
                                  color: colors.textPrimary,
                                  fontSize: typography.secondary.md,
                                  fontWeight: typography.weights.semibold,
                              }}
                          >
                              {tagFilterTitle}
                          </Text>

                          {isLoadingTags ? (
                              <ActivityIndicator color={colors.primary} size="small" />
                          ) : null}

                          {!isLoadingTags && availableTags.length === 0 ? (
                              <Text
                                  style={{
                                      color: colors.textSecondary,
                                      fontSize: typography.secondary.sm,
                                  }}
                              >
                                  {noTagsMessage}
                              </Text>
                          ) : null}

                          {availableTags.length > 0 ? (
                              <ScrollView
                                  contentContainerStyle={{
                                      gap: spacing.xs,
                                      paddingRight: spacing.xs,
                                  }}
                                  horizontal
                                  keyboardShouldPersistTaps="handled"
                                  showsHorizontalScrollIndicator={false}
                              >
                                  {availableTags.map((tag) => {
                                      const isSelected = selectedTagIds.includes(tag.id);

                                      return (
                                          <Pressable
                                              accessibilityRole="button"
                                              key={`project-search-tag-filter-${tag.id}`}
                                              onPress={() => {
                                                  if (onToggleTag) {
                                                      onToggleTag(tag.id);
                                                  }
                                              }}
                                              style={({ pressed }) => [
                                                  styles.filterPill,
                                                  {
                                                      backgroundColor: isSelected ? colors.secondaryMuted : colors.surface,
                                                      borderColor: isSelected ? colors.secondary : colors.border,
                                                      borderRadius: 999,
                                                      opacity: pressed ? 0.82 : 1,
                                                      paddingHorizontal: spacing.sm,
                                                      paddingVertical: spacing.xs,
                                                  },
                                              ]}
                                          >
                                              <Text
                                                  style={{
                                                      color: isSelected ? colors.textPrimary : colors.textSecondary,
                                                      fontSize: typography.secondary.sm,
                                                      fontWeight: isSelected
                                                          ? typography.weights.semibold
                                                          : typography.weights.medium,
                                                  }}
                                              >
                                                  {tag.name}
                                              </Text>
                                          </Pressable>
                                      );
                                  })}
                              </ScrollView>
                          ) : null}
                      </View>
                  ) : null}

                  {showProjectTypeFilters ? (
                      <View style={{ gap: spacing.xs }}>
                          <Text
                              style={{
                                  color: colors.textPrimary,
                                  fontSize: typography.secondary.md,
                                  fontWeight: typography.weights.semibold,
                              }}
                          >
                              {projectTypeFilterTitle}
                          </Text>

                          <ScrollView
                              contentContainerStyle={{
                                  gap: spacing.xs,
                                  paddingRight: spacing.xs,
                              }}
                              horizontal
                              keyboardShouldPersistTaps="handled"
                              showsHorizontalScrollIndicator={false}
                          >
                              {projectTypeOptions.map((option) => {
                                  const isSelected = selectedProjectTypes.includes(option.value);

                                  return (
                                      <Pressable
                                          accessibilityRole="button"
                                          key={`project-search-type-filter-${option.value}`}
                                          onPress={() => {
                                              if (onToggleProjectType) {
                                                  onToggleProjectType(option.value);
                                              }
                                          }}
                                          style={({ pressed }) => [
                                              styles.filterPill,
                                              {
                                                  backgroundColor: isSelected ? colors.secondaryMuted : colors.surface,
                                                  borderColor: isSelected ? colors.secondary : colors.border,
                                                  borderRadius: 999,
                                                  opacity: pressed ? 0.82 : 1,
                                                  paddingHorizontal: spacing.sm,
                                                  paddingVertical: spacing.xs,
                                              },
                                          ]}
                                      >
                                          <Text
                                              style={{
                                                  color: isSelected ? colors.textPrimary : colors.textSecondary,
                                                  fontSize: typography.secondary.sm,
                                                  fontWeight: isSelected
                                                      ? typography.weights.semibold
                                                      : typography.weights.medium,
                                              }}
                                          >
                                              {option.label}
                                          </Text>
                                      </Pressable>
                                  );
                              })}
                          </ScrollView>
                      </View>
                  ) : null}
              </Accordion>
          ) : null}
      

      {showSearchButton ? (
        <Button
          fullWidth
          iconName="search-outline"
          label={searchButtonLabel}
          onPress={() => {
            if (onSubmit) {
              onSubmit();
            }
          }}
          variant="primary"
        />
      ) : null}
              
    </Card>
  );
}

const styles = StyleSheet.create({
  filterPill: {
    borderWidth: 1,
  },
});