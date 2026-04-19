import { useRouter } from "expo-router";
import { useCallback } from "react";

export type ProjectDetailTarget = "quiz" | "flashcard" | "summary";
export type ApiProjectDetailType = "QUIZ" | "DECK" | "SUMMARY";

type ProjectDetailRoute =
  | { pathname: "/quiz/[id]"; params: { id: string } }
  | { pathname: "/flashcard/[id]"; params: { id: string } }
  | { pathname: "/summary/[id]"; params: { id: string } };

type OpenApiProjectDetailOptions = {
  projectType: ApiProjectDetailType;
  quizId?: number | null;
  deckId?: number | null;
  summaryId?: number | null;
};

function createProjectDetailRoute(
  targetType: ProjectDetailTarget,
  entityId: number,
): ProjectDetailRoute {
  if (targetType === "quiz") {
    return {
      pathname: "/quiz/[id]",
      params: { id: String(entityId) },
    };
  }

  if (targetType === "flashcard") {
    return {
      pathname: "/flashcard/[id]",
      params: { id: String(entityId) },
    };
  }

  return {
    pathname: "/summary/[id]",
    params: { id: String(entityId) },
  };
}

function isValidEntityId(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

export function useProjectDetailNavigation() {
  const router = useRouter();

  const openProjectDetail = useCallback(
    (targetType: ProjectDetailTarget, entityId: number) => {
      router.push(createProjectDetailRoute(targetType, entityId));
    },
    [router],
  );

  const openApiProjectDetail = useCallback(
    ({
      projectType,
      quizId,
      deckId,
      summaryId,
    }: OpenApiProjectDetailOptions): boolean => {
      if (projectType === "QUIZ" && isValidEntityId(quizId)) {
        openProjectDetail("quiz", quizId);
        return true;
      }

      if (projectType === "DECK" && isValidEntityId(deckId)) {
        openProjectDetail("flashcard", deckId);
        return true;
      }

      if (projectType === "SUMMARY" && isValidEntityId(summaryId)) {
        openProjectDetail("summary", summaryId);
        return true;
      }

      return false;
    },
    [openProjectDetail],
  );

  return {
    openProjectDetail,
    openApiProjectDetail,
  };
}
