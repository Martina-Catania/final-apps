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
import {
  type ProjectType,
  listFollowingProjectsRequest,
  type FollowingProject,
} from "../../../utils/project-api";
import {
  PROJECT_TYPE_FILTER_OPTIONS,
  filterProjectsBySearchFilters,
} from "../../../utils/project-search-filters";
import { projectTagsToFlatTags, type FlatTag } from "../../../utils/tag-utils";

type FollowedProjectListItem = {
  id: number;
  entityId: number;
  type: ProjectType;
  targetType: "quiz" | "flashcard" | "summary";
  title: string;
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

function mapFollowingProject(project: FollowingProject): FollowedProjectListItem | null {
  const creatorName = getCreatorLabel(project.user?.username);

  if (project.type === "QUIZ" && project.quiz) {
    return {
      id: project.id,
      entityId: project.quiz.id,
      type: "QUIZ",
      targetType: "quiz",
      title: project.title,
      creatorName,
      tags: projectTagsToFlatTags(project.tags),
    };
  }

  if (project.type === "DECK" && project.deck) {
    return {
      id: project.id,
      entityId: project.deck.id,
      type: "DECK",
      targetType: "flashcard",
      title: project.title,
      creatorName,
      tags: projectTagsToFlatTags(project.tags),
    };
  }

  if (project.type === "SUMMARY" && project.summary) {
    return {
      id: project.id,
      entityId: project.summary.id,
      type: "SUMMARY",
      targetType: "summary",
      title: project.title,
      creatorName,
      tags: projectTagsToFlatTags(project.tags),
    };
  }

  return null;
}

export default function FollowingProjectsPage() {
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
    selectedProjectTypes,
    toggleTagFilter,
    toggleProjectTypeFilter,
  } = useProjectSearchFilters<ProjectType>({
    token: token ?? undefined,
  });

  const [allProjects, setAllProjects] = useState<FollowedProjectListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    if (!token) {
      setAllProjects([]);
      setErrorMessage("You must be signed in to view followed projects");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const payload = await listFollowingProjectsRequest(token);

      setAllProjects(
        payload
          .map(mapFollowingProject)
          .filter((project): project is FollowedProjectListItem => project !== null),
      );
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to load followed projects"));
      setAllProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const { refreshing, onRefresh } = usePullToRefresh(loadProjects);
  const refreshControlProps = useRefreshControlProps({
    onRefresh,
    refreshing,
  });

  const openProject = useCallback(
    (project: FollowedProjectListItem) => {
      openProjectDetail(project.targetType, project.entityId);
    },
    [openProjectDetail],
  );

  const pageSubtitle = useMemo(
    () => "Catch up on projects from creators you follow!",
    [],
  );

  const filteredProjects = useMemo(
    () => filterProjectsBySearchFilters(allProjects, {
      query,
      selectedTagIds,
      selectedProjectTypes,
    }),
    [allProjects, query, selectedProjectTypes, selectedTagIds],
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
              onPress={() => goBack()}
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
              Projects From People You Follow
            </Text>
          </View>

          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.secondary.md,
            }}
          >
            {pageSubtitle}
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
          showProjectTypeFilters
          projectTypeOptions={PROJECT_TYPE_FILTER_OPTIONS}
          selectedProjectTypes={selectedProjectTypes}
          onToggleProjectType={toggleProjectTypeFilter}
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
              Loading followed projects...
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
                ? "No followed projects were found."
                : "No followed projects matched the current filters."}
            </Text>
          </View>
        ) : null}

        {!isLoading && !errorMessage && filteredProjects.length > 0 ? (
          <View style={{ gap: spacing.sm }}>
            {filteredProjects.map((project) => (
              <View
                key={`followed-project-${project.id}`}
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
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: typography.secondary.md,
                      fontWeight: "400",
                    }}
                  >
                    {" "}
                    • By {project.creatorName}
                  </Text>
                </Text>

                <ProjectTagPills tags={project.tags} />

                <Button
                  fullWidth
                  iconName={
                    project.targetType === "quiz"
                      ? "help-circle-outline"
                      : project.targetType === "flashcard"
                        ? "library-outline"
                        : "document-text-outline"
                  }
                  label={
                    project.targetType === "quiz"
                      ? "Open quiz"
                      : project.targetType === "flashcard"
                        ? "Open flashcards"
                        : "Open summary"
                  }
                  onPress={() => openProject(project)}
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
