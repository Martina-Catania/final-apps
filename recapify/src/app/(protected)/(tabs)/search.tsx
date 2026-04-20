import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
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
  Accordion,
  Button,
  Card,
  ProjectSearchFilters,
  ProfileCard,
  ProjectTagPills,
} from "../../../components";
import { useAuth } from "../../../context/auth-context";
import {
  useProjectDetailNavigation,
  useProjectSearchFilters,
  usePullToRefresh,
  useRefreshControlProps,
  useThemeTokens,
} from "../../../hooks";
import { getApiHostUrl } from "../../../utils/api-config";
import { getApiErrorMessage } from "../../../utils/api-request";
import { PROJECT_TYPE_FILTER_OPTIONS } from "../../../utils/project-search-filters";
import {
  searchRequest,
  type SearchProject,
  type SearchUser,
} from "../../../utils/search-api";

const API_HOST = getApiHostUrl();

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

  const [lastQuery, setLastQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [projects, setProjects] = useState<SearchProject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    query,
    setQuery,
    availableTags,
    isLoadingTags,
    selectedTagIds,
    selectedProjectTypes,
    toggleTagFilter,
    toggleProjectTypeFilter,
  } = useProjectSearchFilters<SearchProject["type"]>({
    token: token ?? undefined,
    requireTokenForTags: true,
  });

  const resetSearchState = useCallback(() => {
    setHasSearched(false);
    setUsers([]);
    setProjects([]);
  }, []);

  const runSearch = useCallback(
    async (rawQuery: string) => {
      if (!token) {
        setErrorMessage("You must be signed in to search.");
        resetSearchState();
        return;
      }

      const nextQuery = rawQuery.trim();

      if (!nextQuery && selectedTagIds.length === 0 && selectedProjectTypes.length === 0) {
        setErrorMessage("Enter a project title or username, or choose at least one tag or project type.");
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
            projectTypes: selectedProjectTypes,
          },
          token,
        );

        setLastQuery(payload.query);
        setUsers(payload.users);
        setProjects(payload.projects);
      } catch (error) {
        setErrorMessage(getApiErrorMessage(error, "Unable to search right now"));
        resetSearchState();
      } finally {
        setIsLoading(false);
      }
    },
    [resetSearchState, selectedProjectTypes, selectedTagIds, token],
  );

  const handleRefresh = useCallback(async () => {
    const queryToRefresh = lastQuery || query.trim();

    if (hasSearched && (queryToRefresh || selectedTagIds.length > 0 || selectedProjectTypes.length > 0)) {
      await runSearch(queryToRefresh);
      return;
    }

    setQuery("");
    setLastQuery("");
    setErrorMessage(null);
    resetSearchState();
  }, [
    hasSearched,
    lastQuery,
    query,
    setQuery,
    resetSearchState,
    runSearch,
    selectedProjectTypes.length,
    selectedTagIds.length,
  ]);

  const { refreshing, onRefresh } = usePullToRefresh(handleRefresh);
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
        stickyHeaderIndices={[0]}
        refreshControl={
          <RefreshControl {...refreshControlProps} />
        }
      >
        <ProjectSearchFilters
          query={query}
          onQueryChange={setQuery}
          onSubmit={() => {
            void runSearch(query);
          }}
          queryPlaceholder="Type a username or project title"
          showSearchButton
          searchButtonLabel={isLoading ? "Searching..." : "Search"}
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
          <Accordion
            title={`Matching users (${users.length})`}
            defaultExpanded={users.length > 0}
          >

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
        </Accordion>
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
            Matching projects ({projects.length})
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

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoiding: {
    flex: 1,
  },
  projectCard: {
    borderWidth: 1,
  },
});
