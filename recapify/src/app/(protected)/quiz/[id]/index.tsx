import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppActionSheet, AppModal, Button } from "../../../../components";
import { useAuth } from "../../../../context/auth-context";
import { useThemeTokens } from "../../../../hooks";
import { SafeAreaPage } from "../../../../screens/safe-area-page";
import { getApiErrorMessage } from "../../../../utils/api-request";
import { deleteProjectRequest } from "../../../../utils/project-api";
import {
  getQuizByIdRequest,
  type Quiz,
} from "../../../../utils/quiz-api";

type QuizOption = {
  key: string;
  value: string;
};

type QuizActionValue = "view-creator" | "edit-quiz" | "delete-project";

type QuizActionItem = {
  label: string;
  value: QuizActionValue;
  iconName?: "person-outline" | "create-outline" | "trash-outline";
  destructive?: boolean;
  disabled?: boolean;
};

function shuffle<T>(values: T[]): T[] {
  const next = [...values];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = next[index];
    next[index] = next[swapIndex];
    next[swapIndex] = current;
  }

  return next;
}

function buildQuestionOptions(question: Quiz["questions"][number]): QuizOption[] {
  return shuffle([
    {
      key: `${question.id}-answer`,
      value: question.answer,
    },
    {
      key: `${question.id}-decoy-1`,
      value: question.decoy1,
    },
    {
      key: `${question.id}-decoy-2`,
      value: question.decoy2,
    },
    {
      key: `${question.id}-decoy-3`,
      value: question.decoy3,
    },
  ]);
}

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
  const { token, user } = useAuth();
  const { colors, spacing, typography, radius } = useThemeTokens();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeletePending, setIsDeletePending] = useState(false);

  const optionsByQuestionId = useMemo(() => {
    if (!quiz) {
      return new Map<number, QuizOption[]>();
    }

    return new Map<number, QuizOption[]>(
      quiz.questions.map((question) => [question.id, buildQuestionOptions(question)]),
    );
  }, [quiz]);

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
    setDeleteErrorMessage(null);

    try {
      const payload = await getQuizByIdRequest(quizId, token ?? undefined);
      setQuiz(payload);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to load quiz"));
      setQuiz(null);
    } finally {
      setIsLoading(false);
    }
  }, [quizId, token]);

  useEffect(() => {
    void loadQuiz();
  }, [loadQuiz]);

  const creatorUsername = quiz?.project.user?.username;
  const creatorLabel = quiz
    ? creatorUsername
      ? `@${creatorUsername}`
      : `User #${quiz.project.userId}`
    : "";
  const isOwner = quiz ? user?.id === quiz.project.userId : false;

  const handleOpenCreatorProfile = useCallback(() => {
    if (!quiz) {
      return;
    }

    router.push({
      pathname: "/profile/[id]",
      params: {
        id: String(quiz.project.userId),
      },
    });
  }, [quiz, router]);

  const handleOpenActions = useCallback(() => {
    setIsActionsOpen(true);
  }, []);

  const handleCloseActions = useCallback(() => {
    setIsActionsOpen(false);
  }, []);

  const handleOpenDeleteConfirm = useCallback(() => {
    setIsDeleteConfirmOpen(true);
  }, []);

  const handleCloseDeleteConfirm = useCallback(() => {
    if (isDeletePending) {
      return;
    }

    setIsDeleteConfirmOpen(false);
  }, [isDeletePending]);

  const actionItems = useMemo<QuizActionItem[]>(() => {
    const items: QuizActionItem[] = [
      {
        label: "View creator profile",
        value: "view-creator",
        iconName: "person-outline",
      },
    ];

    if (isOwner) {
      items.push({
        label: "Edit quiz",
        value: "edit-quiz",
        iconName: "create-outline",
      });
      items.push({
        label: "Delete project",
        value: "delete-project",
        iconName: "trash-outline",
        destructive: true,
        disabled: isDeletePending,
      });
    }

    return items;
  }, [isDeletePending, isOwner]);

  const handleSelectAction = useCallback(
    (value: QuizActionValue) => {
      if (!quiz) {
        return;
      }

      if (value === "view-creator") {
        handleOpenCreatorProfile();
        return;
      }

      if (value === "edit-quiz") {
        router.push({
          pathname: "/quiz/[id]/edit",
          params: { id: String(quiz.id) },
        });
        return;
      }

      handleOpenDeleteConfirm();
    },
    [handleOpenCreatorProfile, handleOpenDeleteConfirm, quiz, router],
  );

  const handleConfirmDeleteProject = useCallback(async () => {
    if (!quiz || isDeletePending) {
      return;
    }

    setDeleteErrorMessage(null);
    setIsDeletePending(true);

    try {
      await deleteProjectRequest(quiz.projectId, token ?? undefined);
      setIsDeleteConfirmOpen(false);
      router.replace("../..");
    } catch (error) {
      setDeleteErrorMessage(getApiErrorMessage(error, "Unable to delete project"));
      setIsDeleteConfirmOpen(false);
    } finally {
      setIsDeletePending(false);
    }
  }, [isDeletePending, quiz, router, token]);

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
      <>
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
                  {creatorLabel} · {quiz.questions.length} question{quiz.questions.length === 1 ? "" : "s"}
                </Text>
              </View>

              <Button
                disabled={isDeletePending}
                iconName="ellipsis-vertical-outline"
                label="Actions"
                onPress={handleOpenActions}
                variant="icon"
              />
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
              {deleteErrorMessage ? (
                <Text
                  style={{
                    color: colors.danger,
                    fontSize: typography.secondary.sm,
                  }}
                >
                  {deleteErrorMessage}
                </Text>
              ) : null}
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
                  {(optionsByQuestionId.get(question.id) ?? []).map((option) => (
                    <Text
                      key={option.key}
                      style={{ color: colors.textSecondary, fontSize: typography.secondary.md }}
                    >
                      • {option.value}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <AppActionSheet<QuizActionValue>
          isOpen={isActionsOpen}
          items={actionItems}
          onClose={handleCloseActions}
          onSelect={handleSelectAction}
          title="Quiz actions"
        />

        <AppModal
          actions={[
            {
              iconName: "close-outline",
              label: "Cancel",
              onPress: handleCloseDeleteConfirm,
              variant: "default",
            },
            {
              iconName: "trash-outline",
              label: isDeletePending ? "Deleting..." : "Delete project",
              onPress: () => {
                void handleConfirmDeleteProject();
              },
              variant: "primary",
            },
          ]}
          description="This will permanently remove this project and its quiz data. This action cannot be undone."
          onClose={handleCloseDeleteConfirm}
          title="Delete project?"
          visible={isDeleteConfirmOpen}
        />
      </>
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
