import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Accordion, Button } from "../../../../components";
import { AppTextInput } from "../../../../components/TextInput";
import { useAuth } from "../../../../context/auth-context";
import { useProjectTagEditor, useSafeNavigation, useThemeTokens } from "../../../../hooks";
import { SafeAreaPage } from "../../../../screens/safe-area-page";
import { getApiErrorMessage } from "../../../../utils/api-request";
import { uniqueFlatTags } from "../../../../utils/tag-utils";
import {
  createFlashcardRequest,
  deleteFlashcardRequest,
  getDeckByIdRequest,
  updateFlashcardRequest,
} from "../../../../utils/deck-api";
import {
  updateProjectRequest,
} from "../../../../utils/project-api";

type FlashcardDraft = {
  key: string;
  flashcardId: number | null;
  front: string;
  back: string;
};

type FlashcardField = Exclude<keyof FlashcardDraft, "key" | "flashcardId">;

type FlashcardFieldErrors = Partial<Record<FlashcardField, string>>;

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

function createFlashcardDraft(index: number): FlashcardDraft {
  return {
    key: `new-${index}`,
    flashcardId: null,
    front: "",
    back: "",
  };
}

export default function FlashcardEditPage() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const deckId = useMemo(() => parseDeckId(id), [id]);
  const router = useRouter();
  const { goBack } = useSafeNavigation();
  const { token, user } = useAuth();
  const { colors, spacing, typography, radius } = useThemeTokens();

  const [projectId, setProjectId] = useState<number | null>(null);
  const [creatorUserId, setCreatorUserId] = useState<number | null>(null);
  const [deckTitle, setDeckTitle] = useState("");
  const [flashcards, setFlashcards] = useState<FlashcardDraft[]>([]);
  const [initialFlashcardIds, setInitialFlashcardIds] = useState<number[]>([]);
  const [nextFlashcardIndex, setNextFlashcardIndex] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [flashcardsError, setFlashcardsError] = useState<string | null>(null);
  const [flashcardErrors, setFlashcardErrors] = useState<Record<string, FlashcardFieldErrors>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    tagInput,
    selectedTags,
    suggestedTags,
    tagsError,
    handleTagInputChange,
    selectSuggestedTag,
    handleAddTag,
    removeSelectedTag,
    initializeFromProjectTags,
    clearTagState,
    clearTagsError,
    syncProjectTags,
  } = useProjectTagEditor({ token: token ?? undefined });

  const addFlashcard = () => {
    setFlashcards((current) => [...current, createFlashcardDraft(nextFlashcardIndex)]);
    setNextFlashcardIndex((current) => current + 1);
  };

  const removeFlashcard = (key: string) => {
    setFlashcards((current) => current.filter((item) => item.key !== key));
    setFlashcardErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const updateFlashcardField = (
    key: string,
    field: FlashcardField,
    value: string,
  ) => {
    setFlashcards((current) =>
      current.map((item) => (item.key === key ? { ...item, [field]: value } : item)),
    );

    setFlashcardErrors((current) => {
      const nextForFlashcard = current[key];

      if (!nextForFlashcard || !nextForFlashcard[field]) {
        return current;
      }

      return {
        ...current,
        [key]: {
          ...nextForFlashcard,
          [field]: undefined,
        },
      };
    });
  };

  const validate = () => {
    let isValid = true;
    const trimmedTitle = deckTitle.trim();

    if (!trimmedTitle) {
      setTitleError("Flashcard set name is required");
      isValid = false;
    } else {
      setTitleError(null);
    }

    if (flashcards.length === 0) {
      setFlashcardsError("Add at least one card before saving");
      isValid = false;
    } else {
      setFlashcardsError(null);
    }

    const nextFlashcardErrors: Record<string, FlashcardFieldErrors> = {};

    for (const flashcard of flashcards) {
      const currentErrors: FlashcardFieldErrors = {};

      if (!flashcard.front.trim()) {
        currentErrors.front = "Front side is required";
      }

      if (!flashcard.back.trim()) {
        currentErrors.back = "Back side is required";
      }

      if (Object.keys(currentErrors).length > 0) {
        nextFlashcardErrors[flashcard.key] = currentErrors;
        isValid = false;
      }
    }

    setFlashcardErrors(nextFlashcardErrors);

    return isValid;
  };

  const loadDeck = useCallback(async () => {
    if (!deckId) {
      setLoadError("Invalid flashcard set id");
      setIsLoading(false);
      return;
    }

    if (!token || !user) {
      setLoadError("You must be signed in to edit flashcards");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const payload = await getDeckByIdRequest(deckId, token ?? undefined);

      if (payload.project.userId !== user.id) {
        setCreatorUserId(payload.project.userId);
        setLoadError("You are not allowed to edit this flashcard set");
        setProjectId(null);
        setDeckTitle("");
        setInitialFlashcardIds([]);
        setFlashcards([]);
        clearTagState();
        setNextFlashcardIndex(1);
        return;
      }

      setProjectId(payload.projectId);
      setCreatorUserId(payload.project.userId);
      setDeckTitle(payload.project.title);
      setInitialFlashcardIds(payload.flashcards.map((item) => item.id));
      const projectTags = uniqueFlatTags(payload.project.tags.map((projectTag) => projectTag.tag));
      initializeFromProjectTags(projectTags);

      const mappedFlashcards: FlashcardDraft[] = payload.flashcards.map((item, index) => ({
        key: `existing-${item.id}-${index + 1}`,
        flashcardId: item.id,
        front: item.front,
        back: item.back,
      }));

      if (mappedFlashcards.length === 0) {
        setFlashcards([createFlashcardDraft(1)]);
        setNextFlashcardIndex(2);
      } else {
        setFlashcards(mappedFlashcards);
        setNextFlashcardIndex(mappedFlashcards.length + 1);
      }
    } catch (error) {
      setLoadError(getApiErrorMessage(error, "Unable to load flashcards"));
      setCreatorUserId(null);
      setFlashcards([]);
      clearTagState();
    } finally {
      setIsLoading(false);
    }
  }, [clearTagState, deckId, initializeFromProjectTags, token, user]);

  useEffect(() => {
    void loadDeck();
  }, [loadDeck]);

  const handleSaveFlashcards = async () => {
    setSubmitError(null);
    clearTagsError();

    if (!token || !user) {
      setSubmitError("You must be signed in to edit flashcards");
      return;
    }

    if (creatorUserId !== user.id) {
      setSubmitError("You are not allowed to edit this flashcard set");
      return;
    }

    if (!deckId || !projectId) {
      setSubmitError("Unable to edit this flashcard set");
      return;
    }

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await updateProjectRequest(
        projectId,
        {
          title: deckTitle.trim(),
        },
        token,
      );

      await syncProjectTags(projectId);

      const remainingFlashcardIds = new Set(initialFlashcardIds);

      for (const flashcard of flashcards) {
        const payload = {
          front: flashcard.front.trim(),
          back: flashcard.back.trim(),
        };

        if (flashcard.flashcardId) {
          await updateFlashcardRequest(flashcard.flashcardId, payload, token);
          remainingFlashcardIds.delete(flashcard.flashcardId);
        } else {
          await createFlashcardRequest(
            {
              deckId,
              ...payload,
            },
            token,
          );
        }
      }

      for (const flashcardId of remainingFlashcardIds) {
        await deleteFlashcardRequest(flashcardId, token);
      }

      router.replace("..");
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "Unable to update flashcards"));
    } finally {
      setIsSubmitting(false);
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

  if (loadError) {
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
            {loadError}
          </Text>
          <View style={{ gap: spacing.sm }}>
            <Button
              fullWidth
              iconName="home-outline"
              label="Back to home"
              onPress={() => router.replace("/")}
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
          </View>
        </View>
      </SafeAreaPage>
    );
  }

  return (
    <SafeAreaPage backgroundColor={colors.background}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardAvoiding}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            {
              padding: spacing.lg,
            },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radius.md,
                gap: spacing.lg,
                padding: spacing.lg,
              },
            ]}
          >
            <View style={[styles.headerRow, { gap: spacing.sm }]}>
              <Button
                accessibilityLabel="Back"
                iconName="arrow-back-outline"
                onPress={() => goBack()}
                variant="icon"
              />

              <View style={[styles.headerText, { gap: spacing.xs }]}>
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: typography.primary.md,
                    fontWeight: typography.weights.bold,
                  }}
                >
                  Edit Flashcards
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: typography.secondary.md,
                  }}
                >
                  Update the set title and cards. Changes are saved when you press Save changes.
                </Text>
              </View>
            </View>

            <AppTextInput
              label="Flashcard set name"
              onChangeText={setDeckTitle}
              placeholder="Examples: Biology Basics"
              value={deckTitle}
              errorText={titleError ?? undefined}
              helperText="Rename your flashcard set."
            />

            <View style={{ gap: spacing.sm }}>
              <AppTextInput
                label="Project tags"
                onChangeText={handleTagInputChange}
                onSubmitEditing={() => {
                  void handleAddTag();
                }}
                placeholder="Type a tag name"
                value={tagInput}
                errorText={tagsError ?? undefined}
                helperText="Add existing tags or create new ones."
              />

              {suggestedTags.length > 0 ? (
                <View style={[styles.rowWrap, { gap: spacing.xs }]}>
                  {suggestedTags.map((tag) => (
                    <Pressable
                      accessibilityRole="button"
                      key={`deck-edit-suggested-tag-${tag.id}`}
                      onPress={() => {
                        selectSuggestedTag(tag);
                      }}
                      style={({ pressed }) => [
                        styles.tagPill,
                        {
                          backgroundColor: colors.surfaceMuted,
                          borderColor: colors.border,
                          borderRadius: radius.pill,
                          opacity: pressed ? 0.8 : 1,
                          paddingHorizontal: spacing.sm,
                          paddingVertical: spacing.xs,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontSize: typography.secondary.sm,
                          fontWeight: typography.weights.medium,
                        }}
                      >
                        {tag.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}

              {selectedTags.length > 0 ? (
                <View style={[styles.rowWrap, { gap: spacing.xs }]}>
                  {selectedTags.map((tag) => (
                    <Pressable
                      accessibilityRole="button"
                      key={`deck-edit-selected-tag-${tag.id}`}
                      onPress={() => removeSelectedTag(tag.id)}
                      style={({ pressed }) => [
                        styles.tagPill,
                        {
                          backgroundColor: colors.secondaryMuted,
                          borderColor: colors.secondary,
                          borderRadius: radius.pill,
                          opacity: pressed ? 0.8 : 1,
                          paddingHorizontal: spacing.sm,
                          paddingVertical: spacing.xs,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: colors.textPrimary,
                          fontSize: typography.secondary.sm,
                          fontWeight: typography.weights.semibold,
                        }}
                      >
                        {tag.name}  x
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: typography.secondary.sm,
                  }}
                >
                  No tags selected yet.
                </Text>
              )}
            </View>

            <View style={{ gap: spacing.sm }}>
              <View style={[styles.rowBetween, { gap: spacing.sm }]}>
                <Text
                  style={{
                    color: colors.textPrimary,
                    fontSize: typography.primary.sm,
                    fontWeight: typography.weights.semibold,
                  }}
                >
                  Cards
                </Text>
                <Button
                  iconName="add-circle-outline"
                  label="Add card"
                  onPress={addFlashcard}
                  variant="secondary"
                />
              </View>

              {flashcardsError ? (
                <Text
                  style={{
                    color: colors.danger,
                    fontSize: typography.secondary.sm,
                  }}
                >
                  {flashcardsError}
                </Text>
              ) : null}

              <View style={{ gap: spacing.md }}>
                {flashcards.map((item, index) => {
                  const currentErrors = flashcardErrors[item.key] ?? {};

                  return (
                    <Accordion
                      defaultExpanded={index === 0}
                      key={item.key}
                      title={`Card ${index + 1}`}
                    >
                      <View style={{ gap: spacing.sm }}>
                        {flashcards.length > 1 ? (
                          <View style={{ alignItems: "flex-end" }}>
                            <Button
                              iconName="trash-outline"
                              label="Remove"
                              onPress={() => removeFlashcard(item.key)}
                              variant="default"
                            />
                          </View>
                        ) : null}

                        <AppTextInput
                          label="Front"
                          onChangeText={(value) => updateFlashcardField(item.key, "front", value)}
                          placeholder="Concept or question"
                          value={item.front}
                          errorText={currentErrors.front}
                        />

                        <AppTextInput
                          label="Back"
                          onChangeText={(value) => updateFlashcardField(item.key, "back", value)}
                          placeholder="Definition or answer"
                          value={item.back}
                          errorText={currentErrors.back}
                        />
                      </View>
                    </Accordion>
                  );
                })}
              </View>
            </View>

            {submitError ? (
              <Text
                style={{
                  color: colors.danger,
                  fontSize: typography.secondary.sm,
                }}
              >
                {submitError}
              </Text>
            ) : null}

            <View style={[styles.rowWrap, { gap: spacing.sm }]}>
              <Button
                disabled={isSubmitting}
                fullWidth
                iconName="save-outline"
                label={isSubmitting ? "Saving changes..." : "Save changes"}
                onPress={() => {
                  void handleSaveFlashcards();
                }}
                variant="primary"
              />
              <Button
                disabled={isSubmitting}
                fullWidth
                iconName="close-outline"
                label="Cancel"
                onPress={() => goBack()}
                variant="default"
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaPage>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
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
  errorCard: {
    borderWidth: 1,
  },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
  headerText: {
    flex: 1,
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tagPill: {
    borderWidth: 1,
  },
});
