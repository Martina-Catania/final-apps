import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "../../../components";
import { useThemeTokens } from "../../../hooks";

export default function CreatePage() {
  const router = useRouter();
  const { colors, spacing, typography, radius } = useThemeTokens();

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
          Create a Project
        </Text>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.secondary.md,
          }}
        >
          Choose what you want to create next.
        </Text>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radius.md,
            gap: spacing.sm,
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
          Quiz
        </Text>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.secondary.md,
          }}
        >
          Create a quiz with questions and distractors.
        </Text>
        <Button
          fullWidth
          iconName="help-circle-outline"
          label="Create quiz"
          onPress={() => router.push("/quiz/create")}
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
            gap: spacing.sm,
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
          Summary
        </Text>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.secondary.md,
          }}
        >
          Create a rich markdown summary with native formatting support.
        </Text>
        <Button
          fullWidth
          iconName="document-text-outline"
          label="Create summary"
          onPress={() => router.push("/summary/create")}
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
            gap: spacing.sm,
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
          Flashcards
        </Text>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.secondary.md,
          }}
        >
          Create a flashcard set with front and back cards.
        </Text>
        <Button
          fullWidth
          iconName="library-outline"
          label="Create flashcards"
          onPress={() => router.push("/flashcard/create")}
          variant="primary"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
});
