import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppButton, BottomNavBar, SkeletonCard } from "../components";
import { useAuth } from "../context/auth-context";
import { useThemeTokens } from "../hooks";
import {
  getQuizApiErrorMessage,
  listQuizzesRequest,
  type Quiz,
} from "../utils/quiz-api";

const NAV_ITEMS = [
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
  {
    key: "projects",
    label: "Projects",
    iconName: "folder-open-outline" as const,
    activeIconName: "folder-open" as const,
  },
];

export default function ProjectsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { colors, spacing, typography, radius } = useThemeTokens();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadQuizzes = async () => {
      setIsLoading(true);
      setErrorMessage(null);

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

        setErrorMessage(getQuizApiErrorMessage(error, "Unable to load projects"));
        setQuizzes([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadQuizzes();

    return () => {
      isMounted = false;
    };
  }, [token]);

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
            Project Showcase
          </Text>

          <AppButton
            iconName="home-outline"
            label="Home"
            onPress={() => router.replace("/")}
            variant="default"
          />
        </View>

        <ScrollView
          contentContainerStyle={{
            gap: spacing.md,
            padding: spacing.lg,
          }}
        >
          {isLoading ? (
            <View style={{ gap: spacing.sm }}>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : null}

          {!isLoading && errorMessage ? (
            <View style={{ gap: spacing.sm }}>
              <Text
                style={{
                  color: colors.danger,
                  fontSize: typography.secondary.md,
                }}
              >
                {errorMessage}
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: typography.secondary.sm,
                }}
              >
                Return to home and try again.
              </Text>
            </View>
          ) : null}

          {!isLoading && !errorMessage && quizzes.length === 0 ? (
            <View style={{ gap: spacing.sm }}>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: typography.secondary.md,
                }}
              >
                No quiz projects found yet.
              </Text>
              <AppButton
                iconName="add-circle-outline"
                label="Create quiz"
                onPress={() => router.push("../quiz/create")}
                variant="primary"
              />
            </View>
          ) : null}

          {!isLoading && !errorMessage && quizzes.length > 0
            ? quizzes.map((quiz) => {
                const questionCount = quiz.questions.length;
                const questionLabel = questionCount === 1 ? "question" : "questions";

                return (
                  <Pressable
                    key={quiz.id}
                    onPress={() => {
                      router.push({
                        pathname: "../quiz/[id]",
                        params: { id: String(quiz.id) },
                      });
                    }}
                    style={({ pressed }) => [
                      styles.projectCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        borderRadius: radius.md,
                        gap: spacing.xs,
                        opacity: pressed ? 0.84 : 1,
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
                      {quiz.project.title}
                    </Text>

                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: typography.secondary.md,
                      }}
                    >
                      {questionCount} {questionLabel}
                    </Text>

                    <Text
                      style={{
                        color: colors.primary,
                        fontSize: typography.secondary.sm,
                        fontWeight: typography.weights.semibold,
                      }}
                    >
                      Open project
                    </Text>
                  </Pressable>
                );
              })
            : null}
        </ScrollView>

        <View
          style={{
            backgroundColor: colors.background,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
          }}
        >
          <BottomNavBar
            activeKey="projects"
            items={NAV_ITEMS}
            onTabPress={(key) => {
              if (key === "home") {
                router.replace("/");
                return;
              }

              if (key === "showcase") {
                router.push("../showcase");
              }
            }}
          />
        </View>
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
  projectCard: {
    borderWidth: 1,
  },
});
