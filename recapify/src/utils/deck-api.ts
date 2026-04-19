import { requestJson } from "./api-request";
import type { Project } from "./project-api";

export type Flashcard = {
  id: number;
  front: string;
  back: string;
  deckId: number;
};

export type Deck = {
  id: number;
  projectId: number;
  project: Project;
  flashcards: Flashcard[];
};

export type CreateFlashcardInput = {
  deckId: number;
  front: string;
  back: string;
};

export type UpdateFlashcardInput = {
  deckId?: number;
  front?: string;
  back?: string;
};

export function createDeckRequest(projectId: number, token?: string) {
  return requestJson<Deck>(
    "/decks",
    {
      method: "POST",
      body: JSON.stringify({ projectId }),
    },
    token,
  );
}

export function listDecksRequest(token?: string) {
  return requestJson<Deck[]>(
    "/decks",
    {
      method: "GET",
    },
    token,
  );
}

export function getDeckByIdRequest(deckId: number, token?: string) {
  return requestJson<Deck>(
    `/decks/${deckId}`,
    {
      method: "GET",
    },
    token,
  );
}

export function createFlashcardRequest(
  input: CreateFlashcardInput,
  token?: string,
) {
  return requestJson<Flashcard>(
    "/flashcards",
    {
      method: "POST",
      body: JSON.stringify(input),
    },
    token,
  );
}

export function updateFlashcardRequest(
  flashcardId: number,
  input: UpdateFlashcardInput,
  token?: string,
) {
  return requestJson<Flashcard>(
    `/flashcards/${flashcardId}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
    token,
  );
}

export function deleteFlashcardRequest(flashcardId: number, token?: string) {
  return requestJson<Flashcard>(
    `/flashcards/${flashcardId}`,
    {
      method: "DELETE",
    },
    token,
  );
}