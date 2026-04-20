import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Directions, Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Button } from "../../../../components";
import { useAuth } from "../../../../context/auth-context";
import { useSafeNavigation, useThemeTokens } from "../../../../hooks";
import { SafeAreaPage } from "../../../../screens/safe-area-page";
import { getApiErrorMessage } from "../../../../utils/api-request";
import { incrementProjectTimesPlayedRequest } from "../../../../utils/project-api";
import {
  getDeckByIdRequest,
  type Flashcard,
} from "../../../../utils/deck-api";

type PlayCard = {
  key: string;
  id: number;
  front: string;
  back: string;
};

function parseDeckId(value: string | string[] | undefined): number | null {
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

function shuffle<T>(values: T[]): T[] {
  const next = [...values];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = next[index];
    next[index] = next[swapIndex];
    next[swapIndex] = current;
  }

  return next;
}

function buildPlayCards(flashcards: Flashcard[], roundKey: number): PlayCard[] {
  return shuffle(flashcards).map((flashcard, index) => ({
    key: `${flashcard.id}-${roundKey}-card-${index}`,
    id: flashcard.id,
    front: flashcard.front,
    back: flashcard.back,
  }));
}

export default function FlashcardPlayPage() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const deckId = useMemo(() => parseDeckId(id), [id]);
  const router = useRouter();
  const { goBack } = useSafeNavigation();
  const { token } = useAuth();
  const { colors, spacing, typography, radius } = useThemeTokens();

  const [deckTitle, setDeckTitle] = useState("");
  const [deckFlashcards, setDeckFlashcards] = useState<Flashcard[]>([]);
  const [roundKey, setRoundKey] = useState(0);

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const [hasFlippedCurrentCard, setHasFlippedCurrentCard] = useState(false);
  const [knownCardsCount, setKnownCardsCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const flipProgress = useSharedValue(0);
  const flipScale = useSharedValue(1);

  const playCards = useMemo(
    () => buildPlayCards(deckFlashcards, roundKey),
    [deckFlashcards, roundKey],
  );

  const currentCard =
    currentCardIndex >= 0 && currentCardIndex < playCards.length
      ? playCards[currentCardIndex]
      : null;

  const isFinished = playCards.length > 0 && currentCardIndex >= playCards.length;

  const resetFlipAnimation = useCallback(() => {
    flipProgress.value = 0;
    flipScale.value = 1;
  }, [flipProgress, flipScale]);

  const goBackOnStack = useCallback(() => {
    goBack();
  }, [goBack]);

  const loadDeck = useCallback(async () => {
    if (!deckId) {
      setErrorMessage("Invalid flashcard set id");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const payload = await getDeckByIdRequest(deckId, token ?? undefined);
      void incrementProjectTimesPlayedRequest(payload.projectId, token ?? undefined).catch(
        () => undefined,
      );

      setDeckTitle(payload.project.title);
      setDeckFlashcards(payload.flashcards);
      setCurrentCardIndex(0);
      setIsAnswerVisible(false);
      setHasFlippedCurrentCard(false);
      setKnownCardsCount(0);
      setRoundKey(0);
      resetFlipAnimation();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to load flashcards"));
      setDeckTitle("");
      setDeckFlashcards([]);
    } finally {
      setIsLoading(false);
    }
  }, [deckId, resetFlipAnimation, token]);

  useEffect(() => {
    void loadDeck();
  }, [loadDeck]);

  const runFlipAnimation = useCallback(
    (nextVisible: boolean) => {
      flipProgress.value = withTiming(nextVisible ? 1 : 0, { duration: 220 });
      flipScale.value = withSequence(
        withTiming(0.97, { duration: 110 }),
        withTiming(1, { duration: 110 }),
      );
    },
    [flipProgress, flipScale],
  );

  const cardScaleAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: flipScale.value }],
    };
  });

  const frontFaceAnimatedStyle = useAnimatedStyle(() => {
    const spinValue = interpolate(flipProgress.value, [0, 1], [0, 180]);

    return {
      opacity: interpolate(flipProgress.value, [0, 0.5, 1], [1, 0, 0]),
      transform: [{ perspective: 1000 }, { rotateX: `${spinValue}deg` }],
    };
  });

  const backFaceAnimatedStyle = useAnimatedStyle(() => {
    const spinValue = interpolate(flipProgress.value, [0, 1], [180, 360]);

    return {
      opacity: interpolate(flipProgress.value, [0, 0.5, 1], [0, 0, 1]),
      transform: [{ perspective: 1000 }, { rotateX: `${spinValue}deg` }],
    };
  });

  const handleFlipCard = useCallback(() => {
    if (!currentCard) {
      return;
    }

    setHasFlippedCurrentCard(true);
    setIsAnswerVisible((current) => {
      const next = !current;
      runFlipAnimation(next);
      return next;
    });
  }, [currentCard, runFlipAnimation]);

  const swipeUpGesture = useMemo(
    () =>
      Gesture.Fling()
        .runOnJS(true)
        .direction(Directions.UP)
        .onStart(() => {
          handleFlipCard();
        }),
    [handleFlipCard],
  );

  const swipeDownGesture = useMemo(
    () =>
      Gesture.Fling()
        .runOnJS(true)
        .direction(Directions.DOWN)
        .onStart(() => {
          handleFlipCard();
        }),
    [handleFlipCard],
  );

  const flipGesture = useMemo(
    () => Gesture.Simultaneous(swipeUpGesture, swipeDownGesture),
    [swipeDownGesture, swipeUpGesture],
  );

  const handleRateCard = (isKnown: boolean) => {
    if (!currentCard || !hasFlippedCurrentCard) {
      return;
    }

    if (isKnown) {
      setKnownCardsCount((current) => current + 1);
    }

    setIsAnswerVisible(false);
    setHasFlippedCurrentCard(false);
    setCurrentCardIndex((current) => current + 1);
    resetFlipAnimation();
  };

  const handlePlayAgain = () => {
    setRoundKey((current) => current + 1);
    setCurrentCardIndex(0);
    setIsAnswerVisible(false);
    setHasFlippedCurrentCard(false);
    setKnownCardsCount(0);
    resetFlipAnimation();
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

  if (errorMessage) {
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
            Flashcards could not be loaded
          </Text>
          <Text
            style={{
              color: colors.danger,
              fontSize: typography.secondary.md,
            }}
          >
            {errorMessage}
          </Text>
          <View style={{ gap: spacing.sm }}>
            <Button
              fullWidth
              iconName="refresh-outline"
              label="Try again"
              onPress={() => {
                void loadDeck();
              }}
              variant="primary"
            />
            <Button
              fullWidth
              iconName="arrow-back-outline"
              label="Back"
              onPress={goBackOnStack}
              variant="default"
            />
            <Button
              fullWidth
              iconName="home-outline"
              label="Back to home"
              onPress={() => router.replace("/")}
              variant="default"
            />
          </View>
        </View>
      </SafeAreaPage>
    );
  }

  if (playCards.length === 0) {
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
            This deck has no cards yet
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.secondary.md,
            }}
          >
            Add at least one card before starting a study session.
          </Text>
          <View style={{ gap: spacing.sm }}>
            <Button
              fullWidth
              iconName="arrow-back-outline"
              label="Back"
              onPress={goBackOnStack}
              variant="default"
            />
            <Button
              fullWidth
              iconName="home-outline"
              label="Back to home"
              onPress={() => router.replace("/")}
              variant="default"
            />
          </View>
        </View>
      </SafeAreaPage>
    );
  }

  if (isFinished) {
    const totalCards = playCards.length;
    const masteryPercentage = Math.round((knownCardsCount / totalCards) * 100);

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
              fontSize: typography.primary.lg,
              fontWeight: typography.weights.bold,
            }}
          >
            Session complete
          </Text>
          <Text
            style={{
              color: colors.textPrimary,
              fontSize: typography.secondary.lg,
              fontWeight: typography.weights.semibold,
            }}
          >
            {knownCardsCount} / {totalCards} cards known
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.secondary.md,
            }}
          >
            Mastery: {masteryPercentage}%
          </Text>

          <View style={{ gap: spacing.sm }}>
            <Button
              fullWidth
              iconName="refresh-outline"
              label="Play again"
              onPress={handlePlayAgain}
              variant="primary"
            />
            <Button
              fullWidth
              iconName="arrow-back-outline"
              label="Back to deck"
              onPress={() => router.replace("..")}
              variant="default"
            />
            <Button
              fullWidth
              iconName="home-outline"
              label="Go home"
              onPress={() => router.replace("/")}
              variant="default"
            />
          </View>
        </View>
      </SafeAreaPage>
    );
  }

  if (!currentCard) {
    return (
      <SafeAreaPage backgroundColor={colors.background}>
        <View style={styles.centered}>
          <Button
            iconName="refresh-outline"
            label="Reload"
            onPress={() => {
              void loadDeck();
            }}
            variant="primary"
          />
        </View>
      </SafeAreaPage>
    );
  }

  const isLastCard = currentCardIndex === playCards.length - 1;

  return (
    <SafeAreaPage backgroundColor={colors.background}>
      <ScrollView
        contentContainerStyle={{
          gap: spacing.lg,
          padding: spacing.lg,
        }}
      >
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderRadius: radius.md,
                      gap: spacing.sm,
                      padding: spacing.lg,
                    },
                  ]}
                >
                  <View style={[styles.headerRow, { gap: spacing.sm }]}>
                    <Button
                      iconName="arrow-back-outline"
                      label="Back"
                      onPress={goBackOnStack}
                      variant="icon"
                    />
                    <View style={{ flex: 1, gap: spacing.xxs }}>
                      <Text
                        style={{
                          color: colors.textPrimary,
                          fontSize: typography.primary.lg,
                          fontWeight: typography.weights.bold,
                        }}
                      >
                        {deckTitle}
                      </Text>
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontSize: typography.secondary.md,
                        }}
                      >
                        Play
                      </Text>
                    </View>
                  </View>
                </View>
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
          <View style={[styles.rowBetween, { gap: spacing.sm }]}>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.secondary.md,
              }}
            >
              Card {currentCardIndex + 1} of {playCards.length}
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.secondary.md,
              }}
            >
              {knownCardsCount} known
            </Text>
          </View>

          <Text
            style={{
              color: colors.textPrimary,
              fontSize: typography.primary.md,
              fontWeight: typography.weights.bold,
            }}
          >
            {deckTitle}
          </Text>

          <GestureDetector gesture={flipGesture}>
            <Animated.View style={cardScaleAnimatedStyle}>
              <Pressable
                onPress={handleFlipCard}
                style={({ pressed }) => [
                  styles.flashcardFace,
                  {
                    backgroundColor: isAnswerVisible ? colors.surfaceMuted : colors.surface,
                    borderColor: colors.border,
                    borderRadius: radius.md,
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}
              >
                <Animated.View
                  style={[styles.flashcardFaceSide, frontFaceAnimatedStyle, { padding: spacing.lg }]}
                >
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: typography.secondary.sm,
                      fontWeight: typography.weights.bold,
                    }}
                  >
                    Front
                  </Text>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: typography.secondary.lg,
                      fontWeight: typography.weights.semibold,
                    }}
                  >
                    {currentCard.front}
                  </Text>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: typography.secondary.md,
                    }}
                  >
                    Tap card, swipe up, or swipe down to reveal the answer.
                  </Text>
                </Animated.View>

                <Animated.View
                  style={[
                    styles.flashcardFaceSide,
                    styles.flashcardFaceBack,
                    backFaceAnimatedStyle,
                    { padding: spacing.lg },
                  ]}
                >
                  <Text
                    style={{
                      color: colors.success,
                      fontSize: typography.secondary.sm,
                      fontWeight: typography.weights.bold,
                    }}
                  >
                    Back
                  </Text>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: typography.secondary.lg,
                      fontWeight: typography.weights.semibold,
                    }}
                  >
                    {currentCard.back}
                  </Text>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: typography.secondary.md,
                    }}
                  >
                    Tap or swipe up/down to flip back to the front.
                  </Text>
                </Animated.View>
              </Pressable>
            </Animated.View>
          </GestureDetector>

          {!hasFlippedCurrentCard ? (
            <Button
              fullWidth
              iconName="eye-outline"
              label="Reveal answer"
              onPress={handleFlipCard}
              variant="primary"
            />
          ) : (
            <View style={{ gap: spacing.sm }}>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: typography.secondary.md,
                }}
              >
                How did you do on this card?
              </Text>
              <Button
                fullWidth
                iconName="close-outline"
                label={isLastCard ? "Still learning and finish" : "Still learning"}
                onPress={() => handleRateCard(false)}
                variant="default"
              />
              <Button
                fullWidth
                iconName="checkmark-outline"
                label={isLastCard ? "I knew it and finish" : "I knew it"}
                onPress={() => handleRateCard(true)}
                variant="primary"
              />
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
    alignSelf: "center",
    borderWidth: 1,
    maxWidth: 760,
    width: "100%",
  },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  flashcardFace: {
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  flashcardFaceSide: {
    backfaceVisibility: "hidden",
    gap: 8,
    justifyContent: "center",
    minHeight: 220,
  },
  flashcardFaceBack: {
    ...StyleSheet.absoluteFillObject,
  },
});
