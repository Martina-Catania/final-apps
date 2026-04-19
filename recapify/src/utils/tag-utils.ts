import type { ProjectTag } from "./project-api";

export type FlatTag = {
  id: number;
  name: string;
};

export function normalizeTagName(name: string) {
  return name.trim().toLocaleLowerCase();
}

export function findTagByNameCaseInsensitive(tags: FlatTag[], name: string) {
  const normalizedName = normalizeTagName(name);

  if (!normalizedName) {
    return undefined;
  }

  return tags.find((tag) => normalizeTagName(tag.name) === normalizedName);
}

export function uniqueFlatTags(tags: FlatTag[]) {
  const seenIds = new Set<number>();
  const seenNames = new Set<string>();
  const nextTags: FlatTag[] = [];

  for (const tag of tags) {
    const normalizedName = normalizeTagName(tag.name);

    if (!normalizedName) {
      continue;
    }

    if (seenIds.has(tag.id) || seenNames.has(normalizedName)) {
      continue;
    }

    seenIds.add(tag.id);
    seenNames.add(normalizedName);
    nextTags.push({
      id: tag.id,
      name: normalizedName,
    });
  }

  return nextTags;
}

export function projectTagsToFlatTags(projectTags: ProjectTag[] | undefined) {
  if (!projectTags || projectTags.length === 0) {
    return [];
  }

  return uniqueFlatTags(projectTags.map((projectTag) => projectTag.tag));
}
