import type { ProjectType } from "../../generated/prisma/index.js";
import type { AppContext } from "../context.js";

export type SearchPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type SearchUserResult = {
  id: number;
  username: string;
  avatarUrl: string | null;
  followerCount: number;
  followingCount: number;
  projectCount: number;
};

export type SearchProjectResult = {
  id: number;
  type: ProjectType;
  title: string;
  timesPlayed: number;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: number;
    username: string;
    avatarUrl: string | null;
  };
  quizId: number | null;
  deckId: number | null;
};

export type SearchCatalogInput = {
  query: string;
  usersPage: number;
  usersLimit: number;
  projectsPage: number;
  projectsLimit: number;
};

export type SearchCatalogResult = {
  query: string;
  users: SearchUserResult[];
  projects: SearchProjectResult[];
  usersPagination: SearchPagination;
  projectsPagination: SearchPagination;
};

function buildPagination(page: number, limit: number, total: number): SearchPagination {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

function rankUsersByQuery(query: string, users: SearchUserResult[]) {
  const normalizedQuery = query.toLocaleLowerCase();

  return [...users].sort((leftUser, rightUser) => {
    const leftName = leftUser.username.toLocaleLowerCase();
    const rightName = rightUser.username.toLocaleLowerCase();
    const leftRank = leftName.startsWith(normalizedQuery) ? 0 : 1;
    const rightRank = rightName.startsWith(normalizedQuery) ? 0 : 1;

    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return leftName.localeCompare(rightName);
  });
}

async function searchUsers(
  query: string,
  page: number,
  limit: number,
  ctx: AppContext,
) {
  const matchedUsers = await ctx.prisma.user.findMany({
    where: {
      username: {
        contains: query,
      },
    },
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      _count: {
        select: {
          followers: true,
          following: true,
          projects: true,
        },
      },
    },
  });

  const rankedUsers = rankUsersByQuery(
    query,
    matchedUsers.map((user) => ({
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      followerCount: user._count.followers,
      followingCount: user._count.following,
      projectCount: user._count.projects,
    })),
  );

  const offset = (page - 1) * limit;
  const users = rankedUsers.slice(offset, offset + limit);

  return {
    users,
    total: rankedUsers.length,
  };
}

async function searchProjects(
  query: string,
  page: number,
  limit: number,
  ctx: AppContext,
) {
  const offset = (page - 1) * limit;
  const whereClause = {
    title: {
      contains: query,
    },
  };

  const [total, projects] = await Promise.all([
    ctx.prisma.project.count({ where: whereClause }),
    ctx.prisma.project.findMany({
      where: whereClause,
      orderBy: [
        {
          timesPlayed: "desc",
        },
        {
          createdAt: "desc",
        },
        {
          id: "desc",
        },
      ],
      skip: offset,
      take: limit,
      select: {
        id: true,
        type: true,
        title: true,
        timesPlayed: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        quiz: {
          select: {
            id: true,
          },
        },
        deck: {
          select: {
            id: true,
          },
        },
      },
    }),
  ]);

  return {
    projects: projects.map((project) => ({
      id: project.id,
      type: project.type,
      title: project.title,
      timesPlayed: project.timesPlayed,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      user: project.user,
      quizId: project.quiz?.id ?? null,
      deckId: project.deck?.id ?? null,
    })),
    total,
  };
}

export async function searchCatalog(
  input: SearchCatalogInput,
  ctx: AppContext,
): Promise<SearchCatalogResult> {
  const {
    query,
    usersPage,
    usersLimit,
    projectsPage,
    projectsLimit,
  } = input;

  const [userSearchResult, projectSearchResult] = await Promise.all([
    searchUsers(query, usersPage, usersLimit, ctx),
    searchProjects(query, projectsPage, projectsLimit, ctx),
  ]);

  return {
    query,
    users: userSearchResult.users,
    projects: projectSearchResult.projects,
    usersPagination: buildPagination(usersPage, usersLimit, userSearchResult.total),
    projectsPagination: buildPagination(projectsPage, projectsLimit, projectSearchResult.total),
  };
}