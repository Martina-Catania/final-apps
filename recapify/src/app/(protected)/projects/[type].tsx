import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button, ProjectSearchFilters, ProjectTagPills } from "../../../components";
import { useAuth } from "../../../context/auth-context";
import {
  useProjectDetailNavigation,
  useProjectSearchFilters,
  usePullToRefresh,
  useRefreshControlProps,
  useSafeNavigation,
  useThemeTokens,
} from "../../../hooks";
import { SafeAreaPage } from "../../../screens/safe-area-page";
import { getApiErrorMessage } from "../../../utils/api-request";
import { listDecksRequest } from "../../../utils/deck-api";
import type { ProjectType } from "../../../utils/project-api";
import { filterProjectsBySearchFilters } from "../../../utils/project-search-filters";
import { listQuizzesRequest } from "../../../utils/quiz-api";
import { listSummariesRequest } from "../../../utils/summary-api";
import { projectTagsToFlatTags, type FlatTag } from "../../../utils/tag-utils";

type SelectedType = "quiz" | "flashcard" | "summary";

type ProjectListItem = {
  id: number;
  type: ProjectType;
  title: string;
  summary: string;
  creatorName: string;
  tags: FlatTag[];
};

function getCreatorLabel(username: string | null | undefined) {
  const trimmedUsername = username?.trim();

  if (!trimmedUsername) {
    return "unknown creator";
  }

  return trimmedUsername;
}

function parseSelectedType(value: string | string[] | undefined): SelectedType | null {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (rawValue === "quiz" || rawValue === "flashcard" || rawValue === "summary") {
    return rawValue;
  }

  return null;
}

export default function ProjectsByTypePage() {
  const { type } = useLocalSearchParams<{ type?: string | string[] }>();
  const selectedType = useMemo(() => parseSelectedType(type), [type]);
  const { openProjectDetail } = useProjectDetailNavigation();
  const { goBack } = useSafeNavigation();
  const { token } = useAuth();
  const { colors, spacing, typography, radius } = useThemeTokens();
  const {
    query,
    setQuery,
    availableTags,
    isLoadingTags,
    selectedTagIds,
    toggleTagFilter,
  } = useProjectSearchFilters({
    token: token ?? undefined,
  });

  const [allProjects, setAllProjects] = useState<ProjectListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    if (!selectedType) {
      setAllProjects([]);
      setErrorMessage("Invalid project type");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      if (selectedType === "quiz") {
        const payload = await listQuizzesRequest(token ?? undefined);

        setAllProjects(
          payload.map((quiz) => {
            const questionCount = quiz.questions.length;
            const questionLabel = questionCount === 1 ? "question" : "questions";

            return {
              id: quiz.id,
              type: "QUIZ",
              title: quiz.project.title,
              summary: `${questionCount} ${questionLabel}`,
              creatorName: getCreatorLabel(quiz.project.user?.username),
              tags: projectTagsToFlatTags(quiz.project.tags),
            };
          }),
        );

        return;
      }

      if (selectedType === "flashcard") {
        const payload = await listDecksRequest(token ?? undefined);

        setAllProjects(
          payload.map((deck) => {
            const cardCount = deck.flashcards.length;
            const cardLabel = cardCount === 1 ? "card" : "cards";

            return {
              id: deck.id,
              type: "DECK",
              title: deck.project.title,
              summary: `${cardCount} ${cardLabel}`,
              creatorName: getCreatorLabel(deck.project.user?.username),
              tags: projectTagsToFlatTags(deck.project.tags),
            };
          }),
        );

        return;
      }

      const payload = await listSummariesRequest(token ?? undefined);

      setAllProjects(
        payload.map((summary) => {
          const contentLength = summary.content.trim().length;
          const contentLabel = contentLength === 1 ? "character" : "characters";

          return {
            id: summary.id,
            type: "SUMMARY",
            title: summary.project.title,
            summary: `${contentLength} ${contentLabel}`,
            creatorName: getCreatorLabel(summary.project.user?.username),
            tags: projectTagsToFlatTags(summary.project.tags),
          };
        }),
      );
    } catch (error) {
      const fallbackMessage =
        selectedType === "quiz"
          ? "Unable to load quiz projects"
          : selectedType === "flashcard"
            ? "Unable to load flashcard projects"
            : "Unable to load summary projects";

      setErrorMessage(getApiErrorMessage(error, fallbackMessage));
      setAllProjects([]);
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
        : selectedType === "summary"
          ? "All Summary Projects"
        : "Projects";

  const subtitle =
    selectedType === "quiz"
      ? "See every quiz project and jump into practice quickly."
      : selectedType === "flashcard"
        ? "See every flashcard project and start studying right away."
        : selectedType === "summary"
          ? "See every summary project and jump into read mode."
        : "Invalid project type.";

  const emptyMessage =
    selectedType === "quiz"
      ? "No quiz projects were found."
      : selectedType === "flashcard"
        ? "No flashcard projects were found."
        : "No summary projects were found.";

  const filteredProjects = useMemo(
    () => filterProjectsBySearchFilters(allProjects, {
      query,
      selectedTagIds,
    }),
    [allProjects, query, selectedTagIds],
  );

  const handleBack = useCallback(() => {
    goBack();
  }, [goBack]);

  const openProject = useCallback(
    (projectId: number) => {
      if (selectedType === "summary") {
        openProjectDetail("summary", projectId);
        return;
      }

      if (selectedType) {
        openProjectDetail(selectedType, projectId);
      }
    },
    [openProjectDetail, selectedType],
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
        stickyHeaderIndices={[1]}
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

        <ProjectSearchFilters
          query={query}
          onQueryChange={setQuery}
          queryPlaceholder="Type a project title"
          availableTags={availableTags}
          selectedTagIds={selectedTagIds}
          onToggleTag={toggleTagFilter}
          isLoadingTags={isLoadingTags}
        />

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

        {!isLoading && !errorMessage && filteredProjects.length === 0 ? (
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
              {allProjects.length === 0
                ? emptyMessage
                : "No projects matched the current filters."}
            </Text>
          </View>
        ) : null}

        {!isLoading && !errorMessage && filteredProjects.length > 0 ? (
          <View style={{ gap: spacing.sm }}>
            {filteredProjects.map((project) => (
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
                  By {project.creatorName}
                </Text>

                <ProjectTagPills tags={project.tags} />

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
                  iconName={
                    selectedType === "quiz"
                      ? "help-circle-outline"
                      : selectedType === "flashcard"
                        ? "library-outline"
                        : "document-text-outline"
                  }
                  label={
                    selectedType === "quiz"
                      ? "Open quiz"
                      : selectedType === "flashcard"
                        ? "Open flashcards"
                        : "Open summary"
                  }
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
