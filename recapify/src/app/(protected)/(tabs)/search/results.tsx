import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  Button,
  Card,
  Pagination,
  ProfileCard,
  ProjectTagPills,
} from "../../../../components";
import { useAuth } from "../../../../context/auth-context";
import {
  useProjectDetailNavigation,
  usePullToRefresh,
  useRefreshControlProps,
  useSafeNavigation,
  useThemeTokens,
} from "../../../../hooks";
import { getApiHostUrl } from "../../../../utils/api-config";
import { getApiErrorMessage } from "../../../../utils/api-request";
import { listTagsRequest } from "../../../../utils/tag-api";
import { uniqueFlatTags, type FlatTag } from "../../../../utils/tag-utils";
import {
  searchRequest,
  type SearchPagination,
  type SearchProject,
  type SearchUser,
} from "../../../../utils/search-api";

const DEFAULT_USERS_LIMIT = 10;
const DEFAULT_PROJECTS_LIMIT = 20;
const API_HOST = getApiHostUrl();

function parseQueryParam(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (!rawValue) {
    return "";
  }

  return rawValue.trim();
}

function parseTagIdsParam(value: string | string[] | undefined) {
  const rawValues = Array.isArray(value) ? value : value ? [value] : [];
  const tagIds = new Set<number>();

  for (const rawValue of rawValues) {
    const chunks = rawValue.split(",");

    for (const chunk of chunks) {
      const parsedValue = Number.parseInt(chunk.trim(), 10);

      if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
        continue;
      }

      tagIds.add(parsedValue);
    }
  }

  return [...tagIds];
}

function createInitialPagination(limit: number): SearchPagination {
  return {
    page: 1,
    limit,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  };
}

function resolveAvatarUri(avatarUrl: string | null) {
  if (!avatarUrl) {
    return undefined;
  }

  if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
    return avatarUrl;
  }

  return `${API_HOST}${avatarUrl}`;
}

function canOpenProject(project: SearchProject) {
  const hasQuizId = typeof project.quizId === "number" && project.quizId > 0;
  const hasSummaryId = typeof project.summaryId === "number" && project.summaryId > 0;
  const hasDeckId = typeof project.deckId === "number" && project.deckId > 0;

  return (
    (project.type === "QUIZ" && hasQuizId)
    || (project.type === "SUMMARY" && hasSummaryId)
    || (project.type === "DECK" && hasDeckId)
  );
}

function getProjectOpenLabel(project: SearchProject) {
  if (project.type === "QUIZ") {
    return "Open quiz";
  }

  if (project.type === "DECK") {
    return "Open flashcards";
  }

  return "Open summary";
}

function formatViewCount(timesPlayed: number) {
  return `${timesPlayed} ${timesPlayed === 1 ? "view" : "views"}`;
}

export default function SearchResultsPage() {
  const router = useRouter();
  const { openApiProjectDetail } = useProjectDetailNavigation();
  const { goBack } = useSafeNavigation();
  const { q, tagIds } = useLocalSearchParams<{ q?: string | string[]; tagIds?: string | string[] }>();
  const searchQuery = useMemo(() => parseQueryParam(q), [q]);
  const routeTagIds = useMemo(() => parseTagIdsParam(tagIds), [tagIds]);

  const { token } = useAuth();
  const { colors, spacing, typography } = useThemeTokens();

  const [usersPage, setUsersPage] = useState(1);
  const [projectsPage, setProjectsPage] = useState(1);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [projects, setProjects] = useState<SearchProject[]>([]);
  const [usersPagination, setUsersPagination] = useState<SearchPagination>(() =>
    createInitialPagination(DEFAULT_USERS_LIMIT),
  );
  const [projectsPagination, setProjectsPagination] = useState<SearchPagination>(() =>
    createInitialPagination(DEFAULT_PROJECTS_LIMIT),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<FlatTag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(routeTagIds);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  const toggleTagFilter = useCallback((tagId: number) => {
    setSelectedTagIds((current) => {
      if (current.includes(tagId)) {
        return current.filter((id) => id !== tagId);
      }

      return [...current, tagId];
    });
  }, []);

  const loadTags = useCallback(async () => {
    if (!token) {
      setAvailableTags([]);
      return;
    }

    setIsLoadingTags(true);

    try {
      const payload = await listTagsRequest(token);
      setAvailableTags(uniqueFlatTags(payload.map((tag) => ({ id: tag.id, name: tag.name }))));
    } catch {
      setAvailableTags([]);
    } finally {
      setIsLoadingTags(false);
    }
  }, [token]);

  const clearResults = useCallback(() => {
    setUsers([]);
    setProjects([]);
    setUsersPagination(createInitialPagination(DEFAULT_USERS_LIMIT));
    setProjectsPagination(createInitialPagination(DEFAULT_PROJECTS_LIMIT));
  }, []);

  const loadResults = useCallback(async () => {
    if (!token) {
      setErrorMessage("You must be signed in to search.");
      clearResults();
      setIsLoading(false);
      return;
    }

    if (!searchQuery && selectedTagIds.length === 0) {
      setErrorMessage("Missing search query or selected tags.");
      clearResults();
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const payload = await searchRequest(
        {
          query: searchQuery || undefined,
          tagIds: selectedTagIds,
          usersPage,
          usersLimit: DEFAULT_USERS_LIMIT,
          projectsPage,
          projectsLimit: DEFAULT_PROJECTS_LIMIT,
        },
        token,
      );

      setUsers(payload.users);
      setProjects(payload.projects);
      setUsersPagination(payload.usersPagination);
      setProjectsPagination(payload.projectsPagination);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to load search results"));
      clearResults();
    } finally {
      setIsLoading(false);
    }
  }, [clearResults, projectsPage, searchQuery, selectedTagIds, token, usersPage]);

  useEffect(() => {
    setSelectedTagIds(routeTagIds);
  }, [routeTagIds]);

  useEffect(() => {
    setUsersPage(1);
    setProjectsPage(1);
  }, [searchQuery, selectedTagIds]);

  useEffect(() => {
    void loadResults();
  }, [loadResults]);

  useEffect(() => {
    void loadTags();
  }, [loadTags]);

  const { refreshing, onRefresh } = usePullToRefresh(loadResults);
  const refreshControlProps = useRefreshControlProps({
    onRefresh,
    refreshing,
  });

  const openUserProfile = useCallback(
    (userId: number) => {
      router.push({
        pathname: "/profile/[id]",
        params: {
          id: String(userId),
        },
      });
    },
    [router],
  );

  const openProject = useCallback(
    (project: SearchProject) => {
      openApiProjectDetail({
        projectType: project.type,
        quizId: project.quizId,
        deckId: project.deckId,
        summaryId: project.summaryId,
      });
    },
    [openApiProjectDetail],
  );

  const showEmptyState = !isLoading && !errorMessage && users.length === 0 && projects.length === 0;

  return (
    <ScrollView
      contentContainerStyle={{
        gap: spacing.lg,
        padding: spacing.lg,
      }}
      refreshControl={
        <RefreshControl {...refreshControlProps} />
      }
    >
      <Card
        style={{
          gap: spacing.sm,
          padding: spacing.lg,
        }}
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
            All results
          </Text>
        </View>

        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.secondary.md,
          }}
        >
          Showing all results for: {searchQuery || "your search"}.
        </Text>

        <View style={{ gap: spacing.xs }}>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: typography.secondary.md,
              fontWeight: typography.weights.semibold,
            }}
          >
            Filter by tags
          </Text>

          {isLoadingTags ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : null}

          {!isLoadingTags && availableTags.length === 0 ? (
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.secondary.sm,
              }}
            >
              No tags available yet.
            </Text>
          ) : null}

          {availableTags.length > 0 ? (
            <ScrollView
              contentContainerStyle={{
                gap: spacing.xs,
                paddingRight: spacing.xs,
              }}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {availableTags.map((tag) => {
                const isSelected = selectedTagIds.includes(tag.id);

                return (
                  <Pressable
                    accessibilityRole="button"
                    key={`results-tag-filter-${tag.id}`}
                    onPress={() => toggleTagFilter(tag.id)}
                    style={({ pressed }) => [
                      styles.filterPill,
                      {
                        backgroundColor: isSelected ? colors.secondaryMuted : colors.surface,
                        borderColor: isSelected ? colors.secondary : colors.border,
                        borderRadius: 999,
                        opacity: pressed ? 0.82 : 1,
                        paddingHorizontal: spacing.sm,
                        paddingVertical: spacing.xs,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: isSelected ? colors.textPrimary : colors.textSecondary,
                        fontSize: typography.secondary.sm,
                        fontWeight: isSelected
                          ? typography.weights.semibold
                          : typography.weights.medium,
                      }}
                    >
                      {tag.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

        </View>
      </Card>

      {isLoading ? (
        <Card
          style={{
            alignItems: "center",
            gap: spacing.sm,
            padding: spacing.lg,
          }}
        >
          <ActivityIndicator color={colors.primary} size="large" />
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.secondary.md,
            }}
          >
            Loading all results...
          </Text>
        </Card>
      ) : null}

      {!isLoading && errorMessage ? (
        <Card
          style={{
            gap: spacing.sm,
            padding: spacing.lg,
          }}
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
              void loadResults();
            }}
            variant="primary"
          />
        </Card>
      ) : null}

      {showEmptyState ? (
        <Card
          style={{
            gap: spacing.sm,
            padding: spacing.lg,
          }}
        >
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.secondary.md,
            }}
          >
            No users or projects matched this query.
          </Text>
        </Card>
      ) : null}

      {!isLoading && !errorMessage ? (
        <Card
          style={{
            gap: spacing.md,
            padding: spacing.md,
          }}
        >
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: typography.primary.sm,
              fontWeight: typography.weights.bold,
            }}
          >
            Matching users ({usersPagination.total})
          </Text>

          {users.length === 0 ? (
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.secondary.md,
              }}
            >
              No users matched this search.
            </Text>
          ) : (
            <ScrollView
              contentContainerStyle={{
                gap: spacing.md,
                paddingRight: spacing.xs,
              }}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {users.map((userItem) => (
                <Pressable
                  key={`results-user-${userItem.id}`}
                  onPress={() => openUserProfile(userItem.id)}
                  style={({ pressed }) => [
                    {
                      opacity: pressed ? 0.85 : 1,
                      width: 280,
                    },
                  ]}
                >
                  <ProfileCard
                    avatarUri={resolveAvatarUri(userItem.avatarUrl)}
                    followers={userItem.followerCount}
                    following={userItem.followingCount}
                    projects={userItem.projectCount}
                    showFollowButton={false}
                    username={userItem.username}
                  />
                </Pressable>
              ))}
            </ScrollView>
          )}

          {usersPagination.totalPages > 1 ? (
            <Pagination
              currentPage={usersPagination.page}
              onPageChange={setUsersPage}
              totalPages={usersPagination.totalPages}
            />
          ) : null}
        </Card>
      ) : null}

      {!isLoading && !errorMessage ? (
        <Card
          style={{
            gap: spacing.md,
            padding: spacing.md,
          }}
        >
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: typography.primary.sm,
              fontWeight: typography.weights.bold,
            }}
          >
            Matching projects ({projectsPagination.total})
          </Text>

          {projects.length === 0 ? (
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.secondary.md,
              }}
            >
              No projects matched this search.
            </Text>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {projects.map((project) => {
                const isOpenable = canOpenProject(project);

                return (
                  <View
                    key={`results-project-${project.id}`}
                    style={[
                      styles.projectCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        borderRadius: 14,
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
                      {project.type} · By @{project.user.username} · {formatViewCount(project.timesPlayed)}
                    </Text>

                    <ProjectTagPills tags={project.tags} />

                    <Button
                      disabled={!isOpenable}
                      fullWidth
                      iconName={
                        project.type === "QUIZ"
                          ? "help-circle-outline"
                          : project.type === "DECK"
                            ? "library-outline"
                            : "document-text-outline"
                      }
                      label={isOpenable ? getProjectOpenLabel(project) : "Project not linked yet"}
                      onPress={() => {
                        if (!isOpenable) {
                          return;
                        }

                        openProject(project);
                      }}
                      variant={isOpenable ? "secondary" : "disabled"}
                    />
                  </View>
                );
              })}
            </View>
          )}

          {projectsPagination.totalPages > 1 ? (
            <Pagination
              currentPage={projectsPagination.page}
              onPageChange={setProjectsPage}
              totalPages={projectsPagination.totalPages}
            />
          ) : null}
        </Card>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  filterPill: {
    borderWidth: 1,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  projectCard: {
    borderWidth: 1,
  },
});
