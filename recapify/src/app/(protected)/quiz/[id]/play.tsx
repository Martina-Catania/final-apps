import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button } from "../../../../components";
import { useAuth } from "../../../../context/auth-context";
import { useThemeTokens } from "../../../../hooks";
import { SafeAreaPage } from "../../../../screens/safe-area-page";
import { getApiErrorMessage } from "../../../../utils/api-request";
import { incrementProjectViewsRequest } from "../../../../utils/project-api";
import {
  getQuizByIdRequest,
  type QuizQuestion,
} from "../../../../utils/quiz-api";

type PlayOption = {
  key: string;
  value: string;
};

type PlayQuestion = {
  id: number;
  prompt: string;
  answer: string;
  options: PlayOption[];
};

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

function shuffle(values: string[]) {
  const next = [...values];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = next[index];
    next[index] = next[swapIndex];
    next[swapIndex] = current;
  }

  return next;
}

function buildPlayQuestions(questions: QuizQuestion[], roundKey: number): PlayQuestion[] {
  return questions.map((question) => {
    const options = shuffle([
      question.answer,
      question.decoy1,
      question.decoy2,
      question.decoy3,
    ]).map((value, index) => ({
      key: `${question.id}-${roundKey}-option-${index}`,
      value,
    }));

    return {
      id: question.id,
      prompt: question.question,
      answer: question.answer,
      options,
    };
  });
}

export default function QuizPlayPage() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const quizId = useMemo(() => parseQuizId(id), [id]);
  const router = useRouter();
  const { token } = useAuth();
  const { colors, spacing, typography, radius } = useThemeTokens();

  const [quizTitle, setQuizTitle] = useState("");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [roundKey, setRoundKey] = useState(0);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionKey, setSelectedOptionKey] = useState<string | null>(null);
  const [selectedOptionValue, setSelectedOptionValue] = useState<string | null>(null);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const playQuestions = useMemo(
    () => buildPlayQuestions(quizQuestions, roundKey),
    [quizQuestions, roundKey],
  );

  const currentQuestion =
    currentQuestionIndex >= 0 && currentQuestionIndex < playQuestions.length
      ? playQuestions[currentQuestionIndex]
      : null;

  const isFinished = playQuestions.length > 0 && currentQuestionIndex >= playQuestions.length;

  const goBackOnStack = useCallback(() => {
    const maybeRouter = router as typeof router & { canGoBack?: () => boolean };

    if (typeof maybeRouter.canGoBack === "function" && maybeRouter.canGoBack()) {
      router.back();
      return;
    }

    router.replace("../../..");
  }, [router]);

  const loadQuiz = useCallback(async () => {
    if (!quizId) {
      setErrorMessage("Invalid quiz id");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const payload = await getQuizByIdRequest(quizId, token ?? undefined);
      void incrementProjectViewsRequest(payload.projectId, token ?? undefined).catch(
        () => undefined,
      );

      setQuizTitle(payload.project.title);
      setQuizQuestions(payload.questions);
      setCurrentQuestionIndex(0);
      setSelectedOptionKey(null);
      setSelectedOptionValue(null);
      setCorrectAnswersCount(0);
      setRoundKey(0);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to load quiz"));
      setQuizTitle("");
      setQuizQuestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [quizId, token]);

  useEffect(() => {
    void loadQuiz();
  }, [loadQuiz]);

  const handleSelectAnswer = (option: PlayOption) => {
    if (!currentQuestion || selectedOptionKey) {
      return;
    }

    setSelectedOptionKey(option.key);
    setSelectedOptionValue(option.value);

    if (option.value === currentQuestion.answer) {
      setCorrectAnswersCount((current) => current + 1);
    }
  };

  const handleNextQuestion = () => {
    if (!selectedOptionKey) {
      return;
    }

    setSelectedOptionKey(null);
    setSelectedOptionValue(null);
    setCurrentQuestionIndex((current) => current + 1);
  };

  const handlePlayAgain = () => {
    setRoundKey((current) => current + 1);
    setCurrentQuestionIndex(0);
    setSelectedOptionKey(null);
    setSelectedOptionValue(null);
    setCorrectAnswersCount(0);
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

  if (errorMessage) {
    return (
      <SafeAreaPage backgroundColor={colors.background}>
        <View
          style={[
            styles.card,
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
            Quiz could not be loaded
          </Text>
          <Text
            style={{
              color: colors.danger,
              fontSize: typography.secondary.md,
            }}
          >
            {errorMessage}
          </Text>
          <View style={{ gap: spacing.sm }}>
            <Button
              fullWidth
              iconName="refresh-outline"
              label="Try again"
              onPress={() => {
                void loadQuiz();
              }}
              variant="primary"
            />
            <Button
              fullWidth
              iconName="arrow-back-outline"
              label="Back"
              onPress={goBackOnStack}
              variant="default"
            />
            <Button
              fullWidth
              iconName="home-outline"
              label="Back to home"
              onPress={() => router.replace("../../..")}
              variant="default"
            />
          </View>
        </View>
      </SafeAreaPage>
    );
  }

  if (playQuestions.length === 0) {
    return (
      <SafeAreaPage backgroundColor={colors.background}>
        <View
          style={[
            styles.card,
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
            This quiz has no questions yet
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.secondary.md,
            }}
          >
            Add at least one question before starting quiz mode.
          </Text>
          <View style={{ gap: spacing.sm }}>
            <Button
              fullWidth
              iconName="arrow-back-outline"
              label="Back"
              onPress={goBackOnStack}
              variant="default"
            />
            <Button
              fullWidth
              iconName="home-outline"
              label="Back to home"
              onPress={() => router.replace("../../..")}
              variant="default"
            />
          </View>
        </View>
      </SafeAreaPage>
    );
  }

  if (isFinished) {
    const totalQuestions = playQuestions.length;
    const percentage = Math.round((correctAnswersCount / totalQuestions) * 100);

    return (
      <SafeAreaPage backgroundColor={colors.background}>
        <View
          style={[
            styles.card,
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
              fontSize: typography.primary.lg,
              fontWeight: typography.weights.bold,
            }}
          >
            Quiz complete
          </Text>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: typography.secondary.lg,
              fontWeight: typography.weights.semibold,
            }}
          >
            {correctAnswersCount} / {totalQuestions} correct
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.secondary.md,
            }}
          >
            Score: {percentage}%
          </Text>

          <View style={{ gap: spacing.sm }}>
            <Button
              fullWidth
              iconName="refresh-outline"
              label="Play again"
              onPress={handlePlayAgain}
              variant="primary"
            />
            <Button
              fullWidth
              iconName="home-outline"
              label="Go home"
              onPress={() => router.replace("../../..")}
              variant="default"
            />
          </View>
        </View>
      </SafeAreaPage>
    );
  }

  const isAnswered = selectedOptionKey !== null;
  const isLastQuestion = currentQuestionIndex === playQuestions.length - 1;

  return (
    <SafeAreaPage backgroundColor={colors.background}>
      <ScrollView
        contentContainerStyle={{
          gap: spacing.lg,
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
              gap: spacing.md,
              padding: spacing.lg,
            },
          ]}
        >
          <View style={[styles.rowBetween, { gap: spacing.sm }]}>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.secondary.md,
              }}
            >
              Question {currentQuestionIndex + 1} of {playQuestions.length}
            </Text>
          </View>

          <Text
            style={{
              color: colors.textPrimary,
              fontSize: typography.primary.md,
              fontWeight: typography.weights.bold,
            }}
          >
            {quizTitle}
          </Text>

          <Text
            style={{
              color: colors.textPrimary,
              fontSize: typography.secondary.lg,
              fontWeight: typography.weights.semibold,
            }}
          >
            {currentQuestion?.prompt}
          </Text>

          <View style={{ gap: spacing.sm }}>
            {currentQuestion?.options.map((option) => {
              const isSelected = option.key === selectedOptionKey;
              const isCorrect = option.value === currentQuestion.answer;

              let backgroundColor = colors.surface;
              let borderColor = colors.border;
              let textColor = colors.textPrimary;

              if (isAnswered && isCorrect) {
                backgroundColor = colors.success;
                borderColor = colors.success;
                textColor = colors.textInverse;
              } else if (isAnswered && isSelected && !isCorrect) {
                backgroundColor = colors.danger;
                borderColor = colors.danger;
                textColor = colors.textInverse;
              } else if (isAnswered) {
                backgroundColor = colors.surfaceMuted;
                borderColor = colors.border;
                textColor = colors.textSecondary;
              }

              return (
                <Pressable
                  key={option.key}
                  disabled={isAnswered}
                  onPress={() => handleSelectAnswer(option)}
                  style={({ pressed }) => [
                    styles.optionButton,
                    {
                      backgroundColor,
                      borderColor,
                      borderRadius: radius.sm,
                      opacity: pressed && !isAnswered ? 0.85 : 1,
                      padding: spacing.md,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: textColor,
                      fontSize: typography.secondary.md,
                      fontWeight: typography.weights.semibold,
                    }}
                  >
                    {option.value}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {isAnswered ? (
            <View style={{ gap: spacing.sm }}>
              <Text
                style={{
                  color:
                    selectedOptionValue === currentQuestion?.answer
                      ? colors.success
                      : colors.danger,
                  fontSize: typography.secondary.md,
                  fontWeight: typography.weights.semibold,
                }}
              >
                {selectedOptionValue === currentQuestion?.answer
                  ? "Correct!"
                  : `Incorrect. Correct answer: ${currentQuestion?.answer}`}
              </Text>
              <Button
                fullWidth
                iconName={isLastQuestion ? "checkmark-circle-outline" : "arrow-forward-outline"}
                label={isLastQuestion ? "See results" : "Next question"}
                onPress={handleNextQuestion}
                variant="primary"
              />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaPage>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centered: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  card: {
    alignSelf: "center",
    borderWidth: 1,
    maxWidth: 760,
    width: "100%",
  },
  optionButton: {
    borderWidth: 1,
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
