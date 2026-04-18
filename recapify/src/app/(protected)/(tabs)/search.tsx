import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AppTextInput, Button } from "../../../components";
import { useThemeTokens } from "../../../hooks";

export default function SearchPage() {
  const { colors, spacing, typography, radius } = useThemeTokens();
  const [query, setQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    setHasSearched(true);
  };

  return (
    <ScrollView
      contentContainerStyle={{
        gap: spacing.md,
        padding: spacing.lg,
      }}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.md,
            gap: spacing.xs,
            padding: spacing.lg,
          },
        ]}
      >
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: typography.primary.md,
            fontWeight: typography.weights.bold,
          }}
        >
          Search Projects
        </Text>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.secondary.md,
          }}
        >
          Find projects by name. Search results are a placeholder for now.
        </Text>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.md,
            gap: spacing.md,
            padding: spacing.md,
          },
        ]}
      >
        <AppTextInput
          label="Project name"
          leftIcon="search-outline"
          onChangeText={setQuery}
          placeholder="Type a project name"
          value={query}
        />

        <Button
          fullWidth
          iconName="search-outline"
          label="Search projects"
          onPress={handleSearch}
          variant="primary"
        />
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.md,
            gap: spacing.xs,
            padding: spacing.md,
          },
        ]}
      >
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: typography.secondary.lg,
            fontWeight: typography.weights.semibold,
          }}
        >
          Placeholder
        </Text>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.secondary.md,
          }}
        >
          {hasSearched
            ? `Search for "${query.trim() || "your query"}" will be available soon.`
            : "Enter a project name above to preview the search flow."}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
});
