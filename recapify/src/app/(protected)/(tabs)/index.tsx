import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  Button,
  Card,
  Carousel,
  SkeletonCard,
} from "../../../components";
import { useAuth } from "../../../context/auth-context";
import {
  usePullToRefresh,
  useRefreshControlProps,
  useThemeTokens,
} from "../../../hooks";
import { getApiErrorMessage } from "../../../utils/api-request";
import {
  listDecksRequest,
  type Deck,
} from "../../../utils/deck-api";
import {
  listFollowingProjectsRequest,
  type FollowingProject,
} from "../../../utils/project-api";
import {
  listQuizzesRequest,
  type Quiz,
} from "../../../utils/quiz-api";
import { projectTagsToFlatTags, type FlatTag } from "../../../utils/tag-utils";

type HomeCarouselItem = {
  id: string;
  entityId: number;
  targetType: "quiz" | "flashcard";
  title: string;
  description: string;
  tags: FlatTag[];
  iconName: "help-circle-outline" | "library-outline";
  accentColor: string;
};

function getCreatorLabel(username: string | null | undefined) {
  const trimmedUsername = username?.trim();

  if (!trimmedUsername) {
    return "unknown creator";
  }

  return trimmedUsername;
}

export default function Index() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { colors, spacing, typography } = useThemeTokens();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoadingDecks, setIsLoadingDecks] = useState(true);
  const [deckError, setDeckError] = useState<string | null>(null);
  const [followingProjects, setFollowingProjects] = useState<FollowingProject[]>([]);
  const [isLoadingFollowingProjects, setIsLoadingFollowingProjects] = useState(true);
  const [followingProjectsError, setFollowingProjectsError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const loadQuizzes = async () => {
      setIsLoadingQuizzes(true);
      setQuizError(null);

      try {
        const payload = await listQuizzesRequest(token ?? undefined);
        setQuizzes(payload);
      } catch (error) {
        setQuizError(getApiErrorMessage(error, "Unable to load quizzes"));
        setQuizzes([]);
      } finally {
        setIsLoadingQuizzes(false);
      }
    };

    const loadDecks = async () => {
      setIsLoadingDecks(true);
      setDeckError(null);

      try {
        const payload = await listDecksRequest(token ?? undefined);
        setDecks(payload);
      } catch (error) {
        setDeckError(getApiErrorMessage(error, "Unable to load flashcards"));
        setDecks([]);
      } finally {
        setIsLoadingDecks(false);
      }
    };

    const loadFollowingProjects = async () => {
      setIsLoadingFollowingProjects(true);
      setFollowingProjectsError(null);

      if (!token) {
        setFollowingProjects([]);
        setIsLoadingFollowingProjects(false);
        return;
      }

      try {
        const payload = await listFollowingProjectsRequest(token);
        setFollowingProjects(payload);
      } catch (error) {
        setFollowingProjectsError(
          getApiErrorMessage(error, "Unable to load projects from people you follow"),
        );
        setFollowingProjects([]);
      } finally {
        setIsLoadingFollowingProjects(false);
      }
    };

    await Promise.all([loadQuizzes(), loadDecks(), loadFollowingProjects()]);
  }, [token]);

  const { refreshing, onRefresh } = usePullToRefresh(loadData);
  const refreshControlProps = useRefreshControlProps({
    onRefresh,
    refreshing,
  });

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const quizCarouselItems = useMemo<HomeCarouselItem[]>(() => {
    return quizzes.map((quiz) => {
      const questionCount = quiz.questions.length;
      const questionLabel = questionCount === 1 ? "question" : "questions";
      const creatorLabel = getCreatorLabel(quiz.project.user?.username);

      return {
        id: String(quiz.id),
        entityId: quiz.id,
        targetType: "quiz",
        title: quiz.project.title,
        description: `By ${creatorLabel} · ${questionCount} ${questionLabel} ready to practice`,
        tags: projectTagsToFlatTags(quiz.project.tags),
        iconName: "help-circle-outline",
        accentColor: colors.primary,
      };
    });
  }, [colors.primary, quizzes]);

  const flashcardCarouselItems = useMemo<HomeCarouselItem[]>(() => {
    return decks.map((deck) => {
      const cardCount = deck.flashcards.length;
      const cardLabel = cardCount === 1 ? "card" : "cards";
      const creatorLabel = getCreatorLabel(deck.project.user?.username);

      return {
        id: String(deck.id),
        entityId: deck.id,
        targetType: "flashcard",
        title: deck.project.title,
        description: `By ${creatorLabel} · ${cardCount} ${cardLabel} ready to study`,
        tags: projectTagsToFlatTags(deck.project.tags),
        iconName: "library-outline",
        accentColor: colors.success,
      };
    });
  }, [colors.success, decks]);

  const followingCarouselItems = useMemo<HomeCarouselItem[]>(() => {
    return followingProjects.flatMap<HomeCarouselItem>((project) => {
      const creatorLabel = getCreatorLabel(project.user?.username);

      if (project.type === "QUIZ" && project.quiz) {
        return [
          {
            id: `followed-quiz-${project.id}`,
            entityId: project.quiz.id,
            targetType: "quiz",
            title: project.title,
            description: `By ${creatorLabel}`,
            tags: projectTagsToFlatTags(project.tags),
            iconName: "help-circle-outline",
            accentColor: colors.warning,
          },
        ];
      }

      if (project.type === "DECK" && project.deck) {
        return [
          {
            id: `followed-deck-${project.id}`,
            entityId: project.deck.id,
            targetType: "flashcard",
            title: project.title,
            description: `By ${creatorLabel}`,
            tags: projectTagsToFlatTags(project.tags),
            iconName: "library-outline",
            accentColor: colors.secondary,
          },
        ];
      }

      return [];
    });
  }, [colors.secondary, colors.warning, followingProjects]);

  const openCarouselItem = useCallback(
    (item: HomeCarouselItem) => {
      if (item.targetType === "quiz") {
        router.push({
          pathname: "/quiz/[id]",
          params: { id: String(item.entityId) },
        });
        return;
      }

      router.push({
        pathname: "/flashcard/[id]",
        params: { id: String(item.entityId) },
      });
    },
    [router],
  );

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
          gap: spacing.xs,
          padding: spacing.lg,
        }}
      >
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: typography.primary.md,
            fontWeight: typography.weights.bold,
          }}
        >
          Welcome back{user?.username ? `, ${user.username}!` : ""}
        </Text>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.secondary.md,
          }}
        >
          Jump into your latest quizzes and flashcards, or discover what creators you follow are building.
        </Text>
      </Card>
      <Card
        style={{
          gap: spacing.md,
          padding: spacing.lg,
        }}
      >
        <View style={[styles.sectionHeader, { gap: spacing.sm }]}>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: typography.primary.sm,
              fontWeight: typography.weights.bold,
            }}
          >
            From People You Follow
          </Text>

          <Button
            iconName="arrow-forward-outline"
            label="See more"
            onPress={() => router.push("../projects/following")}
            variant="secondary"
          />
        </View>

        {isLoadingFollowingProjects ? (
          <View style={{ gap: spacing.sm }}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : null}

        {!isLoadingFollowingProjects && followingProjectsError ? (
          <View style={{ gap: spacing.sm }}>
            <Text
              style={{
                color: colors.danger,
                fontSize: typography.secondary.md,
              }}
            >
              {followingProjectsError}
            </Text>
            <Button
              iconName="refresh-outline"
              label="Try again"
              onPress={() => {
                void onRefresh();
              }}
              variant="default"
            />
          </View>
        ) : null}

        {!isLoadingFollowingProjects && !followingProjectsError && followingCarouselItems.length === 0 ? (
          <View style={{ gap: spacing.sm }}>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.secondary.md,
              }}
            >
              Follow more creators to see their projects here.
            </Text>
          </View>
        ) : null}

        {!isLoadingFollowingProjects && !followingProjectsError && followingCarouselItems.length > 0 ? (
          <Carousel
            items={followingCarouselItems}
            onItemPress={(item) => {
              const selectedProject = followingCarouselItems.find(
                (candidate) => candidate.id === item.id,
              );

              if (!selectedProject) {
                return;
              }

              openCarouselItem(selectedProject);
            }}
          />
        ) : null}
      </Card>

      <Card
        style={{
          gap: spacing.md,
          padding: spacing.lg,
        }}
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

          <Button
            iconName="arrow-forward-outline"
            label="See more"
            onPress={() =>
              router.push({
                pathname: "../projects/[type]",
                params: { type: "quiz" },
              })
            }
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
            <Button
              iconName="refresh-outline"
              label="Try again"
              onPress={() => {
                void onRefresh();
              }}
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
            <Button
              iconName="add-circle-outline"
              label="Create quiz"
              onPress={() => router.push("/quiz/create")}
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

              openCarouselItem(selectedQuiz);
            }}
          />
        ) : null}
      </Card>

      <Card
        style={{
          gap: spacing.md,
          padding: spacing.lg,
        }}
      >
        <View style={[styles.sectionHeader, { gap: spacing.sm }]}>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: typography.primary.sm,
              fontWeight: typography.weights.bold,
            }}
          >
            Flashcard Showcase
          </Text>

          <Button
            iconName="arrow-forward-outline"
            label="See more"
            onPress={() =>
              router.push({
                pathname: "../projects/[type]",
                params: { type: "flashcard" },
              })
            }
            variant="secondary"
          />
        </View>

        {isLoadingDecks ? (
          <View style={{ gap: spacing.sm }}>
            <SkeletonCard />
            <SkeletonCard />
          </View>
        ) : null}

        {!isLoadingDecks && deckError ? (
          <View style={{ gap: spacing.sm }}>
            <Text
              style={{
                color: colors.danger,
                fontSize: typography.secondary.md,
              }}
            >
              {deckError}
            </Text>
            <Button
              iconName="refresh-outline"
              label="Try again"
              onPress={() => {
                void onRefresh();
              }}
              variant="default"
            />
          </View>
        ) : null}

        {!isLoadingDecks && !deckError && flashcardCarouselItems.length === 0 ? (
          <View style={{ gap: spacing.sm }}>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.secondary.md,
              }}
            >
              No flashcard sets yet. Create your first set to get started.
            </Text>
            <Button
              iconName="add-circle-outline"
              label="Create flashcards"
              onPress={() => router.push("/flashcard/create")}
              variant="primary"
            />
          </View>
        ) : null}

        {!isLoadingDecks && !deckError && flashcardCarouselItems.length > 0 ? (
          <Carousel
            items={flashcardCarouselItems}
            onItemPress={(item) => {
              const selectedDeck = flashcardCarouselItems.find(
                (candidate) => candidate.id === item.id,
              );

              if (!selectedDeck) {
                return;
              }

              openCarouselItem(selectedDeck);
            }}
          />
        ) : null}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
