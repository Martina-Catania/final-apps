import { useRouter } from "expo-router";
import { useState } from "react";
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
} from "../../../components";
import { AppTextInput } from "../../../components/TextInput";
import { useAuth } from "../../../context/auth-context";
import { useProjectTagEditor, useSafeNavigation, useThemeTokens } from "../../../hooks";
import { SafeAreaPage } from "../../../screens/safe-area-page";
import { getApiErrorMessage } from "../../../utils/api-request";
import {
  createDeckRequest,
  createFlashcardRequest,
} from "../../../utils/deck-api";
import { createProjectRequest } from "../../../utils/project-api";

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
  const { goBack } = useSafeNavigation();
  const { token, user } = useAuth();
  const { colors, spacing } = useThemeTokens();

  const [deckTitle, setDeckTitle] = useState("");
  const [flashcards, setFlashcards] = useState<FlashcardDraft[]>([createFlashcardDraft(1)]);
  const [nextFlashcardIndex, setNextFlashcardIndex] = useState(2);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [flashcardsError, setFlashcardsError] = useState<string | null>(null);
  const [flashcardErrors, setFlashcardErrors] = useState<Record<string, FlashcardFieldErrors>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    tagInput,
    selectedTags,
    suggestedTags,
    tagsError,
    handleTagInputChange,
    selectSuggestedTag,
    handleAddTag,
    removeSelectedTag,
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

  const handleSaveFlashcards = async () => {
    setSubmitError(null);
    clearTagsError();

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

      await syncProjectTags(project.id);

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
          <FormCard maxWidth={760}>
            <FormHeader
              onBack={goBack}
              subtitle="Set a title, add cards with front and back sides, and save in one step."
              title="Create Flashcards"
            />

            <AppTextInput
              label="Flashcard set name"
              onChangeText={setDeckTitle}
              placeholder="Examples: Biology Basics"
              value={deckTitle}
              errorText={titleError ?? undefined}
              helperText="Name your flashcard set."
            />

            <ProjectTagEditor
              keyPrefix="deck"
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
              primaryIconName="save-outline"
              primaryLabel="Save flashcards"
              primaryLoadingLabel="Creating flashcards..."
            />
          </FormCard>
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
});
