import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button } from "../../../components";
import { useAuth } from "../../../context/auth-context";
import {
  usePullToRefresh,
  useRefreshControlProps,
  useThemeTokens,
} from "../../../hooks";
import { SafeAreaPage } from "../../../screens/safe-area-page";
import { getApiErrorMessage } from "../../../utils/api-request";
import { listDecksRequest } from "../../../utils/deck-api";
import { listQuizzesRequest } from "../../../utils/quiz-api";

type SelectedType = "quiz" | "flashcard";

type ProjectListItem = {
  id: number;
  title: string;
  summary: string;
};

function parseSelectedType(value: string | string[] | undefined): SelectedType | null {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (rawValue === "quiz" || rawValue === "flashcard") {
    return rawValue;
  }

  return null;
}

export default function ProjectsByTypePage() {
  const { type } = useLocalSearchParams<{ type?: string | string[] }>();
  const selectedType = useMemo(() => parseSelectedType(type), [type]);
  const router = useRouter();
  const { token } = useAuth();
  const { colors, spacing, typography, radius } = useThemeTokens();

  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    if (!selectedType) {
      setProjects([]);
      setErrorMessage("Invalid project type");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (selectedType === "quiz") {
        const payload = await listQuizzesRequest(token ?? undefined);

        setProjects(
          payload.map((quiz) => {
            const questionCount = quiz.questions.length;
            const questionLabel = questionCount === 1 ? "question" : "questions";

            return {
              id: quiz.id,
              title: quiz.project.title,
              summary: `${questionCount} ${questionLabel}`,
            };
          }),
        );

        return;
      }

      const payload = await listDecksRequest(token ?? undefined);

      setProjects(
        payload.map((deck) => {
          const cardCount = deck.flashcards.length;
          const cardLabel = cardCount === 1 ? "card" : "cards";

          return {
            id: deck.id,
            title: deck.project.title,
            summary: `${cardCount} ${cardLabel}`,
          };
        }),
      );
    } catch (error) {
      const fallbackMessage =
        selectedType === "quiz"
          ? "Unable to load quiz projects"
          : "Unable to load flashcard projects";

      setErrorMessage(getApiErrorMessage(error, fallbackMessage));
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedType, token]);

  const { refreshing, onRefresh } = usePullToRefresh(loadProjects);
  const refreshControlProps = useRefreshControlProps({
    onRefresh,
    refreshing,
  });

  const pageTitle =
    selectedType === "quiz"
      ? "All Quiz Projects"
      : selectedType === "flashcard"
        ? "All Flashcard Projects"
        : "Projects";

  const subtitle =
    selectedType === "quiz"
      ? "See every quiz project and jump into practice quickly."
      : selectedType === "flashcard"
        ? "See every flashcard project and start studying right away."
        : "Invalid project type.";

  const emptyMessage =
    selectedType === "quiz"
      ? "No quiz projects were found."
      : "No flashcard projects were found.";

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const openProject = useCallback(
    (projectId: number) => {
      if (selectedType === "quiz") {
        router.push({
          pathname: "../quiz/[id]",
          params: {
            id: String(projectId),
          },
        });
        return;
      }

      if (selectedType === "flashcard") {
        router.push({
          pathname: "../flashcard/[id]",
          params: {
            id: String(projectId),
          },
        });
      }
    },
    [router, selectedType],
  );

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  return (
    <SafeAreaPage backgroundColor={colors.background}>
      <ScrollView
        contentContainerStyle={{
          gap: spacing.lg,
          padding: spacing.lg,
        }}
        refreshControl={
          <RefreshControl {...refreshControlProps} />
        }
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.md,
              gap: spacing.sm,
              padding: spacing.lg,
            },
          ]}
        >
          <View style={[styles.headerRow, { gap: spacing.sm }]}>
            <Button
              iconName="arrow-back-outline"
              label="Back"
              onPress={handleBack}
              variant="icon"
            />
            <Text
              style={{
                color: colors.textPrimary,
                flex: 1,
                fontSize: typography.primary.md,
                fontWeight: typography.weights.bold,
              }}
            >
              {pageTitle}
            </Text>
          </View>

          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.secondary.md,
            }}
          >
            {subtitle}
          </Text>
        </View>

        {isLoading ? (
          <View
            style={[
              styles.card,
              {
                alignItems: "center",
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.md,
                gap: spacing.sm,
                padding: spacing.lg,
              },
            ]}
          >
            <ActivityIndicator color={colors.primary} size="large" />
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.secondary.md,
              }}
            >
              Loading projects...
            </Text>
          </View>
        ) : null}

        {!isLoading && errorMessage ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.md,
                gap: spacing.sm,
                padding: spacing.lg,
              },
            ]}
          >
            <Text
              style={{
                color: colors.danger,
                fontSize: typography.secondary.md,
              }}
            >
              {errorMessage}
            </Text>
            <Button
              fullWidth
              iconName="refresh-outline"
              label="Try again"
              onPress={() => {
                void loadProjects();
              }}
              variant="primary"
            />
          </View>
        ) : null}

        {!isLoading && !errorMessage && projects.length === 0 ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.md,
                gap: spacing.sm,
                padding: spacing.lg,
              },
            ]}
          >
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.secondary.md,
              }}
            >
              {emptyMessage}
            </Text>
          </View>
        ) : null}

        {!isLoading && !errorMessage && projects.length > 0 ? (
          <View style={{ gap: spacing.sm }}>
            {projects.map((project) => (
              <View
                key={`${selectedType ?? "project"}-${project.id}`}
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: radius.md,
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
                  {project.title}
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: typography.secondary.md,
                  }}
                >
                  {project.summary}
                </Text>
                <Button
                  fullWidth
                  iconName={selectedType === "quiz" ? "help-circle-outline" : "library-outline"}
                  label={selectedType === "quiz" ? "Open quiz" : "Open flashcards"}
                  onPress={() => openProject(project.id)}
                  variant="secondary"
                />
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaPage>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
  },
});
