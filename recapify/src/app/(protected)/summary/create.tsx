import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button, SummaryEditor } from "../../../components";
import { AppTextInput } from "../../../components/TextInput";
import { useAuth } from "../../../context/auth-context";
import { useProjectTagEditor, useSafeNavigation, useThemeTokens } from "../../../hooks";
import { SafeAreaPage } from "../../../screens/safe-area-page";
import { getApiErrorMessage } from "../../../utils/api-request";
import { createProjectRequest } from "../../../utils/project-api";
import { isRichTextEmpty } from "../../../utils/rich-text";
import { createSummaryRequest } from "../../../utils/summary-api";

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export default function SummaryCreatePage() {
  const router = useRouter();
  const { goBack } = useSafeNavigation();
  const { token, user } = useAuth();
  const { colors, spacing, typography, radius } = useThemeTokens();

  const [projectTitle, setProjectTitle] = useState("");
  const [summaryContent, setSummaryContent] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    tagInput,
    selectedTags,
    suggestedTags,
    tagsError,
    handleTagInputChange,
    selectSuggestedTag,
    handleAddTag,
    removeSelectedTag,
    clearTagsError,
    syncProjectTags,
  } = useProjectTagEditor({ token: token ?? undefined });

  const validate = () => {
    let isValid = true;

    if (!projectTitle.trim()) {
      setTitleError("Project title is required");
      isValid = false;
    } else {
      setTitleError(null);
    }

    if (isRichTextEmpty(summaryContent)) {
      setContentError("Summary content is required");
      isValid = false;
    } else {
      setContentError(null);
    }

    return isValid;
  };

  const handleSaveSummary = async () => {
    setSubmitError(null);
    clearTagsError();

    if (!token || !user?.id) {
      setSubmitError("You must be signed in to create summaries");
      return;
    }

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const project = await createProjectRequest(
        {
          type: "SUMMARY",
          title: projectTitle.trim(),
          userId: user.id,
        },
        token,
      );

      await syncProjectTags(project.id);

      const summary = await createSummaryRequest(
        {
          projectId: project.id,
          content: summaryContent.trim(),
        },
        token,
      );

      await wait(1000);
      router.replace(`./${summary.id}`);
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "Unable to create summary"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaPage backgroundColor={colors.background}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardAvoiding}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            {
              padding: spacing.lg,
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.md,
                gap: spacing.lg,
                padding: spacing.lg,
              },
            ]}
          >
            <View style={[styles.headerRow, { gap: spacing.sm }]}>
              <Button
                accessibilityLabel="Back"
                iconName="arrow-back-outline"
                onPress={() => goBack()}
                variant="icon"
              />

              <View style={[styles.headerText, { gap: spacing.xs }]}>
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: typography.primary.md,
                    fontWeight: typography.weights.bold,
                  }}
                >
                  Create Summary
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: typography.secondary.md,
                  }}
                >
                  Add a title and content to save your summary project.
                </Text>
              </View>
            </View>

            <AppTextInput
              errorText={titleError ?? undefined}
              helperText="Give this summary project a clear name."
              label="Project title"
              onChangeText={(value) => {
                setProjectTitle(value);
                if (titleError) {
                  setTitleError(null);
                }
              }}
              placeholder="Examples: Chemistry Unit 1"
              value={projectTitle}
            />

            <View style={{ gap: spacing.sm }}>
              <AppTextInput
                errorText={tagsError ?? undefined}
                helperText="Add existing tags or create new ones. Matching is case-insensitive."
                label="Project tags"
                onChangeText={handleTagInputChange}
                onSubmitEditing={() => {
                  void handleAddTag();
                }}
                placeholder="Type a tag name"
                value={tagInput}
              />

              {suggestedTags.length > 0 ? (
                <View style={[styles.rowWrap, { gap: spacing.xs }]}> 
                  {suggestedTags.map((tag) => (
                    <Pressable
                      accessibilityRole="button"
                      key={`summary-suggested-tag-${tag.id}`}
                      onPress={() => selectSuggestedTag(tag)}
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
                      key={`summary-selected-tag-${tag.id}`}
                      onPress={() => removeSelectedTag(tag.id)}
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

            <SummaryEditor
              errorText={contentError ?? undefined}
              helperText={
                Platform.OS === "web"
                  ? "Using plain text fallback on web."
                  : "Use the formatting controls for richer summary notes."
              }
              label="Summary content"
              onChangeValue={(value) => {
                setSummaryContent(value);
                if (contentError) {
                  setContentError(null);
                }
              }}
              placeholder="Write your summary content..."
              value={summaryContent}
            />

            {submitError ? (
              <Text
                style={{
                  color: colors.danger,
                  fontSize: typography.secondary.md,
                }}
              >
                {submitError}
              </Text>
            ) : null}

            <Button
              disabled={isSubmitting}
              fullWidth
              iconName={isSubmitting ? "hourglass-outline" : "save-outline"}
              label={isSubmitting ? "Saving summary..." : "Save summary"}
              onPress={() => {
                void handleSaveSummary();
              }}
              variant="primary"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaPage>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
  headerText: {
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  tagPill: {
    borderWidth: 1,
  },
});
