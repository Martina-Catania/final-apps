import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button } from "../../../../components";
import { useAuth } from "../../../../context/auth-context";
import { useThemeTokens } from "../../../../hooks";
import { SafeAreaPage } from "../../../../screens/safe-area-page";
import { getApiErrorMessage } from "../../../../utils/api-request";
import {
  getDeckByIdRequest,
  type Deck,
} from "../../../../utils/deck-api";

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

export default function FlashcardDetailPage() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const deckId = useMemo(() => parseDeckId(id), [id]);
  const router = useRouter();
  const { token } = useAuth();
  const { colors, spacing, typography, radius } = useThemeTokens();

  const [deck, setDeck] = useState<Deck | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleBackPress = useCallback(() => {
    router.back();
  }, [router]);

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
      setDeck(payload);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Unable to load flashcards"));
      setDeck(null);
    } finally {
      setIsLoading(false);
    }
  }, [deckId, token]);

  useEffect(() => {
    void loadDeck();
  }, [loadDeck]);

  if (isLoading) {
    return (
      <SafeAreaPage backgroundColor={colors.background}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      </SafeAreaPage>
    );
  }

  if (errorMessage || !deck) {
    return (
      <SafeAreaPage backgroundColor={colors.background}>
        <View
          style={[
            styles.errorCard,
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
            {errorMessage ?? "Unexpected error"}
          </Text>
          <View style={{ gap: spacing.sm }}>
            <Button
              fullWidth
              iconName="arrow-back-outline"
              label="Back"
              onPress={handleBackPress}
              variant="default"
            />
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
              iconName="home-outline"
              label="Back to home"
              onPress={() => router.replace("../..")}
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
        <View
          style={[
            styles.headerCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: radius.md,
              gap: spacing.sm,
              padding: spacing.lg,
            },
          ]}
        >
          <View style={[styles.headerInfoRow, { gap: spacing.sm }]}>
            <Button
              iconName="arrow-back-outline"
              label="Back"
              onPress={handleBackPress}
              variant="icon"
            />

            <View style={[styles.headerInfoText, { gap: spacing.xxs }]}>
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: typography.primary.lg,
                  fontWeight: typography.weights.bold,
                }}
              >
                {deck.project.title}
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: typography.secondary.md,
                }}
              >
                Deck #{deck.id} · {deck.flashcards.length} card{deck.flashcards.length === 1 ? "" : "s"}
              </Text>
            </View>
          </View>

          <View style={{ gap: spacing.sm }}>
            <Button
              fullWidth
              iconName="create-outline"
              label="Edit flashcards"
              onPress={() =>
                router.push({
                  pathname: "/flashcard/[id]/edit",
                  params: { id: String(deck.id) },
                })
              }
              variant="primary"
            />
            <Button
              fullWidth
              iconName="add-circle-outline"
              label="Create another set"
              onPress={() => router.replace("/flashcard/create")}
              variant="secondary"
            />
          </View>
        </View>

        {deck.flashcards.length === 0 ? (
          <View
            style={[
              styles.flashcardCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.sm,
                gap: spacing.xs,
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
              No cards yet
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.secondary.md,
              }}
            >
              Add cards to start studying this set.
            </Text>
          </View>
        ) : (
          <View style={{ gap: spacing.md }}>
            {deck.flashcards.map((flashcard, index) => (
              <View
                key={flashcard.id}
                style={[
                  styles.flashcardCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderRadius: radius.sm,
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
                  Card {index + 1}
                </Text>

                <View style={{ gap: spacing.xs }}>
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: typography.secondary.sm,
                      fontWeight: typography.weights.semibold,
                    }}
                  >
                    Front
                  </Text>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: typography.secondary.md,
                    }}
                  >
                    {flashcard.front}
                  </Text>
                </View>

                <View style={{ gap: spacing.xs }}>
                  <Text
                    style={{
                      color: colors.success,
                      fontSize: typography.secondary.sm,
                      fontWeight: typography.weights.semibold,
                    }}
                  >
                    Back
                  </Text>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontSize: typography.secondary.md,
                    }}
                  >
                    {flashcard.back}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
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
  errorCard: {
    borderWidth: 1,
  },
  headerCard: {
    borderWidth: 1,
  },
  headerInfoRow: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
  headerInfoText: {
    flex: 1,
  },
  flashcardCard: {
    borderWidth: 1,
  },
});
