import { useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Button } from "../../../components";
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
                    <View
                      key={item.key}
                      style={[
                        styles.flashcardCard,
                        {
                          borderColor: colors.border,
                          borderRadius: radius.sm,
                          gap: spacing.sm,
                          padding: spacing.md,
                        },
                      ]}
                    >
                      <View style={[styles.rowBetween, { gap: spacing.sm }]}>
                        <Text
                          style={{
                            color: colors.textPrimary,
                            fontSize: typography.secondary.lg,
                            fontWeight: typography.weights.semibold,
                          }}
                        >
                          Card {index + 1}
                        </Text>
                        {flashcards.length > 1 ? (
                          <Button
                            iconName="trash-outline"
                            label="Remove"
                            onPress={() => removeFlashcard(item.key)}
                            variant="default"
                          />
                        ) : null}
                      </View>

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
  flashcardCard: {
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
});
