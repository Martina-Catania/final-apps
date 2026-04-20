import type { ProjectType } from "./project-api";
import type { FlatTag } from "./tag-utils";

export type ProjectTypeFilterOption<TProjectType extends string = ProjectType> = {
  value: TProjectType;
  label: string;
};

export const PROJECT_TYPE_FILTER_OPTIONS: ProjectTypeFilterOption<ProjectType>[] = [
  {
    value: "QUIZ",
    label: "Quiz",
  },
  {
    value: "SUMMARY",
    label: "Summary",
  },
  {
    value: "DECK",
    label: "Flashcards",
  },
];

export type FilterableProject<TProjectType extends string = ProjectType> = {
  title: string;
  tags: FlatTag[];
  type?: TProjectType;
};

export type ProjectSearchFilterInput<TProjectType extends string = ProjectType> = {
  query: string;
  selectedTagIds: number[];
  selectedProjectTypes?: TProjectType[];
};

function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

function normalizeTagIds(tagIds: number[]) {
  const validTagIds = tagIds.filter((tagId) => Number.isInteger(tagId) && tagId > 0);

  return [...new Set(validTagIds)];
}

function normalizeProjectTypes<TProjectType extends string>(
  selectedProjectTypes: TProjectType[] | undefined,
) {
  if (!Array.isArray(selectedProjectTypes)) {
    return [];
  }

  const normalizedValues = selectedProjectTypes.filter(
    (value) => typeof value === "string" && value.length > 0,
  );

  return [...new Set(normalizedValues)];
}

export function filterProjectsBySearchFilters<
  TProject extends FilterableProject<TProjectType>,
  TProjectType extends string = ProjectType,
>(
  projects: TProject[],
  filters: ProjectSearchFilterInput<TProjectType>,
) {
  const normalizedQuery = normalizeQuery(filters.query);
  const normalizedTagIds = normalizeTagIds(filters.selectedTagIds);
  const normalizedProjectTypes = normalizeProjectTypes(filters.selectedProjectTypes);

  const hasQueryFilter = normalizedQuery.length > 0;
  const hasTagFilter = normalizedTagIds.length > 0;
  const hasProjectTypeFilter = normalizedProjectTypes.length > 0;

  if (!hasQueryFilter && !hasTagFilter && !hasProjectTypeFilter) {
    return projects;
  }

  return projects.filter((project) => {
    if (hasQueryFilter && !project.title.toLowerCase().includes(normalizedQuery)) {
      return false;
    }

    if (hasTagFilter) {
      const projectTagIds = new Set(project.tags.map((tag) => tag.id));

      const hasAllSelectedTags = normalizedTagIds.every((selectedTagId) => projectTagIds.has(selectedTagId));

      if (!hasAllSelectedTags) {
        return false;
      }
    }

    if (!hasProjectTypeFilter) {
      return true;
    }

    if (!project.type) {
      return false;
    }

    return normalizedProjectTypes.includes(project.type);
  });
}