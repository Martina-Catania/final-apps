import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button, SummaryEditor } from "../../../../components";
import { AppTextInput } from "../../../../components/TextInput";
import { useAuth } from "../../../../context/auth-context";
import { useProjectTagEditor, useThemeTokens } from "../../../../hooks";
import { SafeAreaPage } from "../../../../screens/safe-area-page";
import { getApiErrorMessage } from "../../../../utils/api-request";
import { updateProjectRequest } from "../../../../utils/project-api";
import { isRichTextEmpty } from "../../../../utils/rich-text";
import {
  getSummaryByIdRequest,
  updateSummaryRequest,
} from "../../../../utils/summary-api";
import { uniqueFlatTags } from "../../../../utils/tag-utils";

function parseSummaryId(value: string | string[] | undefined): number | null {
  const firstValue = Array.isArray(value) ? value[0] : value;

  if (!firstValue) {
    return null;
  }

  const parsed = Number.parseInt(firstValue, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export default function SummaryEditPage() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const summaryId = useMemo(() => parseSummaryId(id), [id]);
  const router = useRouter();
  const { token, user } = useAuth();
  const { colors, spacing, typography, radius } = useThemeTokens();

  const [projectId, setProjectId] = useState<number | null>(null);
  const [creatorUserId, setCreatorUserId] = useState<number | null>(null);
  const [projectTitle, setProjectTitle] = useState("");
  const [summaryContent, setSummaryContent] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    tagInput,
    selectedTags,
    suggestedTags,
    tagsError,
    handleTagInputChange,
    selectSuggestedTag,
    handleAddTag,
    removeSelectedTag,
    initializeFromProjectTags,
    clearTagState,
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

  const loadSummary = useCallback(async () => {
    if (!summaryId) {
      setLoadError("Invalid summary id");
      setIsLoading(false);
      return;
    }

    if (!token || !user) {
      setLoadError("You must be signed in to edit summaries");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const payload = await getSummaryByIdRequest(summaryId, token ?? undefined);

      if (payload.project.userId !== user.id) {
        setCreatorUserId(payload.project.userId);
        setLoadError("You are not allowed to edit this summary");
        setProjectId(null);
        setProjectTitle("");
        setSummaryContent("");
        clearTagState();
        return;
      }

      setProjectId(payload.projectId);
      setCreatorUserId(payload.project.userId);
      setProjectTitle(payload.project.title);
      setSummaryContent(payload.content);
      const projectTags = uniqueFlatTags(payload.project.tags.map((projectTag) => projectTag.tag));
      initializeFromProjectTags(projectTags);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, "Unable to load summary"));
      setCreatorUserId(null);
      clearTagState();
    } finally {
      setIsLoading(false);
    }
  }, [clearTagState, initializeFromProjectTags, summaryId, token, user]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const handleSaveSummary = async () => {
    setSubmitError(null);
    clearTagsError();

    if (!token || !user) {
      setSubmitError("You must be signed in to edit summaries");
      return;
    }

    if (creatorUserId !== user.id) {
      setSubmitError("You are not allowed to edit this summary");
      return;
    }

    if (!summaryId || !projectId) {
      setSubmitError("Unable to edit this summary");
      return;
    }

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await updateProjectRequest(
        projectId,
        {
          title: projectTitle.trim(),
        },
        token,
      );

      await updateSummaryRequest(
        summaryId,
        {
          content: summaryContent.trim(),
        },
        token,
      );

      await syncProjectTags(projectId);

      router.replace("..");
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "Unable to update summary"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaPage backgroundColor={colors.background}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaPage>
    );
  }

  if (loadError) {
    return (
      <SafeAreaPage backgroundColor={colors.background}>
        <View
          style={[
            styles.errorCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.md,
              gap: spacing.md,
              margin: spacing.lg,
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
            Summary could not be loaded
          </Text>
          <Text
            style={{
              color: colors.danger,
              fontSize: typography.secondary.md,
            }}
          >
            {loadError}
          </Text>
          <View style={{ gap: spacing.sm }}>
            <Button
              fullWidth
              iconName="refresh-outline"
              label="Try again"
              onPress={() => {
                void loadSummary();
              }}
              variant="primary"
            />
            <Button
              fullWidth
              iconName="arrow-back-outline"
              label="Back"
              onPress={() => router.back()}
              variant="default"
            />
          </View>
        </View>
      </SafeAreaPage>
    );
  }

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
                onPress={() => router.back()}
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
                  Edit Summary
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: typography.secondary.md,
                  }}
                >
                  Update title and content for this summary.
                </Text>
              </View>
            </View>

            <AppTextInput
              errorText={titleError ?? undefined}
              helperText="Project title visible in listings and profile views."
              label="Project title"
              onChangeText={(value) => {
                setProjectTitle(value);
                if (titleError) {
                  setTitleError(null);
                }
              }}
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
                      key={`edit-summary-suggested-tag-${tag.id}`}
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
                      key={`edit-summary-selected-tag-${tag.id}`}
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
              label={isSubmitting ? "Saving changes..." : "Save changes"}
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
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  errorCard: {
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
