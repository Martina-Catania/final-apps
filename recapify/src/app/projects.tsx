import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, DrawerPanel, SkeletonCard } from "../components";
import { useAuth } from "../context/auth-context";
import { useThemeTokens } from "../hooks";
import { AppTabLayout, type AppTabKey } from "../screens/app-tab-layout";
import {
  getQuizApiErrorMessage,
  listQuizzesRequest,
  type Quiz,
} from "../utils/quiz-api";

export default function ProjectsPage() {
  const router = useRouter();
  const { token } = useAuth();
  const { colors, spacing, typography, radius } = useThemeTokens();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

  const handleTabPress = (key: AppTabKey) => {
    if (key === "projects") {
      return;
    }

    if (key === "home") {
      router.replace("/");
      return;
    }

    router.push("../showcase");
  };

  return (
    <AppTabLayout
      activeTab="projects"
      onMenuPress={() => setIsDrawerOpen(true)}
      onTabPress={handleTabPress}
      title="Project Showcase"
    >
      <>
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
            <Button
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
              const creatorLabel =
                (quiz.project.user?.username ? `@${quiz.project.user.username}` : undefined) ||
                quiz.project.user?.name?.trim() ||
                `User #${quiz.project.userId}`;

              return (
                <View
                  key={quiz.id}
                  style={[
                    styles.projectCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderRadius: radius.md,
                      gap: spacing.xs,
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

                  <Pressable
                    onPress={() => {
                      router.push({
                        pathname: "./profile/[id]",
                        params: { id: String(quiz.project.userId) },
                      });
                    }}
                    style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                  >
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: typography.secondary.sm,
                      }}
                    >
                      Created by {creatorLabel}
                    </Text>
                  </Pressable>

                  <Button
                    fullWidth
                    iconName="arrow-forward-outline"
                    label="Open project"
                    onPress={() => {
                      router.push({
                        pathname: "../quiz/[id]",
                        params: { id: String(quiz.id) },
                      });
                    }}
                    variant="default"
                  />
                </View>
              );
            })
          : null}
      </ScrollView>

        <DrawerPanel
          onClose={() => setIsDrawerOpen(false)}
          title="Menu"
          visible={isDrawerOpen}
        >
          <View style={{ gap: spacing.sm }}>
            <Button
              fullWidth
              iconName="home-outline"
              label="Home"
              onPress={() => {
                setIsDrawerOpen(false);
                router.replace("/");
              }}
              variant="default"
            />

            <Button
              fullWidth
              iconName="grid-outline"
              label="Showcase"
              onPress={() => {
                setIsDrawerOpen(false);
                router.push("../showcase");
              }}
              variant="default"
            />

            <Button
              fullWidth
              iconName="add-circle-outline"
              label="Create quiz"
              onPress={() => {
                setIsDrawerOpen(false);
                router.push("../quiz/create");
              }}
              variant="primary"
            />
          </View>
        </DrawerPanel>
      </>
    </AppTabLayout>
  );
}

const styles = StyleSheet.create({
  projectCard: {
    borderWidth: 1,
  },
});
