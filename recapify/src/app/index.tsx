import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  AppButton,
  AppToggle,
  BottomNavBar,
  Carousel,
  DrawerPanel,
  SkeletonCard,
} from "../components";
import { useAuth } from "../context/auth-context";
import { useThemePreference } from "../context/theme-context";
import { useThemeTokens } from "../hooks";
import {
  getQuizApiErrorMessage,
  listQuizzesRequest,
  type Quiz,
} from "../utils/quiz-api";

type HomeCarouselItem = {
  id: string;
  quizId: number;
  title: string;
  description: string;
  iconName: "help-circle-outline";
  accentColor: string;
};

const HOME_NAV_ITEMS = [
  {
    key: "home",
    label: "Home",
    iconName: "home-outline" as const,
    activeIconName: "home" as const,
  },
  {
    key: "showcase",
    label: "Showcase",
    iconName: "grid-outline" as const,
    activeIconName: "grid" as const,
  },
];

export default function Index() {
  const router = useRouter();
  const { token, user, logout } = useAuth();
  const { mode, setMode } = useThemePreference();
  const { colors, spacing, typography, radius } = useThemeTokens();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadQuizzes = async () => {
      setIsLoadingQuizzes(true);
      setQuizError(null);

      try {
        const payload = await listQuizzesRequest(token ?? undefined);

        if (!isMounted) {
          return;
        }

        setQuizzes(payload);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setQuizError(getQuizApiErrorMessage(error, "Unable to load quizzes"));
        setQuizzes([]);
      } finally {
        if (isMounted) {
          setIsLoadingQuizzes(false);
        }
      }
    };

    void loadQuizzes();

    return () => {
      isMounted = false;
    };
  }, [reloadTick, token]);

  const quizCarouselItems = useMemo<HomeCarouselItem[]>(() => {
    return quizzes.map((quiz) => {
      const questionCount = quiz.questions.length;
      const questionLabel = questionCount === 1 ? "question" : "questions";

      return {
        id: String(quiz.id),
        quizId: quiz.id,
        title: quiz.project.title,
        description: `${questionCount} ${questionLabel} ready to practice`,
        iconName: "help-circle-outline",
        accentColor: colors.primary,
      };
    });
  }, [colors.primary, quizzes]);

  const handleSignOut = async () => {
    setIsSigningOut(true);

    try {
      await logout();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.screen}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
            },
          ]}
        >
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: typography.primary.lg,
              fontWeight: typography.weights.bold,
            }}
          >
            Recapify
          </Text>

          <AppButton
            iconName="menu-outline"
            label="Menu"
            onPress={() => setIsDrawerOpen(true)}
            variant="default"
          />
        </View>

        <ScrollView
          contentContainerStyle={{
            gap: spacing.lg,
            padding: spacing.lg,
          }}
        >
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.md,
                gap: spacing.xs,
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
              Welcome back{user?.name ? `, ${user.name}` : ""}
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.secondary.md,
              }}
            >
              Jump into your latest quizzes or browse all projects.
            </Text>
          </View>

          <View
            style={[
              styles.section,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.md,
                gap: spacing.md,
                padding: spacing.lg,
              },
            ]}
          >
            <View style={[styles.sectionHeader, { gap: spacing.sm }]}>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: typography.primary.sm,
                  fontWeight: typography.weights.bold,
                }}
              >
                Quiz Showcase
              </Text>

              <AppButton
                iconName="arrow-forward-outline"
                label="See more"
                onPress={() => router.push("./projects")}
                variant="secondary"
              />
            </View>

            {isLoadingQuizzes ? (
              <View style={{ gap: spacing.sm }}>
                <SkeletonCard />
                <SkeletonCard />
              </View>
            ) : null}

            {!isLoadingQuizzes && quizError ? (
              <View style={{ gap: spacing.sm }}>
                <Text
                  style={{
                    color: colors.danger,
                    fontSize: typography.secondary.md,
                  }}
                >
                  {quizError}
                </Text>
                <AppButton
                  iconName="refresh-outline"
                  label="Try again"
                  onPress={() => setReloadTick((current) => current + 1)}
                  variant="default"
                />
              </View>
            ) : null}

            {!isLoadingQuizzes && !quizError && quizCarouselItems.length === 0 ? (
              <View style={{ gap: spacing.sm }}>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: typography.secondary.md,
                  }}
                >
                  No quizzes yet. Create your first quiz to get started.
                </Text>
                <AppButton
                  iconName="add-circle-outline"
                  label="Create quiz"
                  onPress={() => router.push("./quiz/create")}
                  variant="primary"
                />
              </View>
            ) : null}

            {!isLoadingQuizzes && !quizError && quizCarouselItems.length > 0 ? (
              <Carousel
                items={quizCarouselItems}
                onItemPress={(item) => {
                  const selectedQuiz = quizCarouselItems.find(
                    (candidate) => candidate.id === item.id,
                  );

                  if (!selectedQuiz) {
                    return;
                  }

                  router.push({
                    pathname: "./quiz/[id]",
                    params: { id: String(selectedQuiz.quizId) },
                  });
                }}
              />
            ) : null}
          </View>
        </ScrollView>

        <View
          style={{
            backgroundColor: colors.background,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
          }}
        >
          <BottomNavBar
            activeKey="home"
            items={HOME_NAV_ITEMS}
            onTabPress={(key) => {
              if (key === "showcase") {
                router.push("./showcase");
              }
            }}
          />
        </View>

        <DrawerPanel
          onClose={() => setIsDrawerOpen(false)}
          title="Profile"
          visible={isDrawerOpen}
        >
          <View style={{ gap: spacing.md }}>
            <View
              style={[
                styles.profileCard,
                {
                  backgroundColor: colors.surfaceMuted,
                  borderColor: colors.border,
                  borderRadius: radius.sm,
                  gap: spacing.xxs,
                  padding: spacing.md,
                },
              ]}
            >
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: typography.secondary.lg,
                  fontWeight: typography.weights.bold,
                }}
              >
                {user?.name ?? "Current user"}
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: typography.secondary.sm,
                }}
              >
                @{user?.username ?? "unknown"}
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: typography.secondary.sm,
                }}
              >
                {user?.email ?? "No email available"}
              </Text>
            </View>

            <AppToggle
              description={`Current mode: ${mode}`}
              label="Dark theme"
              onValueChange={(nextValue) => setMode(nextValue ? "dark" : "light")}
              value={mode === "dark"}
            />

            <AppButton
              fullWidth
              iconName="grid-outline"
              label="Open component showcase"
              onPress={() => {
                setIsDrawerOpen(false);
                router.push("./showcase");
              }}
              variant="secondary"
            />

            <AppButton
              disabled={isSigningOut}
              fullWidth
              iconName="log-out-outline"
              label={isSigningOut ? "Signing out..." : "Log out"}
              onPress={() => {
                void handleSignOut();
              }}
              variant="default"
            />
          </View>
        </DrawerPanel>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  heroCard: {
    borderWidth: 1,
  },
  section: {
    borderWidth: 1,
  },
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  profileCard: {
    borderWidth: 1,
  },
});
