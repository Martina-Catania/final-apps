import { useCallback, useEffect, useState } from "react";

import { listTagsRequest } from "../utils/tag-api";
import { uniqueFlatTags, type FlatTag } from "../utils/tag-utils";

type UseProjectSearchFiltersOptions<TProjectType extends string> = {
  token?: string;
  loadTags?: boolean;
  requireTokenForTags?: boolean;
  initialQuery?: string;
  initialSelectedTagIds?: number[];
  initialSelectedProjectTypes?: TProjectType[];
};

type UseProjectSearchFiltersResult<TProjectType extends string> = {
  query: string;
  setQuery: (value: string) => void;
  availableTags: FlatTag[];
  isLoadingTags: boolean;
  selectedTagIds: number[];
  selectedProjectTypes: TProjectType[];
  toggleTagFilter: (tagId: number) => void;
  toggleProjectTypeFilter: (projectType: TProjectType) => void;
  reloadAvailableTags: () => Promise<void>;
};

function normalizeTagIds(tagIds: number[]) {
  const validTagIds = tagIds.filter((tagId) => Number.isInteger(tagId) && tagId > 0);

  return [...new Set(validTagIds)];
}

function normalizeProjectTypes<TProjectType extends string>(projectTypes: TProjectType[]) {
  const validProjectTypes = projectTypes.filter(
    (value) => typeof value === "string" && value.length > 0,
  );

  return [...new Set(validProjectTypes)];
}

export function useProjectSearchFilters<TProjectType extends string = string>(
  options: UseProjectSearchFiltersOptions<TProjectType> = {},
): UseProjectSearchFiltersResult<TProjectType> {
  const {
    token,
    loadTags = true,
    requireTokenForTags = false,
    initialQuery = "",
    initialSelectedTagIds = [],
    initialSelectedProjectTypes = [],
  } = options;

  const [query, setQuery] = useState(initialQuery);
  const [availableTags, setAvailableTags] = useState<FlatTag[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>(() => normalizeTagIds(initialSelectedTagIds));
  const [selectedProjectTypes, setSelectedProjectTypes] = useState<TProjectType[]>(() => normalizeProjectTypes(initialSelectedProjectTypes));

  const loadAvailableTags = useCallback(async () => {
    if (!loadTags || (requireTokenForTags && !token)) {
      setAvailableTags([]);
      setIsLoadingTags(false);
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
  }, [loadTags, requireTokenForTags, token]);

  const toggleTagFilter = useCallback((tagId: number) => {
    if (!Number.isInteger(tagId) || tagId <= 0) {
      return;
    }

    setSelectedTagIds((current) => {
      if (current.includes(tagId)) {
        return current.filter((value) => value !== tagId);
      }

      return [...current, tagId];
    });
  }, []);

  const toggleProjectTypeFilter = useCallback((projectType: TProjectType) => {
    setSelectedProjectTypes((current) => {
      if (current.includes(projectType)) {
        return current.filter((value) => value !== projectType);
      }

      return [...current, projectType];
    });
  }, []);

  useEffect(() => {
    void loadAvailableTags();
  }, [loadAvailableTags]);

  return {
    query,
    setQuery,
    availableTags,
    isLoadingTags,
    selectedTagIds,
    selectedProjectTypes,
    toggleTagFilter,
    toggleProjectTypeFilter,
    reloadAvailableTags: loadAvailableTags,
  };
}