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
} from "../../../../components";
import { useAuth } from "../../../../context/auth-context";
import {
  usePullToRefresh,
  useRefreshControlProps,
  useThemeTokens,
} from "../../../../hooks";
import { getApiHostUrl } from "../../../../utils/api-config";
import { getApiErrorMessage } from "../../../../utils/api-request";
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
  const hasDeckId = typeof project.deckId === "number" && project.deckId > 0;

  return (project.type === "QUIZ" && hasQuizId) || (project.type === "DECK" && hasDeckId);
}

function getProjectOpenLabel(project: SearchProject) {
  if (project.type === "QUIZ") {
    return "Open quiz";
  }

  if (project.type === "DECK") {
    return "Open flashcards";
  }

  return "Summary project";
}

function formatViewCount(timesPlayed: number) {
  return `${timesPlayed} ${timesPlayed === 1 ? "view" : "views"}`;
}

export default function SearchResultsPage() {
  const router = useRouter();
  const { q } = useLocalSearchParams<{ q?: string | string[] }>();
  const searchQuery = useMemo(() => parseQueryParam(q), [q]);

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

    if (!searchQuery) {
      setErrorMessage("Missing search query.");
      clearResults();
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const payload = await searchRequest(
        {
          query: searchQuery,
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
  }, [clearResults, projectsPage, searchQuery, token, usersPage]);

  useEffect(() => {
    setUsersPage(1);
    setProjectsPage(1);
  }, [searchQuery]);

  useEffect(() => {
    void loadResults();
  }, [loadResults]);

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
      if (project.type === "QUIZ" && project.quizId) {
        router.push({
          pathname: "/quiz/[id]",
          params: {
            id: String(project.quizId),
          },
        });
        return;
      }

      if (project.type === "DECK" && project.deckId) {
        router.push({
          pathname: "/flashcard/[id]",
          params: {
            id: String(project.deckId),
          },
        });
      }
    },
    [router],
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
            onPress={() => router.back()}
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

                    <Button
                      disabled={!isOpenable}
                      fullWidth
                      iconName={project.type === "QUIZ" ? "help-circle-outline" : "library-outline"}
                      label={isOpenable ? getProjectOpenLabel(project) : "Summary project (coming soon)"}
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
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
  },
  projectCard: {
    borderWidth: 1,
  },
});
