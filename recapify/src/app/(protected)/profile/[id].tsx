import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button, ProfileCard } from "../../../components";
import { useAuth } from "../../../context/auth-context";
import { useThemeTokens } from "../../../hooks";
import {
  followUserRequest,
  getUserApiErrorMessage,
  getUserProfileRequest,
  type ProfileProject,
  unfollowUserRequest,
  type UserProfileSummary,
} from "../../../utils/user-api";
import { getApiHostUrl } from "../../../utils/api-config";
import { SafeAreaPage } from "../../../screens/safe-area-page";

function parseUserId(value: string | string[] | undefined): number | null {
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

function canOpenProject(project: ProfileProject) {
  const hasQuizId = typeof project.quizId === "number" && project.quizId > 0;
  const hasDeckId = typeof project.deckId === "number" && project.deckId > 0;

  return (project.type === "QUIZ" && hasQuizId) || (project.type === "DECK" && hasDeckId);
}

export default function ProfilePage() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const profileUserId = useMemo(() => parseUserId(id), [id]);
  const router = useRouter();
  const { token, user } = useAuth();
  const { colors, spacing, typography, radius } = useThemeTokens();

  const [profile, setProfile] = useState<UserProfileSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmittingFollow, setIsSubmittingFollow] = useState(false);

  const isOwnProfile = profile?.user.id === user?.id;

  const loadProfile = useCallback(async () => {
    if (!profileUserId) {
      setErrorMessage("Invalid user id");
      setIsLoading(false);
      return;
    }

    if (!token) {
      setErrorMessage("You must be signed in to view profiles");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const payload = await getUserProfileRequest(profileUserId, token);
      setProfile(payload);
    } catch (error) {
      setProfile(null);
      setErrorMessage(getUserApiErrorMessage(error, "Unable to load profile"));
    } finally {
      setIsLoading(false);
    }
  }, [profileUserId, token]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
    }, [loadProfile]),
  );

  const handleFollowToggle = async () => {
    if (!token || !profile || isOwnProfile) {
      return;
    }

    setIsSubmittingFollow(true);

    try {
      if (profile.isFollowing) {
        await unfollowUserRequest(profile.user.id, token);
      } else {
        await followUserRequest(profile.user.id, token);
      }

      await loadProfile();
    } catch (error) {
      setErrorMessage(getUserApiErrorMessage(error, "Unable to update follow status"));
    } finally {
      setIsSubmittingFollow(false);
    }
  };

  const openProject = (project: ProfileProject) => {
    if (!canOpenProject(project)) {
      return;
    }

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

  if (errorMessage || !profile) {
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
            Profile could not be loaded
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
              iconName="refresh-outline"
              label="Try again"
              onPress={() => {
                void loadProfile();
              }}
              variant="primary"
            />
            <Button
              fullWidth
              iconName="home-outline"
              label="Back to home"
              onPress={() => router.replace("..")}
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
        <View style={[styles.rowBetween, { gap: spacing.sm }]}>
          <Button
            iconName="arrow-back-outline"
            label="Back"
            onPress={() => router.back()}
            variant="icon"
          />
          {isOwnProfile ? (
            <Button
              iconName="settings-outline"
              label="Settings"
              onPress={() => router.push("/settings")}
              variant="secondary"
            />
          ) : null}
        </View>

        <ProfileCard
          avatarUri={resolveAvatarUri(profile.user.avatarUrl)}
          followers={profile.stats.followerCount}
          following={profile.stats.followingCount}
          followButtonDisabled={isSubmittingFollow}
          followButtonLabel={
            isSubmittingFollow
              ? profile.isFollowing
                ? "Unfollowing..."
                : "Following..."
              : profile.isFollowing
                ? "Unfollow"
                : "Follow"
          }
          onFollowPress={() => {
            void handleFollowToggle();
          }}
          projects={profile.stats.projectCount}
          showFollowButton={!isOwnProfile}
          username={profile.user.username || "unknown"}
        />

        {errorMessage ? (
          <Text
            style={{
              color: colors.danger,
              fontSize: typography.secondary.md,
            }}
          >
            {errorMessage}
          </Text>
        ) : null}

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
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: typography.primary.sm,
              fontWeight: typography.weights.bold,
            }}
          >
            Created projects
          </Text>

          {profile.projects.length === 0 ? (
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.secondary.md,
              }}
            >
              No projects created yet.
            </Text>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {profile.projects.map((project) => {
                const isQuizProject = project.type === "QUIZ";
                const isDeckProject = project.type === "DECK";
                const isOpenable = canOpenProject(project);

                return (
                  <Pressable
                    key={project.id}
                    onPress={() => openProject(project)}
                    style={({ pressed }) => [
                      styles.projectCard,
                      {
                        backgroundColor: colors.surfaceMuted,
                        borderColor: colors.border,
                        borderRadius: radius.sm,
                        gap: spacing.xs,
                        opacity: isOpenable && pressed ? 0.86 : 1,
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
                        fontSize: typography.secondary.sm,
                      }}
                    >
                      {project.type} · {project.views} view{project.views === 1 ? "" : "s"}
                    </Text>

                    <Text
                      style={{
                        color: isOpenable ? colors.primary : colors.textSecondary,
                        fontSize: typography.secondary.sm,
                        fontWeight: typography.weights.medium,
                      }}
                    >
                      {isOpenable
                        ? "Open project"
                        : isQuizProject
                          ? "Quiz not linked yet"
                          : isDeckProject
                            ? "Flashcard set not linked yet"
                          : "Open view not available yet"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
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
    borderWidth: 1,
  },
  projectCard: {
    borderWidth: 1,
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
