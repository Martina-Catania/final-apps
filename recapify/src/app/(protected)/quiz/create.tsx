import { useRouter } from "expo-router";
import { useState } from "react";
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
} from "../../../components";
import { AppTextInput } from "../../../components/TextInput";
import { useAuth } from "../../../context/auth-context";
import {
  useCollectionDraft,
  useProjectTagEditor,
  useSafeNavigation,
  useThemeTokens,
} from "../../../hooks";
import { SafeAreaPage } from "../../../screens/safe-area-page";
import { getApiErrorMessage } from "../../../utils/api-request";
import { createProjectRequest } from "../../../utils/project-api";
import {
  createQuizQuestionRequest,
  createQuizRequest,
} from "../../../utils/quiz-api";

type QuestionDraft = {
  key: string;
  question: string;
  answer: string;
  decoy1: string;
  decoy2: string;
  decoy3: string;
};

type QuestionField = Exclude<keyof QuestionDraft, "key">;

type QuestionFieldErrors = Partial<Record<QuestionField, string>>;

function createQuestionDraft(index: number): QuestionDraft {
  return {
    key: `q-${index}`,
    question: "",
    answer: "",
    decoy1: "",
    decoy2: "",
    decoy3: "",
  };
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export default function QuizCreatePage() {
  const router = useRouter();
  const { goBack } = useSafeNavigation();
  const { token, user } = useAuth();
  const { colors, spacing } = useThemeTokens();

  const [quizTitle, setQuizTitle] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    addItem: addQuestion,
    errors: questionErrors,
    items: questions,
    removeItem: removeQuestion,
    setErrors: setQuestionErrors,
    updateField: updateQuestionField,
  } = useCollectionDraft<QuestionDraft, QuestionField>({
    createItem: createQuestionDraft,
    initialItems: [createQuestionDraft(1)],
    initialNextIndex: 2,
  });
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

  const handleSaveQuiz = async () => {
    setSubmitError(null);
    clearTagsError();

    if (!token || !user?.id) {
      setSubmitError("You must be signed in to create quizzes");
      return;
    }

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const project = await createProjectRequest(
        {
          type: "QUIZ",
          title: quizTitle.trim(),
          userId: user.id,
        },
        token,
      );

      await syncProjectTags(project.id);

      const quiz = await createQuizRequest(project.id, token);

      for (const question of questions) {
        await createQuizQuestionRequest(
          {
            quizId: quiz.id,
            question: question.question.trim(),
            answer: question.answer.trim(),
            decoy1: question.decoy1.trim(),
            decoy2: question.decoy2.trim(),
            decoy3: question.decoy3.trim(),
          },
          token,
        );
      }

      await wait(1000);
      router.replace(`./${quiz.id}`);
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "Unable to create quiz"));
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
          <FormCard maxWidth={760}>
            <FormHeader
              onBack={goBack}
              subtitle="Set a quiz name, add questions, and save everything in one step."
              title="Create Quiz"
            />

            <AppTextInput
              label="Quiz name"
              onChangeText={setQuizTitle}
              placeholder="Examples: Biology Basics"
              value={quizTitle}
              errorText={titleError ?? undefined}
              helperText="Name your quiz."
            />

            <ProjectTagEditor
              keyPrefix="quiz"
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
              primaryIconName="save-outline"
              primaryLabel="Save quiz"
              primaryLoadingLabel="Creating quiz..."
            />
          </FormCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaPage>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
});
