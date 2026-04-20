import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import {
  FormActions,
  FormCard,
  FormHeader,
  InlineErrorText,
  ProjectTagEditor,
  SummaryEditor,
} from "../../../../components";
import { AppTextInput } from "../../../../components/TextInput";
import { useAuth } from "../../../../context/auth-context";
import { useProjectTagEditor, useSafeNavigation, useThemeTokens } from "../../../../hooks";
import { EditPageState } from "../../../../screens/edit-page-state";
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
  const { goBack } = useSafeNavigation();
  const { token, user } = useAuth();
  const { colors, spacing } = useThemeTokens();

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

  return (
    <EditPageState
      actions={[
        {
          iconName: "refresh-outline",
          label: "Try again",
          onPress: () => {
            void loadSummary();
          },
          variant: "primary",
        },
        {
          iconName: "arrow-back-outline",
          label: "Back",
          onPress: goBack,
          variant: "default",
        },
      ]}
      backgroundColor={colors.background}
      errorTitle="Summary could not be loaded"
      isLoading={isLoading}
      loadError={loadError}
    >
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
            <FormCard>
              <FormHeader
                onBack={goBack}
                subtitle="Update title and content for this summary."
                title="Edit Summary"
              />

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

            <ProjectTagEditor
              keyPrefix="edit-summary"
              onAddTag={handleAddTag}
              onRemoveSelectedTag={removeSelectedTag}
              onSelectSuggestedTag={selectSuggestedTag}
              onTagInputChange={handleTagInputChange}
              selectedTags={selectedTags}
              suggestedTags={suggestedTags}
              tagInput={tagInput}
              tagsError={tagsError}
            />

            <SummaryEditor
              errorText={contentError ?? undefined}
              helperText={
                Platform.OS === "web"
                  ? "Using plain text fallback on web."
                  : "Use the formatting controls for richer summary notes."
              }
              label="Summary content"
              minHeight={320}
              onChangeValue={(value) => {
                setSummaryContent(value);
                if (contentError) {
                  setContentError(null);
                }
              }}
              value={summaryContent}
            />

              <InlineErrorText message={submitError} size="md" />

              <FormActions
                disabled={isSubmitting}
                isPrimaryLoading={isSubmitting}
                onPrimaryPress={() => {
                  void handleSaveSummary();
                }}
                primaryIconName={isSubmitting ? "hourglass-outline" : "save-outline"}
                primaryLabel="Save changes"
                primaryLoadingLabel="Saving changes..."
              />
            </FormCard>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaPage>
    </EditPageState>
  );
}

const styles = StyleSheet.create({
  keyboardAvoiding: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
});
