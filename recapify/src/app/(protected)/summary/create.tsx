import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import {
  FileUploadField,
  FormActions,
  FormCard,
  FormHeader,
  InlineErrorText,
  ProjectTagEditor,
  SummaryEditor,
  type UploadedFile,
} from "../../../components";
import { AppTextInput } from "../../../components/TextInput";
import { useAuth } from "../../../context/auth-context";
import { useProjectTagEditor, useSafeNavigation, useThemeTokens } from "../../../hooks";
import { SafeAreaPage } from "../../../screens/safe-area-page";
import { getApiErrorMessage } from "../../../utils/api-request";
import { createProjectRequest } from "../../../utils/project-api";
import { isRichTextEmpty } from "../../../utils/rich-text";
import { createSummaryRequest, uploadSummaryFileRequest } from "../../../utils/summary-api";

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export default function SummaryCreatePage() {
  const router = useRouter();
  const { goBack } = useSafeNavigation();
  const { token, user } = useAuth();
  const { colors, spacing } = useThemeTokens();

  const [projectTitle, setProjectTitle] = useState("");
  const [summaryContent, setSummaryContent] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingSourceFile, setIsUploadingSourceFile] = useState(false);
  const [selectedSourceFile, setSelectedSourceFile] = useState<UploadedFile | null>(null);

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
    const hasSummaryContent = !isRichTextEmpty(summaryContent);
    const hasSourceFile = selectedSourceFile !== null;

    if (!projectTitle.trim()) {
      setTitleError("Project title is required");
      isValid = false;
    } else {
      setTitleError(null);
    }

    if (!hasSummaryContent && !hasSourceFile) {
      setContentError("Add summary content or upload a source document");
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

      if (selectedSourceFile) {
        setIsUploadingSourceFile(true);

        try {
          await uploadSummaryFileRequest(
            {
              summaryId: summary.id,
              uri: selectedSourceFile.uri,
              name: selectedSourceFile.name,
              mimeType: selectedSourceFile.mimeType,
              webFile: selectedSourceFile.webFile,
            },
            token,
          );
        } catch (error) {
          const uploadError = getApiErrorMessage(
            error,
            "Summary was created, but the document could not be uploaded",
          );

          router.replace(`./${summary.id}?uploadError=${encodeURIComponent(uploadError)}`);
          return;
        } finally {
          setIsUploadingSourceFile(false);
        }
      }

      await wait(1000);
      router.replace(`./${summary.id}`);
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "Unable to create summary"));
    } finally {
      setIsSubmitting(false);
      setIsUploadingSourceFile(false);
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
          <FormCard>
            <FormHeader
              onBack={goBack}
              subtitle="Add a title plus either summary content or a source file."
              title="Create Summary"
            />

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

            <ProjectTagEditor
              keyPrefix="summary"
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
                  : "Use formatting controls for richer notes."
              }
              label="Summary content"
              minHeight={320}
              onChangeValue={(value) => {
                setSummaryContent(value);
                if (contentError) {
                  setContentError(null);
                }
              }}
              placeholder="Write your summary content..."
              value={summaryContent}
            />

            <FileUploadField
              allowedTypes={[
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              ]}
              clearButtonLabel="Clear document"
              helperText="Optional: attach one PDF, DOC, or DOCX file (max 10MB)."
              label="Attach source document"
              onFileSelected={(file) => {
                setSelectedSourceFile(file);

                if (file && contentError) {
                  setContentError(null);
                }

                if (submitError) {
                  setSubmitError(null);
                }
              }}
              pickButtonLabel="Pick document"
            />

            <InlineErrorText message={submitError} size="md" />

            <FormActions
              disabled={isSubmitting || isUploadingSourceFile}
              isPrimaryLoading={isSubmitting || isUploadingSourceFile}
              onPrimaryPress={() => {
                void handleSaveSummary();
              }}
              primaryIconName={isSubmitting || isUploadingSourceFile ? "hourglass-outline" : "save-outline"}
              primaryLabel="Save summary"
              primaryLoadingLabel={isUploadingSourceFile ? "Uploading file..." : "Saving summary..."}
            />
          </FormCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaPage>
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
