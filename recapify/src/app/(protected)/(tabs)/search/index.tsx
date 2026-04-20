import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  AppTextInput,
  Button,
  Card,
  ProfileCard,
  ProjectTagPills,
} from "../../../../components";
import { useAuth } from "../../../../context/auth-context";
import {
  useProjectDetailNavigation,
  usePullToRefresh,
  useRefreshControlProps,
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

export default function SearchPage() {
  const router = useRouter();
  const { openApiProjectDetail } = useProjectDetailNavigation();
  const { token } = useAuth();
  const { colors, spacing, typography } = useThemeTokens();

  const [query, setQuery] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [projects, setProjects] = useState<SearchProject[]>([]);
  const [usersPagination, setUsersPagination] = useState<SearchPagination>(() =>
    createInitialPagination(DEFAULT_USERS_LIMIT),
  );
  const [projectsPagination, setProjectsPagination] = useState<SearchPagination>(() =>
    createInitialPagination(DEFAULT_PROJECTS_LIMIT),
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<FlatTag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  const resetSearchState = useCallback(() => {
    setHasSearched(false);
    setUsers([]);
    setProjects([]);
    setUsersPagination(createInitialPagination(DEFAULT_USERS_LIMIT));
    setProjectsPagination(createInitialPagination(DEFAULT_PROJECTS_LIMIT));
  }, []);

  const loadTags = useCallback(async () => {
    if (!token) {
      setAvailableTags([]);
      return;
    }

    setIsLoadingTags(true);

    try {
      const payload = await listTagsRequest(token);
      setAvailableTags(
        uniqueFlatTags(payload.map((tag) => ({ id: tag.id, name: tag.name }))),
      );
    } catch {
      setAvailableTags([]);
    } finally {
      setIsLoadingTags(false);
    }
  }, [token]);

  const toggleTagFilter = useCallback((tagId: number) => {
    setSelectedTagIds((current) => {
      if (current.includes(tagId)) {
        return current.filter((id) => id !== tagId);
      }

      return [...current, tagId];
    });
  }, []);

  const runSearch = useCallback(
    async (rawQuery: string) => {
      if (!token) {
        setErrorMessage("You must be signed in to search.");
        resetSearchState();
        return;
      }

      const nextQuery = rawQuery.trim();

      if (!nextQuery && selectedTagIds.length === 0) {
        setErrorMessage("Enter a project title or username, or choose at least one tag.");
        resetSearchState();
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);
      setHasSearched(true);

      try {
        const payload = await searchRequest(
          {
            query: nextQuery || undefined,
            tagIds: selectedTagIds,
            usersPage: 1,
            usersLimit: DEFAULT_USERS_LIMIT,
            projectsPage: 1,
            projectsLimit: DEFAULT_PROJECTS_LIMIT,
          },
          token,
        );

        setLastQuery(payload.query);
        setUsers(payload.users);
        setProjects(payload.projects);
        setUsersPagination(payload.usersPagination);
        setProjectsPagination(payload.projectsPagination);
      } catch (error) {
        setErrorMessage(getApiErrorMessage(error, "Unable to search right now"));
        resetSearchState();
      } finally {
        setIsLoading(false);
      }
    },
    [resetSearchState, selectedTagIds, token],
  );

  const handleRefresh = useCallback(async () => {
    const queryToRefresh = lastQuery || query.trim();

    if (hasSearched && (queryToRefresh || selectedTagIds.length > 0)) {
      await runSearch(queryToRefresh);
      return;
    }

    setQuery("");
    setLastQuery("");
    setErrorMessage(null);
    resetSearchState();
  }, [hasSearched, lastQuery, query, resetSearchState, runSearch, selectedTagIds.length]);

  useEffect(() => {
    void loadTags();
  }, [loadTags]);

  const { refreshing, onRefresh } = usePullToRefresh(handleRefresh);
  const refreshControlProps = useRefreshControlProps({
    onRefresh,
    refreshing,
  });

  const hasOverflowResults =
    usersPagination.total > DEFAULT_USERS_LIMIT ||
    projectsPagination.total > DEFAULT_PROJECTS_LIMIT;

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

  const projectResultsTitle = useMemo(
    () => `Matching projects (${projectsPagination.total})`,
    [projectsPagination.total],
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.keyboardAvoiding}
    >
      <ScrollView
        contentContainerStyle={{
          gap: spacing.lg,
          padding: spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl {...refreshControlProps} />
        }
      >
        <Card
          style={{
            gap: spacing.md,
            padding: spacing.md,
          }}
        >
          <AppTextInput
            label="Search"
            leftIcon="search-outline"
            onChangeText={setQuery}
            onSubmitEditing={() => {
              void runSearch(query);
            }}
            placeholder="Type a username or project title"
            returnKeyType="search"
            value={query}
          />

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
                keyboardShouldPersistTaps="handled"
                showsHorizontalScrollIndicator={false}
              >
                {availableTags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);

                  return (
                    <Pressable
                      accessibilityRole="button"
                      key={`search-tag-filter-${tag.id}`}
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

          <Button
            fullWidth
            iconName="search-outline"
            label={isLoading ? "Searching..." : "Search"}
            onPress={() => {
              void runSearch(query);
            }}
            variant="primary"
          />
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
              Loading results...
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
              void runSearch(lastQuery || query);
            }}
            variant="primary"
          />
        </Card>
      ) : null}

        {!isLoading && !errorMessage && hasSearched ? (
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
              keyboardShouldPersistTaps="handled"
              showsHorizontalScrollIndicator={false}
            >
              {users.map((userItem) => (
                <Pressable
                  key={`search-user-${userItem.id}`}
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
        </Card>
      ) : null}

      {!isLoading && !errorMessage && hasSearched ? (
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
            {projectResultsTitle}
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
                    key={`search-project-${project.id}`}
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
                      {project.type} · By {project.user.username} · {formatViewCount(project.timesPlayed)}
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
        </Card>
      ) : null}

        {!isLoading && !errorMessage && hasSearched && hasOverflowResults ? (
        <Button
          fullWidth
          iconName="layers-outline"
          label="See all results"
          onPress={() => {
            const effectiveQuery = lastQuery || query.trim();

            if (!effectiveQuery && selectedTagIds.length === 0) {
              return;
            }

            const params: { q?: string; tagIds?: string } = {};
            if (effectiveQuery) {
              params.q = effectiveQuery;
            }

            if (selectedTagIds.length > 0) {
              params.tagIds = selectedTagIds.join(",");
            }

            router.push({
              pathname: "./results",
              params,
            });
          }}
          variant="primary"
        />
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoiding: {
    flex: 1,
  },
  filterPill: {
    borderWidth: 1,
  },
  projectCard: {
    borderWidth: 1,
  },
});
