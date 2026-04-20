import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Accordion,
  Button,
  FormActions,
  FormCard,
  FormHeader,
  InlineErrorText,
  ProjectTagEditor,
  SectionHeader,
} from "../../../../components";
import { AppTextInput } from "../../../../components/TextInput";
import { useAuth } from "../../../../context/auth-context";
import { useProjectTagEditor, useSafeNavigation, useThemeTokens } from "../../../../hooks";
import { EditPageState } from "../../../../screens/edit-page-state";
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
  const { colors, spacing } = useThemeTokens();

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

  return (
    <EditPageState
      actions={[
        {
          iconName: "home-outline",
          label: "Back to home",
          onPress: () => {
            router.replace("/");
          },
          variant: "default",
        },
        {
          iconName: "refresh-outline",
          label: "Try again",
          onPress: () => {
            void loadDeck();
          },
          variant: "primary",
        },
      ]}
      backgroundColor={colors.background}
      errorTitle="Flashcards could not be loaded"
      isLoading={isLoading}
      loadError={loadError}
    >
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
            <FormCard maxWidth={760}>
              <FormHeader
                onBack={goBack}
                subtitle="Update the set title and cards. Changes are saved when you press Save changes."
                title="Edit Flashcards"
              />

            <AppTextInput
              label="Flashcard set name"
              onChangeText={setDeckTitle}
              placeholder="Examples: Biology Basics"
              value={deckTitle}
              errorText={titleError ?? undefined}
              helperText="Rename your flashcard set."
            />

            <ProjectTagEditor
              keyPrefix="deck-edit"
              onAddTag={handleAddTag}
              onRemoveSelectedTag={removeSelectedTag}
              onSelectSuggestedTag={selectSuggestedTag}
              onTagInputChange={handleTagInputChange}
              selectedTags={selectedTags}
              suggestedTags={suggestedTags}
              tagInput={tagInput}
              tagsError={tagsError}
            />

              <View style={{ gap: spacing.sm }}>
                <SectionHeader
                  actionIconName="add-circle-outline"
                  actionLabel="Add card"
                  label="Cards"
                  onActionPress={addFlashcard}
                />

                <InlineErrorText message={flashcardsError} />

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

              <InlineErrorText message={submitError} />

              <FormActions
                disabled={isSubmitting}
                isPrimaryLoading={isSubmitting}
                onPrimaryPress={() => {
                  void handleSaveFlashcards();
                }}
                onSecondaryPress={goBack}
                primaryIconName="save-outline"
                primaryLabel="Save changes"
                primaryLoadingLabel="Saving changes..."
                secondaryIconName="close-outline"
                secondaryLabel="Cancel"
              />
            </FormCard>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaPage>
    </EditPageState>
  );
}

const styles = StyleSheet.create({
  keyboardAvoiding: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
});
