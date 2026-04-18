import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button } from "../../../components";
import { useAuth } from "../../../context/auth-context";
import { useThemeTokens } from "../../../hooks";
import { SafeAreaPage } from "../../../screens/safe-area-page";
import {
  getQuizApiErrorMessage,
  getQuizByIdRequest,
  type Quiz,
} from "../../../utils/quiz-api";

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

export default function QuizDetailPage() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const quizId = useMemo(() => parseQuizId(id), [id]);
  const router = useRouter();
  const { token } = useAuth();
  const { colors, spacing, typography, radius } = useThemeTokens();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleBackPress = useCallback(() => {
    router.back();
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
      setQuiz(payload);
    } catch (error) {
      setErrorMessage(getQuizApiErrorMessage(error, "Unable to load quiz"));
      setQuiz(null);
    } finally {
      setIsLoading(false);
    }
  }, [quizId, token]);

  useEffect(() => {
    void loadQuiz();
  }, [loadQuiz]);

  if (isLoading) {
    return (
      <SafeAreaPage backgroundColor={colors.background}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaPage>
    );
  }

  if (errorMessage || !quiz) {
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
            Quiz could not be loaded
          </Text>
          <Text
            style={{
              color: colors.danger,
              fontSize: typography.secondary.md,
            }}
          >
            {errorMessage ?? "Unexpected error"}
          </Text>
          <View style={{ gap: spacing.sm }}>
            <Button
              fullWidth
              iconName="arrow-back-outline"
              label="Back"
              onPress={handleBackPress}
              variant="default"
            />
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
              iconName="home-outline"
              label="Back to home"
              onPress={() => router.replace("../..")}
              variant="default"
            />
          </View>
        </View>
      </SafeAreaPage>
    );
  }

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
            styles.headerCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.md,
              gap: spacing.sm,
              padding: spacing.lg,
            },
          ]}
        >
          <View style={[styles.headerInfoRow, { gap: spacing.sm }]}>
            <Button
              iconName="arrow-back-outline"
              label="Back"
              onPress={handleBackPress}
              variant="icon"
            />

            <View style={[styles.headerInfoText, { gap: spacing.xxs }]}>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: typography.primary.lg,
                  fontWeight: typography.weights.bold,
                }}
              >
                {quiz.project.title}
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: typography.secondary.md,
                }}
              >
                Quiz #{quiz.id} · {quiz.questions.length} question{quiz.questions.length === 1 ? "" : "s"}
              </Text>
            </View>
          </View>

          <View style={{ gap: spacing.sm }}>
            <Button
              fullWidth
              iconName="play-outline"
              label="Play quiz"
              onPress={() =>
                router.push({
                  pathname: "/quiz/[id]/play",
                  params: { id: String(quiz.id) },
                })
              }
              variant="secondary"
            />
            <Button
              fullWidth
              iconName="create-outline"
              label="Edit quiz"
              onPress={() =>
                router.push({
                  pathname: "/quiz/[id]/edit",
                  params: { id: String(quiz.id) },
                })
              }
              variant="primary"
            />
            <Button
              fullWidth
              iconName="add-circle-outline"
              label="Create another quiz"
              onPress={() => router.replace("/quiz/create")}
              variant="primary"
            />
          </View>
        </View>

        <View style={{ gap: spacing.md }}>
          {quiz.questions.map((question, index) => (
            <View
              key={question.id}
              style={[
                styles.questionCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: radius.sm,
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
                Question {index + 1}
              </Text>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: typography.secondary.md,
                }}
              >
                {question.question}
              </Text>

              <View style={{ gap: spacing.xs }}>
                <Text
                  style={{
                    color: colors.success,
                    fontSize: typography.secondary.sm,
                    fontWeight: typography.weights.semibold,
                  }}
                >
                  Correct answer
                </Text>
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: typography.secondary.md,
                  }}
                >
                  {question.answer}
                </Text>
              </View>

              <View style={{ gap: spacing.xs }}>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: typography.secondary.sm,
                    fontWeight: typography.weights.semibold,
                  }}
                >
                  Decoys
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: typography.secondary.md }}>
                  • {question.decoy1}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: typography.secondary.md }}>
                  • {question.decoy2}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: typography.secondary.md }}>
                  • {question.decoy3}
                </Text>
              </View>
            </View>
          ))}
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
  errorCard: {
    borderWidth: 1,
  },
  headerCard: {
    borderWidth: 1,
  },
  headerInfoRow: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
  headerInfoText: {
    flex: 1,
  },
  questionCard: {
    borderWidth: 1,
  },
});
