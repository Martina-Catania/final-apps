import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AppActionSheet, AppModal, Button } from "../../../../components";
import { useAuth } from "../../../../context/auth-context";
import { useThemeTokens } from "../../../../hooks";
import { SafeAreaPage } from "../../../../screens/safe-area-page";
import { getApiErrorMessage } from "../../../../utils/api-request";
import { deleteProjectRequest } from "../../../../utils/project-api";
import {
  getDeckByIdRequest,
  type Deck,
} from "../../../../utils/deck-api";

type FlashcardActionValue = "view-creator" | "edit-flashcards" | "delete-project";

type FlashcardActionItem = {
  label: string;
  value: FlashcardActionValue;
  iconName?: "person-outline" | "create-outline" | "trash-outline";
  destructive?: boolean;
  disabled?: boolean;
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

export default function FlashcardDetailPage() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const deckId = useMemo(() => parseDeckId(id), [id]);
  const router = useRouter();
  const { token, user } = useAuth();
  const { colors, spacing, typography, radius } = useThemeTokens();

  const [deck, setDeck] = useState<Deck | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeletePending, setIsDeletePending] = useState(false);

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
    setDeleteErrorMessage(null);

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

  const creatorUsername = deck?.project.user?.username;
  const creatorLabel = deck
    ? creatorUsername
      ? `@${creatorUsername}`
      : `User #${deck.project.userId}`
    : "";
  const isOwner = deck ? user?.id === deck.project.userId : false;

  const handleOpenCreatorProfile = useCallback(() => {
    if (!deck) {
      return;
    }

    router.push({
      pathname: "/profile/[id]",
      params: {
        id: String(deck.project.userId),
      },
    });
  }, [deck, router]);

  const handleOpenActions = useCallback(() => {
    setIsActionsOpen(true);
  }, []);

  const handleCloseActions = useCallback(() => {
    setIsActionsOpen(false);
  }, []);

  const handleOpenDeleteConfirm = useCallback(() => {
    setIsDeleteConfirmOpen(true);
  }, []);

  const handleCloseDeleteConfirm = useCallback(() => {
    if (isDeletePending) {
      return;
    }

    setIsDeleteConfirmOpen(false);
  }, [isDeletePending]);

  const actionItems = useMemo<FlashcardActionItem[]>(() => {
    const items: FlashcardActionItem[] = [
      {
        label: "View creator profile",
        value: "view-creator",
        iconName: "person-outline",
      },
    ];

    if (isOwner) {
      items.push({
        label: "Edit flashcards",
        value: "edit-flashcards",
        iconName: "create-outline",
      });
      items.push({
        label: "Delete project",
        value: "delete-project",
        iconName: "trash-outline",
        destructive: true,
        disabled: isDeletePending,
      });
    }

    return items;
  }, [isDeletePending, isOwner]);

  const handleSelectAction = useCallback(
    (value: FlashcardActionValue) => {
      if (!deck) {
        return;
      }

      if (value === "view-creator") {
        handleOpenCreatorProfile();
        return;
      }

      if (value === "edit-flashcards") {
        router.push({
          pathname: "/flashcard/[id]/edit",
          params: { id: String(deck.id) },
        });
        return;
      }

      handleOpenDeleteConfirm();
    },
    [deck, handleOpenCreatorProfile, handleOpenDeleteConfirm, router],
  );

  const handleConfirmDeleteProject = useCallback(async () => {
    if (!deck || isDeletePending) {
      return;
    }

    setDeleteErrorMessage(null);
    setIsDeletePending(true);

    try {
      await deleteProjectRequest(deck.projectId, token ?? undefined);
      setIsDeleteConfirmOpen(false);
      router.back();
    } catch (error) {
      setDeleteErrorMessage(getApiErrorMessage(error, "Unable to delete project"));
      setIsDeleteConfirmOpen(false);
    } finally {
      setIsDeletePending(false);
    }
  }, [deck, isDeletePending, router, token]);

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
      <>
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
                  {creatorLabel} · {deck.flashcards.length} card{deck.flashcards.length === 1 ? "" : "s"}
                </Text>
              </View>

              <Button
                disabled={isDeletePending}
                iconName="ellipsis-vertical-outline"
                label="Actions"
                onPress={handleOpenActions}
                variant="icon"
              />
            </View>

            <View style={{ gap: spacing.sm }}>
              <Button
                disabled={deck.flashcards.length === 0}
                fullWidth
                iconName="play-outline"
                label="Play flashcards"
                onPress={() =>
                  router.push({
                    pathname: "/flashcard/[id]/play",
                    params: { id: String(deck.id) },
                  })
                }
                variant="secondary"
              />
              {deleteErrorMessage ? (
                <Text
                  style={{
                    color: colors.danger,
                    fontSize: typography.secondary.sm,
                  }}
                >
                  {deleteErrorMessage}
                </Text>
              ) : null}
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

        <AppActionSheet<FlashcardActionValue>
          isOpen={isActionsOpen}
          items={actionItems}
          onClose={handleCloseActions}
          onSelect={handleSelectAction}
          title="Flashcard actions"
        />

        <AppModal
          actions={[
            {
              iconName: "close-outline",
              label: "Cancel",
              onPress: handleCloseDeleteConfirm,
              variant: "default",
            },
            {
              iconName: "trash-outline",
              label: isDeletePending ? "Deleting..." : "Delete project",
              onPress: () => {
                void handleConfirmDeleteProject();
              },
              variant: "primary",
            },
          ]}
          description="This will permanently remove this project and its flashcard data. This action cannot be undone."
          onClose={handleCloseDeleteConfirm}
          title="Delete project?"
          visible={isDeleteConfirmOpen}
        />
      </>
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
