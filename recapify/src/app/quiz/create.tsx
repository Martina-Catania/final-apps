import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button } from "../../components";
import { AppTextInput } from "../../components/TextInput";
import { useAuth } from "../../context/auth-context";
import { useThemeTokens } from "../../hooks";
import { SafeAreaPage } from "../../screens/safe-area-page";
import {
  createQuizProjectRequest,
  createQuizQuestionRequest,
  createQuizRequest,
  getQuizApiErrorMessage,
} from "../../utils/quiz-api";

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
  const { token, user } = useAuth();
  const { colors, spacing, typography, radius } = useThemeTokens();

  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState<QuestionDraft[]>([createQuestionDraft(1)]);
  const [nextQuestionIndex, setNextQuestionIndex] = useState(2);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [questionErrors, setQuestionErrors] = useState<Record<string, QuestionFieldErrors>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSaveQuiz = async () => {
    setSubmitError(null);

    if (!token || !user?.id) {
      setSubmitError("You must be signed in to create quizzes");
      return;
    }

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const project = await createQuizProjectRequest(
        {
          title: quizTitle.trim(),
          userId: user.id,
        },
        token,
      );

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
      setSubmitError(getQuizApiErrorMessage(error, "Unable to create quiz"));
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
                  Create Quiz
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: typography.secondary.md,
                  }}
                >
                  Set a quiz name, add questions, and save everything in one step.
                </Text>
              </View>
            </View>

            <AppTextInput
              label="Quiz name"
              onChangeText={setQuizTitle}
              placeholder="Examples: Biology Basics"
              value={quizTitle}
              errorText={titleError ?? undefined}
              helperText="Name your quiz."
            />

            <View style={{ gap: spacing.sm }}>
              <View style={[styles.rowBetween, { gap: spacing.sm }]}>
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: typography.primary.sm,
                    fontWeight: typography.weights.semibold,
                  }}
                >
                  Questions
                </Text>
                <Button
                  iconName="add-circle-outline"
                  label="Add question"
                  onPress={addQuestion}
                  variant="secondary"
                />
              </View>

              {questionsError ? (
                <Text
                  style={{
                    color: colors.danger,
                    fontSize: typography.secondary.sm,
                  }}
                >
                  {questionsError}
                </Text>
              ) : null}

              <View style={{ gap: spacing.md }}>
                {questions.map((item, index) => {
                  const currentErrors = questionErrors[item.key] ?? {};

                  return (
                    <View
                      key={item.key}
                      style={[
                        styles.questionCard,
                        {
                          borderColor: colors.border,
                          borderRadius: radius.sm,
                          gap: spacing.sm,
                          padding: spacing.md,
                        },
                      ]}
                    >
                      <View style={[styles.rowBetween, { gap: spacing.sm }]}>
                        <Text
                          style={{
                            color: colors.textPrimary,
                            fontSize: typography.secondary.lg,
                            fontWeight: typography.weights.semibold,
                          }}
                        >
                          Question {index + 1}
                        </Text>
                        {questions.length > 1 ? (
                          <Button
                            iconName="trash-outline"
                            label="Remove"
                            onPress={() => removeQuestion(item.key)}
                            variant="default"
                          />
                        ) : null}
                      </View>

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
                  );
                })}
              </View>
            </View>

            {submitError ? (
              <Text
                style={{
                  color: colors.danger,
                  fontSize: typography.secondary.sm,
                }}
              >
                {submitError}
              </Text>
            ) : null}

            <View style={[styles.rowWrap, { gap: spacing.sm }]}>
              <Button
                disabled={isSubmitting}
                fullWidth
                iconName="save-outline"
                label={isSubmitting ? "Creating quiz..." : "Save quiz"}
                onPress={() => {
                  void handleSaveQuiz();
                }}
                variant="primary"
              />
            </View>
          </View>
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
  card: {
    alignSelf: "center",
    borderWidth: 1,
    maxWidth: 760,
    width: "100%",
  },
  questionCard: {
    borderWidth: 1,
  },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
  headerText: {
    flex: 1,
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});
