import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import {
  Button,
  Carousel,
  SkeletonCard,
} from "../../../components";
import { useAuth } from "../../../context/auth-context";
import { useThemeTokens } from "../../../hooks";
import { getApiErrorMessage } from "../../../utils/api-request";
import {
  listDecksRequest,
  type Deck,
} from "../../../utils/deck-api";
import {
  listQuizzesRequest,
  type Quiz,
} from "../../../utils/quiz-api";

type HomeCarouselItem = {
  id: string;
  entityId: number;
  title: string;
  description: string;
  iconName: "help-circle-outline" | "library-outline";
  accentColor: string;
};

export default function Index() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { colors, spacing, typography, radius } = useThemeTokens();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isLoadingDecks, setIsLoadingDecks] = useState(true);
  const [deckError, setDeckError] = useState<string | null>(null);
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

        setQuizError(getApiErrorMessage(error, "Unable to load quizzes"));
        setQuizzes([]);
      } finally {
        if (isMounted) {
          setIsLoadingQuizzes(false);
        }
      }
    };

    const loadDecks = async () => {
      setIsLoadingDecks(true);
      setDeckError(null);

      try {
        const payload = await listDecksRequest(token ?? undefined);

        if (!isMounted) {
          return;
        }

        setDecks(payload);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setDeckError(getApiErrorMessage(error, "Unable to load flashcards"));
        setDecks([]);
      } finally {
        if (isMounted) {
          setIsLoadingDecks(false);
        }
      }
    };

    void loadQuizzes();
    void loadDecks();

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
        entityId: quiz.id,
        title: quiz.project.title,
        description: `${questionCount} ${questionLabel} ready to practice`,
        iconName: "help-circle-outline",
        accentColor: colors.primary,
      };
    });
  }, [colors.primary, quizzes]);

  const flashcardCarouselItems = useMemo<HomeCarouselItem[]>(() => {
    return decks.map((deck) => {
      const cardCount = deck.flashcards.length;
      const cardLabel = cardCount === 1 ? "card" : "cards";

      return {
        id: String(deck.id),
        entityId: deck.id,
        title: deck.project.title,
        description: `${cardCount} ${cardLabel} ready to study`,
        iconName: "library-outline",
        accentColor: colors.success,
      };
    });
  }, [colors.success, decks]);

  return (
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
              Welcome back{user?.username ? `, ${user.username}` : ""}
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.secondary.md,
              }}
            >
              Jump into your latest quizzes and flashcards or browse all projects.
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

              <Button
                iconName="arrow-forward-outline"
                label="See more"
                onPress={() => router.push("/search")}
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

                  router.push({
                    pathname: "/quiz/[id]/play",
                    params: { id: String(selectedQuiz.entityId) },
                  });
                }}
              />
            ) : null}
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
                Flashcard Showcase
              </Text>

              <Button
                iconName="arrow-forward-outline"
                label="See more"
                onPress={() => router.push("/search")}
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
                  onPress={() => setReloadTick((current) => current + 1)}
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

                  router.push({
                    pathname: "/flashcard/[id]",
                    params: { id: String(selectedDeck.entityId) },
                  });
                }}
              />
            ) : null}
          </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
});
