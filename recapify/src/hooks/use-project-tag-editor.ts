import { useCallback, useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "../utils/api-request";
import {
  addTagToProjectRequest,
  createTagRequest,
  listTagsRequest,
  removeTagFromProjectRequest,
  type Tag,
} from "../utils/tag-api";
import {
  findTagByNameCaseInsensitive,
  normalizeTagName,
  uniqueFlatTags,
} from "../utils/tag-utils";

type UseProjectTagEditorOptions = {
  token?: string;
};

type UseProjectTagEditorResult = {
  tagInput: string;
  selectedTags: Tag[];
  suggestedTags: Tag[];
  tagsError: string | null;
  isLoadingTags: boolean;
  setTagInput: (value: string) => void;
  selectSuggestedTag: (tag: Tag) => void;
  handleAddTag: () => Promise<void>;
  removeSelectedTag: (tagId: number) => void;
  initializeFromProjectTags: (tags: Tag[]) => void;
  clearTagState: () => void;
  clearTagsError: () => void;
  syncProjectTags: (projectId: number) => Promise<void>;
};

export function useProjectTagEditor(
  options: UseProjectTagEditorOptions,
): UseProjectTagEditorResult {
  const { token } = options;

  const [initialTagIds, setInitialTagIds] = useState<number[]>([]);
  const [tagInput, setTagInputState] = useState("");
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
      .filter((tag) => tag.name.includes(normalizedInput) && !selectedTagIds.has(tag.id))
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

  const clearTagsError = useCallback(() => {
    setTagsError(null);
  }, []);

  const setTagInput = useCallback(
    (value: string) => {
      setTagInputState(value);
      if (tagsError) {
        setTagsError(null);
      }
    },
    [tagsError],
  );

  const selectSuggestedTag = useCallback(
    (tag: Tag) => {
      addSelectedTag(tag);
      setTagInputState("");
      setTagsError(null);
    },
    [addSelectedTag],
  );

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
      setTagInputState("");
      return;
    }

    try {
      const createdTag = await createTagRequest(normalizedName, token);
      setAvailableTags((current) => uniqueFlatTags([...current, createdTag]));
      addSelectedTag(createdTag);
      setTagInputState("");
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
          setTagInputState("");
          return;
        }
      } catch {
        // Keep the original error message below when refresh also fails.
      }

      setTagsError(getApiErrorMessage(error, "Unable to create tag"));
    }
  }, [addSelectedTag, availableTags, selectedTags, tagInput, token]);

  const removeSelectedTag = useCallback((tagId: number) => {
    setSelectedTags((current) => current.filter((tag) => tag.id !== tagId));
  }, []);

  const initializeFromProjectTags = useCallback((tags: Tag[]) => {
    const normalizedTags = uniqueFlatTags(tags);
    setInitialTagIds(normalizedTags.map((tag) => tag.id));
    setSelectedTags(normalizedTags);
    setAvailableTags((current) => uniqueFlatTags([...current, ...normalizedTags]));
    setTagInputState("");
    setTagsError(null);
  }, []);

  const clearTagState = useCallback(() => {
    setInitialTagIds([]);
    setSelectedTags([]);
    setTagInputState("");
    setTagsError(null);
  }, []);

  const syncProjectTags = useCallback(
    async (projectId: number) => {
      if (!token) {
        return;
      }

      const initialIds = new Set(initialTagIds);
      const nextIds = new Set(selectedTags.map((tag) => tag.id));

      const tagIdsToAdd = [...nextIds].filter((tagId) => !initialIds.has(tagId));
      const tagIdsToRemove = [...initialIds].filter((tagId) => !nextIds.has(tagId));

      await Promise.all([
        ...tagIdsToAdd.map((tagId) => addTagToProjectRequest(projectId, tagId, token)),
        ...tagIdsToRemove.map((tagId) => removeTagFromProjectRequest(projectId, tagId, token)),
      ]);

      setInitialTagIds([...nextIds]);
    },
    [initialTagIds, selectedTags, token],
  );

  return {
    tagInput,
    selectedTags,
    suggestedTags,
    tagsError,
    isLoadingTags,
    setTagInput,
    selectSuggestedTag,
    handleAddTag,
    removeSelectedTag,
    initializeFromProjectTags,
    clearTagState,
    clearTagsError,
    syncProjectTags,
  };
}
