import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Accordion,
  Button,
  FormActions,
  FormCard,
  FormHeader,
  InlineErrorText,
  ProjectTagEditor,
  SectionHeader,
} from "../../../../components";
import { AppTextInput } from "../../../../components/TextInput";
import { useAuth } from "../../../../context/auth-context";
import { useProjectTagEditor, useSafeNavigation, useThemeTokens } from "../../../../hooks";
import { EditPageState } from "../../../../screens/edit-page-state";
import { SafeAreaPage } from "../../../../screens/safe-area-page";
import { getApiErrorMessage } from "../../../../utils/api-request";
import { updateProjectRequest } from "../../../../utils/project-api";
import { uniqueFlatTags } from "../../../../utils/tag-utils";
import {
  createQuizQuestionRequest,
  deleteQuizQuestionRequest,
  getQuizByIdRequest,
  updateQuizQuestionRequest,
} from "../../../../utils/quiz-api";

type QuestionDraft = {
  key: string;
  questionId: number | null;
  question: string;
  answer: string;
  decoy1: string;
  decoy2: string;
  decoy3: string;
};

type QuestionField = Exclude<keyof QuestionDraft, "key" | "questionId">;

type QuestionFieldErrors = Partial<Record<QuestionField, string>>;

function parseQuizId(value: string | string[] | undefined): number | null {
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

function createQuestionDraft(index: number): QuestionDraft {
  return {
    key: `new-${index}`,
    questionId: null,
    question: "",
    answer: "",
    decoy1: "",
    decoy2: "",
    decoy3: "",
  };
}

export default function QuizEditPage() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const quizId = useMemo(() => parseQuizId(id), [id]);
  const router = useRouter();
  const { goBack } = useSafeNavigation();
  const { token, user } = useAuth();
  const { colors, spacing } = useThemeTokens();

  const [projectId, setProjectId] = useState<number | null>(null);
  const [creatorUserId, setCreatorUserId] = useState<number | null>(null);
  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [initialQuestionIds, setInitialQuestionIds] = useState<number[]>([]);
  const [nextQuestionIndex, setNextQuestionIndex] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [questionErrors, setQuestionErrors] = useState<Record<string, QuestionFieldErrors>>({});
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

  const addQuestion = () => {
    setQuestions((current) => [...current, createQuestionDraft(nextQuestionIndex)]);
    setNextQuestionIndex((current) => current + 1);
  };

  const removeQuestion = (key: string) => {
    setQuestions((current) => current.filter((item) => item.key !== key));
    setQuestionErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const updateQuestionField = (
    key: string,
    field: QuestionField,
    value: string,
  ) => {
    setQuestions((current) =>
      current.map((item) => (item.key === key ? { ...item, [field]: value } : item)),
    );

    setQuestionErrors((current) => {
      const nextForQuestion = current[key];

      if (!nextForQuestion || !nextForQuestion[field]) {
        return current;
      }

      return {
        ...current,
        [key]: {
          ...nextForQuestion,
          [field]: undefined,
        },
      };
    });
  };

  const validate = () => {
    let isValid = true;
    const trimmedTitle = quizTitle.trim();

    if (!trimmedTitle) {
      setTitleError("Quiz name is required");
      isValid = false;
    } else {
      setTitleError(null);
    }

    if (questions.length === 0) {
      setQuestionsError("Add at least one question before saving");
      isValid = false;
    } else {
      setQuestionsError(null);
    }

    const nextQuestionErrors: Record<string, QuestionFieldErrors> = {};

    for (const question of questions) {
      const currentErrors: QuestionFieldErrors = {};

      if (!question.question.trim()) {
        currentErrors.question = "Question text is required";
      }

      if (!question.answer.trim()) {
        currentErrors.answer = "Answer is required";
      }

      if (!question.decoy1.trim()) {
        currentErrors.decoy1 = "Decoy 1 is required";
      }

      if (!question.decoy2.trim()) {
        currentErrors.decoy2 = "Decoy 2 is required";
      }

      if (!question.decoy3.trim()) {
        currentErrors.decoy3 = "Decoy 3 is required";
      }

      if (Object.keys(currentErrors).length > 0) {
        nextQuestionErrors[question.key] = currentErrors;
        isValid = false;
      }
    }

    setQuestionErrors(nextQuestionErrors);

    return isValid;
  };

  const loadQuiz = useCallback(async () => {
    if (!quizId) {
      setLoadError("Invalid quiz id");
      setIsLoading(false);
      return;
    }

    if (!token || !user) {
      setLoadError("You must be signed in to edit quizzes");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const payload = await getQuizByIdRequest(quizId, token ?? undefined);

      if (payload.project.userId !== user.id) {
        setCreatorUserId(payload.project.userId);
        setLoadError("You are not allowed to edit this quiz");
        setProjectId(null);
        setQuizTitle("");
        setInitialQuestionIds([]);
        setQuestions([]);
        clearTagState();
        setNextQuestionIndex(1);
        return;
      }

      setProjectId(payload.projectId);
      setCreatorUserId(payload.project.userId);
      setQuizTitle(payload.project.title);
      setInitialQuestionIds(payload.questions.map((item) => item.id));
      const projectTags = uniqueFlatTags(payload.project.tags.map((projectTag) => projectTag.tag));
      initializeFromProjectTags(projectTags);

      const mappedQuestions: QuestionDraft[] = payload.questions.map((item, index) => ({
        key: `existing-${item.id}-${index + 1}`,
        questionId: item.id,
        question: item.question,
        answer: item.answer,
        decoy1: item.decoy1,
        decoy2: item.decoy2,
        decoy3: item.decoy3,
      }));

      if (mappedQuestions.length === 0) {
        setQuestions([createQuestionDraft(1)]);
        setNextQuestionIndex(2);
      } else {
        setQuestions(mappedQuestions);
        setNextQuestionIndex(mappedQuestions.length + 1);
      }
    } catch (error) {
      setLoadError(getApiErrorMessage(error, "Unable to load quiz"));
      setCreatorUserId(null);
      setQuestions([]);
      clearTagState();
    } finally {
      setIsLoading(false);
    }
  }, [clearTagState, initializeFromProjectTags, quizId, token, user]);

  useEffect(() => {
    void loadQuiz();
  }, [loadQuiz]);

  const handleSaveQuiz = async () => {
    setSubmitError(null);
    clearTagsError();

    if (!token || !user) {
      setSubmitError("You must be signed in to edit quizzes");
      return;
    }

    if (creatorUserId !== user.id) {
      setSubmitError("You are not allowed to edit this quiz");
      return;
    }

    if (!quizId || !projectId) {
      setSubmitError("Unable to edit this quiz");
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
          title: quizTitle.trim(),
        },
        token,
      );

      await syncProjectTags(projectId);

      const remainingQuestionIds = new Set(initialQuestionIds);

      for (const question of questions) {
        const payload = {
          question: question.question.trim(),
          answer: question.answer.trim(),
          decoy1: question.decoy1.trim(),
          decoy2: question.decoy2.trim(),
          decoy3: question.decoy3.trim(),
        };

        if (question.questionId) {
          await updateQuizQuestionRequest(question.questionId, payload, token);
          remainingQuestionIds.delete(question.questionId);
        } else {
          await createQuizQuestionRequest(
            {
              quizId,
              ...payload,
            },
            token,
          );
        }
      }

      for (const questionId of remainingQuestionIds) {
        await deleteQuizQuestionRequest(questionId, token);
      }

      router.replace("..");
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "Unable to update quiz"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <EditPageState
      actions={[
        {
          iconName: "home-outline",
          label: "Back to home",
          onPress: () => {
            router.replace("/");
          },
          variant: "default",
        },
        {
          iconName: "refresh-outline",
          label: "Try again",
          onPress: () => {
            void loadQuiz();
          },
          variant: "primary",
        },
      ]}
      backgroundColor={colors.background}
      errorTitle="Quiz could not be loaded"
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
            <FormCard maxWidth={760}>
              <FormHeader
                onBack={goBack}
                subtitle="Update the quiz name and questions. Changes are only saved when you press Save changes."
                title="Edit Quiz"
              />

            <AppTextInput
              label="Quiz name"
              onChangeText={setQuizTitle}
              placeholder="Examples: Biology Basics"
              value={quizTitle}
              errorText={titleError ?? undefined}
              helperText="Rename your quiz."
            />

            <ProjectTagEditor
              keyPrefix="quiz-edit"
              onAddTag={handleAddTag}
              onRemoveSelectedTag={removeSelectedTag}
              onSelectSuggestedTag={selectSuggestedTag}
              onTagInputChange={handleTagInputChange}
              selectedTags={selectedTags}
              suggestedTags={suggestedTags}
              tagInput={tagInput}
              tagsError={tagsError}
            />

              <View style={{ gap: spacing.sm }}>
                <SectionHeader
                  actionIconName="add-circle-outline"
                  actionLabel="Add question"
                  label="Questions"
                  onActionPress={addQuestion}
                />

                <InlineErrorText message={questionsError} />

              <View style={{ gap: spacing.md }}>
                {questions.map((item, index) => {
                  const currentErrors = questionErrors[item.key] ?? {};

                  return (
                    <Accordion
                      defaultExpanded={index === 0}
                      key={item.key}
                      title={`Question ${index + 1}`}
                    >
                      <View style={{ gap: spacing.sm }}>
                        {questions.length > 1 ? (
                          <View style={{ alignItems: "flex-end" }}>
                            <Button
                              iconName="trash-outline"
                              label="Remove"
                              onPress={() => removeQuestion(item.key)}
                              variant="default"
                            />
                          </View>
                        ) : null}

                        <AppTextInput
                          label="Question"
                          onChangeText={(value) => updateQuestionField(item.key, "question", value)}
                          placeholder="Write your question"
                          value={item.question}
                          errorText={currentErrors.question}
                        />

                        <AppTextInput
                          label="Correct answer"
                          onChangeText={(value) => updateQuestionField(item.key, "answer", value)}
                          placeholder="Write the correct answer"
                          value={item.answer}
                          errorText={currentErrors.answer}
                        />

                        <AppTextInput
                          label="Decoy 1"
                          onChangeText={(value) => updateQuestionField(item.key, "decoy1", value)}
                          placeholder="Write a decoy answer"
                          value={item.decoy1}
                          errorText={currentErrors.decoy1}
                        />

                        <AppTextInput
                          label="Decoy 2"
                          onChangeText={(value) => updateQuestionField(item.key, "decoy2", value)}
                          placeholder="Write a decoy answer"
                          value={item.decoy2}
                          errorText={currentErrors.decoy2}
                        />

                        <AppTextInput
                          label="Decoy 3"
                          onChangeText={(value) => updateQuestionField(item.key, "decoy3", value)}
                          placeholder="Write a decoy answer"
                          value={item.decoy3}
                          errorText={currentErrors.decoy3}
                        />
                      </View>
                    </Accordion>
                  );
                })}
              </View>
            </View>

              <InlineErrorText message={submitError} />

              <FormActions
                disabled={isSubmitting}
                isPrimaryLoading={isSubmitting}
                onPrimaryPress={() => {
                  void handleSaveQuiz();
                }}
                onSecondaryPress={goBack}
                primaryIconName="save-outline"
                primaryLabel="Save changes"
                primaryLoadingLabel="Saving changes..."
                secondaryIconName="close-outline"
                secondaryLabel="Cancel"
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
