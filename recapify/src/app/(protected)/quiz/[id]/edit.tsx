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
import { useThemeTokens } from "../../../../hooks";
import { SafeAreaPage } from "../../../../screens/safe-area-page";
import { getApiErrorMessage } from "../../../../utils/api-request";
import { updateProjectRequest } from "../../../../utils/project-api";
import {
  addTagToProjectRequest,
  createTagRequest,
  listTagsRequest,
  removeTagFromProjectRequest,
  type Tag,
} from "../../../../utils/tag-api";
import {
  findTagByNameCaseInsensitive,
  normalizeTagName,
  uniqueFlatTags,
} from "../../../../utils/tag-utils";
import {
  createQuizQuestionRequest,
  deleteQuizQuestionRequest,
  getQuizByIdRequest,
  updateQuizQuestionRequest,
} from "../../../../utils/quiz-api";

type QuestionDraft = {
  key: string;
  questionId: number | null;
  question: string;
  answer: string;
  decoy1: string;
  decoy2: string;
  decoy3: string;
};

type QuestionField = Exclude<keyof QuestionDraft, "key" | "questionId">;

type QuestionFieldErrors = Partial<Record<QuestionField, string>>;

function parseQuizId(value: string | string[] | undefined): number | null {
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

function createQuestionDraft(index: number): QuestionDraft {
  return {
    key: `new-${index}`,
    questionId: null,
    question: "",
    answer: "",
    decoy1: "",
    decoy2: "",
    decoy3: "",
  };
}

export default function QuizEditPage() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const quizId = useMemo(() => parseQuizId(id), [id]);
  const router = useRouter();
  const { token, user } = useAuth();
  const { colors, spacing, typography, radius } = useThemeTokens();

  const [projectId, setProjectId] = useState<number | null>(null);
  const [creatorUserId, setCreatorUserId] = useState<number | null>(null);
  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [initialQuestionIds, setInitialQuestionIds] = useState<number[]>([]);
  const [initialTagIds, setInitialTagIds] = useState<number[]>([]);
  const [nextQuestionIndex, setNextQuestionIndex] = useState(1);
  const [tagInput, setTagInput] = useState("");
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [tagsError, setTagsError] = useState<string | null>(null);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [questionErrors, setQuestionErrors] = useState<Record<string, QuestionFieldErrors>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

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

  const syncProjectTags = useCallback(
    async (nextProjectId: number) => {
      if (!token) {
        return;
      }

      const initialIds = new Set(initialTagIds);
      const nextIds = new Set(selectedTags.map((tag) => tag.id));

      const tagIdsToAdd = [...nextIds].filter((tagId) => !initialIds.has(tagId));
      const tagIdsToRemove = [...initialIds].filter((tagId) => !nextIds.has(tagId));

      await Promise.all([
        ...tagIdsToAdd.map((tagId) => addTagToProjectRequest(nextProjectId, tagId, token)),
        ...tagIdsToRemove.map((tagId) => removeTagFromProjectRequest(nextProjectId, tagId, token)),
      ]);
    },
    [initialTagIds, selectedTags, token],
  );

  const addQuestion = () => {
    setQuestions((current) => [...current, createQuestionDraft(nextQuestionIndex)]);
    setNextQuestionIndex((current) => current + 1);
  };

  const removeQuestion = (key: string) => {
    setQuestions((current) => current.filter((item) => item.key !== key));
    setQuestionErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const updateQuestionField = (
    key: string,
    field: QuestionField,
    value: string,
  ) => {
    setQuestions((current) =>
      current.map((item) => (item.key === key ? { ...item, [field]: value } : item)),
    );

    setQuestionErrors((current) => {
      const nextForQuestion = current[key];

      if (!nextForQuestion || !nextForQuestion[field]) {
        return current;
      }

      return {
        ...current,
        [key]: {
          ...nextForQuestion,
          [field]: undefined,
        },
      };
    });
  };

  const validate = () => {
    let isValid = true;
    const trimmedTitle = quizTitle.trim();

    if (!trimmedTitle) {
      setTitleError("Quiz name is required");
      isValid = false;
    } else {
      setTitleError(null);
    }

    if (questions.length === 0) {
      setQuestionsError("Add at least one question before saving");
      isValid = false;
    } else {
      setQuestionsError(null);
    }

    const nextQuestionErrors: Record<string, QuestionFieldErrors> = {};

    for (const question of questions) {
      const currentErrors: QuestionFieldErrors = {};

      if (!question.question.trim()) {
        currentErrors.question = "Question text is required";
      }

      if (!question.answer.trim()) {
        currentErrors.answer = "Answer is required";
      }

      if (!question.decoy1.trim()) {
        currentErrors.decoy1 = "Decoy 1 is required";
      }

      if (!question.decoy2.trim()) {
        currentErrors.decoy2 = "Decoy 2 is required";
      }

      if (!question.decoy3.trim()) {
        currentErrors.decoy3 = "Decoy 3 is required";
      }

      if (Object.keys(currentErrors).length > 0) {
        nextQuestionErrors[question.key] = currentErrors;
        isValid = false;
      }
    }

    setQuestionErrors(nextQuestionErrors);

    return isValid;
  };

  const loadQuiz = useCallback(async () => {
    if (!quizId) {
      setLoadError("Invalid quiz id");
      setIsLoading(false);
      return;
    }

    if (!token || !user) {
      setLoadError("You must be signed in to edit quizzes");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      const payload = await getQuizByIdRequest(quizId, token ?? undefined);

      if (payload.project.userId !== user.id) {
        setCreatorUserId(payload.project.userId);
        setLoadError("You are not allowed to edit this quiz");
        setProjectId(null);
        setQuizTitle("");
        setInitialQuestionIds([]);
        setInitialTagIds([]);
        setQuestions([]);
        setSelectedTags([]);
        setTagInput("");
        setTagsError(null);
        setNextQuestionIndex(1);
        return;
      }

      setProjectId(payload.projectId);
      setCreatorUserId(payload.project.userId);
      setQuizTitle(payload.project.title);
      setInitialQuestionIds(payload.questions.map((item) => item.id));
      const projectTags = uniqueFlatTags(payload.project.tags.map((projectTag) => projectTag.tag));
      setInitialTagIds(projectTags.map((tag) => tag.id));
      setSelectedTags(projectTags);
      setTagInput("");
      setTagsError(null);

      const mappedQuestions: QuestionDraft[] = payload.questions.map((item, index) => ({
        key: `existing-${item.id}-${index + 1}`,
        questionId: item.id,
        question: item.question,
        answer: item.answer,
        decoy1: item.decoy1,
        decoy2: item.decoy2,
        decoy3: item.decoy3,
      }));

      if (mappedQuestions.length === 0) {
        setQuestions([createQuestionDraft(1)]);
        setNextQuestionIndex(2);
      } else {
        setQuestions(mappedQuestions);
        setNextQuestionIndex(mappedQuestions.length + 1);
      }
    } catch (error) {
      setLoadError(getApiErrorMessage(error, "Unable to load quiz"));
      setCreatorUserId(null);
      setQuestions([]);
      setInitialTagIds([]);
      setSelectedTags([]);
      setTagInput("");
      setTagsError(null);
    } finally {
      setIsLoading(false);
    }
  }, [quizId, token, user]);

  useEffect(() => {
    void loadQuiz();
  }, [loadQuiz]);

  const handleSaveQuiz = async () => {
    setSubmitError(null);
    setTagsError(null);

    if (!token || !user) {
      setSubmitError("You must be signed in to edit quizzes");
      return;
    }

    if (creatorUserId !== user.id) {
      setSubmitError("You are not allowed to edit this quiz");
      return;
    }

    if (!quizId || !projectId) {
      setSubmitError("Unable to edit this quiz");
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
          title: quizTitle.trim(),
        },
        token,
      );

      await syncProjectTags(projectId);

      const remainingQuestionIds = new Set(initialQuestionIds);

      for (const question of questions) {
        const payload = {
          question: question.question.trim(),
          answer: question.answer.trim(),
          decoy1: question.decoy1.trim(),
          decoy2: question.decoy2.trim(),
          decoy3: question.decoy3.trim(),
        };

        if (question.questionId) {
          await updateQuizQuestionRequest(question.questionId, payload, token);
          remainingQuestionIds.delete(question.questionId);
        } else {
          await createQuizQuestionRequest(
            {
              quizId,
              ...payload,
            },
            token,
          );
        }
      }

      for (const questionId of remainingQuestionIds) {
        await deleteQuizQuestionRequest(questionId, token);
      }

      router.replace("..");
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, "Unable to update quiz"));
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
            Quiz could not be loaded
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
              onPress={() => router.replace("../..")}
              variant="default"
            />
            <Button
              fullWidth
              iconName="refresh-outline"
              label="Try again"
              onPress={() => {
                void loadQuiz();
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
                  Edit Quiz
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: typography.secondary.md,
                  }}
                >
                  Update the quiz name and questions. Changes are only saved when you press Save changes.
                </Text>
              </View>
            </View>

            <AppTextInput
              label="Quiz name"
              onChangeText={setQuizTitle}
              placeholder="Examples: Biology Basics"
              value={quizTitle}
              errorText={titleError ?? undefined}
              helperText="Rename your quiz."
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
                      key={`quiz-edit-suggested-tag-${tag.id}`}
                      onPress={() => {
                        addSelectedTag(tag);
                        setTagInput("");
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
                      key={`quiz-edit-selected-tag-${tag.id}`}
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
                  Questions
                </Text>
                <Button
                  iconName="add-circle-outline"
                  label="Add question"
                  onPress={addQuestion}
                  variant="secondary"
                />
              </View>

              {questionsError ? (
                <Text
                  style={{
                    color: colors.danger,
                    fontSize: typography.secondary.sm,
                  }}
                >
                  {questionsError}
                </Text>
              ) : null}

              <View style={{ gap: spacing.md }}>
                {questions.map((item, index) => {
                  const currentErrors = questionErrors[item.key] ?? {};

                  return (
                    <Accordion
                      defaultExpanded={index === 0}
                      key={item.key}
                      title={`Question ${index + 1}`}
                    >
                      <View style={{ gap: spacing.sm }}>
                        {questions.length > 1 ? (
                          <View style={{ alignItems: "flex-end" }}>
                            <Button
                              iconName="trash-outline"
                              label="Remove"
                              onPress={() => removeQuestion(item.key)}
                              variant="default"
                            />
                          </View>
                        ) : null}

                        <AppTextInput
                          label="Question"
                          onChangeText={(value) => updateQuestionField(item.key, "question", value)}
                          placeholder="Write your question"
                          value={item.question}
                          errorText={currentErrors.question}
                        />

                        <AppTextInput
                          label="Correct answer"
                          onChangeText={(value) => updateQuestionField(item.key, "answer", value)}
                          placeholder="Write the correct answer"
                          value={item.answer}
                          errorText={currentErrors.answer}
                        />

                        <AppTextInput
                          label="Decoy 1"
                          onChangeText={(value) => updateQuestionField(item.key, "decoy1", value)}
                          placeholder="Write a decoy answer"
                          value={item.decoy1}
                          errorText={currentErrors.decoy1}
                        />

                        <AppTextInput
                          label="Decoy 2"
                          onChangeText={(value) => updateQuestionField(item.key, "decoy2", value)}
                          placeholder="Write a decoy answer"
                          value={item.decoy2}
                          errorText={currentErrors.decoy2}
                        />

                        <AppTextInput
                          label="Decoy 3"
                          onChangeText={(value) => updateQuestionField(item.key, "decoy3", value)}
                          placeholder="Write a decoy answer"
                          value={item.decoy3}
                          errorText={currentErrors.decoy3}
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
                  void handleSaveQuiz();
                }}
                variant="primary"
              />
              <Button
                disabled={isSubmitting}
                fullWidth
                iconName="close-outline"
                label="Cancel"
                onPress={() => router.back()}
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
