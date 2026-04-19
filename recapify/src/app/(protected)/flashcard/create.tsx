import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Accordion, Button } from "../../../components";
import { AppTextInput } from "../../../components/TextInput";
import { useAuth } from "../../../context/auth-context";
import { useThemeTokens } from "../../../hooks";
import { SafeAreaPage } from "../../../screens/safe-area-page";
import { getApiErrorMessage } from "../../../utils/api-request";
import {
  createDeckRequest,
  createFlashcardRequest,
} from "../../../utils/deck-api";
import { createProjectRequest } from "../../../utils/project-api";
import {
  addTagToProjectRequest,
  createTagRequest,
  listTagsRequest,
  type Tag,
} from "../../../utils/tag-api";
import {
  findTagByNameCaseInsensitive,
  normalizeTagName,
  uniqueFlatTags,
} from "../../../utils/tag-utils";

type FlashcardDraft = {
  key: string;
  front: string;
  back: string;
};

type FlashcardField = Exclude<keyof FlashcardDraft, "key">;

type FlashcardFieldErrors = Partial<Record<FlashcardField, string>>;

function createFlashcardDraft(index: number): FlashcardDraft {
  return {
    key: `f-${index}`,
    front: "",
    back: "",
  };
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export default function FlashcardCreatePage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const { colors, spacing, typography, radius } = useThemeTokens();

  const [deckTitle, setDeckTitle] = useState("");
  const [flashcards, setFlashcards] = useState<FlashcardDraft[]>([createFlashcardDraft(1)]);
  const [nextFlashcardIndex, setNextFlashcardIndex] = useState(2);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [flashcardsError, setFlashcardsError] = useState<string | null>(null);
  const [flashcardErrors, setFlashcardErrors] = useState<Record<string, FlashcardFieldErrors>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [tagsError, setTagsError] = useState<string | null>(null);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  const selectedTagIds = useMemo(() => new Set(selectedTags.map((tag) => tag.id)), [selectedTags]);

  const suggestedTags = useMemo(() => {
    const normalizedInput = normalizeTagName(tagInput);

    if (!normalizedInput) {
      return [];
    }

    return availableTags
      .filter(
        (tag) => tag.name.includes(normalizedInput) && !selectedTagIds.has(tag.id),
      )
      .slice(0, 8);
  }, [availableTags, selectedTagIds, tagInput]);

  const loadTags = useCallback(async () => {
    if (!token) {
      setAvailableTags([]);
      return;
    }

    setIsLoadingTags(true);

    try {
      const payload = await listTagsRequest(token);
      setAvailableTags(uniqueFlatTags(payload.map((tag) => ({ id: tag.id, name: tag.name }))));
    } catch {
      setAvailableTags([]);
    } finally {
      setIsLoadingTags(false);
    }
  }, [token]);

  useEffect(() => {
    void loadTags();
  }, [loadTags]);

  const addSelectedTag = useCallback((tag: Tag) => {
    setSelectedTags((current) => {
      const alreadySelected = current.some(
        (item) => normalizeTagName(item.name) === normalizeTagName(tag.name),
      );

      if (alreadySelected) {
        return current;
      }

      return [...current, tag];
    });
  }, []);

  const handleAddTag = useCallback(async () => {
    if (!token) {
      setTagsError("You must be signed in to add tags");
      return;
    }

    const normalizedName = normalizeTagName(tagInput);

    if (!normalizedName) {
      setTagsError("Tag name cannot be empty");
      return;
    }

    setTagsError(null);

    const existingSelectedTag = findTagByNameCaseInsensitive(selectedTags, normalizedName);
    if (existingSelectedTag) {
      setTagsError("Tag already selected");
      return;
    }

    const existingTag = findTagByNameCaseInsensitive(availableTags, normalizedName);
    if (existingTag) {
      addSelectedTag(existingTag);
      setTagInput("");
      return;
    }

    try {
      const createdTag = await createTagRequest(normalizedName, token);
      setAvailableTags((current) => uniqueFlatTags([...current, createdTag]));
      addSelectedTag(createdTag);
      setTagInput("");
      return;
    } catch (error) {
      try {
        const refreshed = await listTagsRequest(token);
        const refreshedTags = uniqueFlatTags(
          refreshed.map((tag) => ({ id: tag.id, name: tag.name })),
        );
        setAvailableTags(refreshedTags);

        const recoveredTag = findTagByNameCaseInsensitive(refreshedTags, normalizedName);
        if (recoveredTag) {
          addSelectedTag(recoveredTag);
          setTagInput("");
          return;
        }
      } catch {
        // Keep the original error message below when refresh also fails.
      }

      setTagsError(getApiErrorMessage(error, "Unable to create tag"));
    }
  }, [addSelectedTag, availableTags, selectedTags, tagInput, token]);

  const removeSelectedTag = (tagId: number) => {
    setSelectedTags((current) => current.filter((tag) => tag.id !== tagId));
  };

  const attachTagsToProject = useCallback(
    async (projectId: number) => {
      if (!token || selectedTags.length === 0) {
        return;
      }

      await Promise.all(
        selectedTags.map((tag) => addTagToProjectRequest(projectId, tag.id, token)),
      );
    },
    [selectedTags, token],
  );

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

  const handleSaveFlashcards = async () => {
    setSubmitError(null);
    setTagsError(null);

    if (!token || !user?.id) {
      setSubmitError("You must be signed in to create flashcards");
      return;
    }

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const project = await createProjectRequest(
        {
          type: "DECK",
          title: deckTitle.trim(),
          userId: user.id,
        },
        token,
      );

      await attachTagsToProject(project.id);

      const deck = await createDeckRequest(project.id, token);

      for (const flashcard of flashcards) {
        await createFlashcardRequest(
          {
            deckId: deck.id,
            front: flashcard.front.trim(),
            back: flashcard.back.trim(),
          },
          token,
        );
      }

      await wait(1000);
      router.replace(`./${deck.id}`);
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "Unable to create flashcards"));
    } finally {
      setIsSubmitting(false);
    }
  };

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
                onPress={() => router.back()}
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
                  Create Flashcards
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: typography.secondary.md,
                  }}
                >
                  Set a title, add cards with front and back sides, and save in one step.
                </Text>
              </View>
            </View>

            <AppTextInput
              label="Flashcard set name"
              onChangeText={setDeckTitle}
              placeholder="Examples: Biology Basics"
              value={deckTitle}
              errorText={titleError ?? undefined}
              helperText="Name your flashcard set."
            />

            <View style={{ gap: spacing.sm }}>
              <AppTextInput
                label="Project tags"
                onChangeText={(value) => {
                  setTagInput(value);
                  setTagsError(null);
                }}
                placeholder="Type a tag name"
                value={tagInput}
                errorText={tagsError ?? undefined}
                helperText="Add existing tags or create new ones. Matching is case-insensitive."
              />

              <View style={[styles.rowWrap, { gap: spacing.xs }]}>
                <Button
                  disabled={isSubmitting || !tagInput.trim()}
                  iconName="pricetag-outline"
                  label={isLoadingTags ? "Loading tags..." : "Add tag"}
                  onPress={() => {
                    void handleAddTag();
                  }}
                  variant="secondary"
                />
              </View>

              {suggestedTags.length > 0 ? (
                <View style={[styles.rowWrap, { gap: spacing.xs }]}>
                  {suggestedTags.map((tag) => (
                    <Pressable
                      accessibilityRole="button"
                      key={`deck-suggested-tag-${tag.id}`}
                      onPress={() => addSelectedTag(tag)}
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
                      key={`deck-selected-tag-${tag.id}`}
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
                label={isSubmitting ? "Creating flashcards..." : "Save flashcards"}
                onPress={() => {
                  void handleSaveFlashcards();
                }}
                variant="primary"
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
