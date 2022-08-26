import { Issue, LinearClient } from "@linear/sdk";
import _ from "lodash";
import { ENV_LINEAR_API_KEY } from "./constants";
import { getLinearCards } from "./linear/api";
import { Context, GenerateNotesConfig, PluginConfig } from "./types";
import * as micromatch from "micromatch";
import { generateLinearClient } from "./linear/clientGenerator";

export async function generateNotes(
  pluginConfig: PluginConfig,
  context: Context
) {
  if (!pluginConfig.generateNotes) {
    return "";
  }
  const linearClient = generateLinearClient(context);

  const { branch } = context.envCi;

  const notesConfigForBranch = pluginConfig.generateNotes.find((b) =>
    micromatch.isMatch(branch, b.branchName)
  );
  const stateName = notesConfigForBranch?.stateName;

  if (!stateName) {
    throw new Error(`State not found for branch ${branch}`);
  }

  const cards = await getEligibleCardsFromLinear({
    stateName,
    linearClient,
    context,
    pluginConfig,
  });

  const releaseNotes = await generateReleaseNotesFromCards({
    cards,
    notesConfigForBranch,
  });

  return releaseNotes.join("\n");
}

async function getEligibleCardsFromLinear({
  stateName,
  linearClient,
  context,
  pluginConfig,
}: {
  stateName: string;
  linearClient: LinearClient;
  context: Context;
  pluginConfig: PluginConfig;
}) {
  const unsortedCards = await filterOutSubIssues(
    await getLinearCards({
      stateName,
      linearClient,
      context,
      teamKeys: pluginConfig.teamKeys,
    })
  );
  const cards = _.sortBy(unsortedCards, "identifier");
  return cards;
}

async function generateReleaseNotesFromCards({
  cards,
  notesConfigForBranch,
}: {
  cards: Issue[];
  notesConfigForBranch: GenerateNotesConfig;
}) {
  const releaseNotes: string[] = [];
  releaseNotes.push("## Linear Cards released");

  if (cards.length) {
    const sortedByPriorityCategories = sortByPriority(notesConfigForBranch);

    const sortedByOrderInNotes = _.sortBy(
      sortedByPriorityCategories,
      "orderInNotes"
    );
    const unmentionedCards = await fillCardsAndReturnUnmentioned({
      sortedByPriorityCategories,
      allCards: cards,
    });

    await fillReleaseNotes({ sortedByOrderInNotes, releaseNotes });

    await fillUnmentionedCategory({
      unmentionedCards,
      releaseNotes,
    });
  } else {
    releaseNotes.push("None linear cards are released in this release");
  }
  return releaseNotes;
}

async function fillUnmentionedCategory({
  releaseNotes,
  unmentionedCards,
}: {
  releaseNotes: string[];
  unmentionedCards: Issue[];
}) {
  if (unmentionedCards.length) {
    releaseNotes.push("### Other");
    releaseNotes.push(...getCardTableHeader());
    for (const card of unmentionedCards) {
      releaseNotes.push(getCardTableRow({ card, relatedCard: undefined }));
    }
  }
}

async function fillReleaseNotes({
  sortedByOrderInNotes,
  releaseNotes,
}: {
  sortedByOrderInNotes: CategoryUnwinded[];
  releaseNotes: string[];
}) {
  for (const { category, cards: categoryCards } of sortedByOrderInNotes) {
    releaseNotes.push(`### ${category.title}`);

    const relationCriteria = category.criteria.find(
      (c) => c.relatedToIssueInTeam
    )?.relatedToIssueInTeam;
    releaseNotes.push(...getCardTableHeader(relationCriteria));

    for (const card of categoryCards) {
      const relatedCard: Issue | undefined = await getRelatedCard({
        teamKey: relationCriteria,
        card,
      });
      releaseNotes.push(getCardTableRow({ card, relatedCard }));
    }
  }
}

type CategoryUnwinded = {
  category: {
    title: string;
    priority?: number | undefined;
    orderInNotes?: number | undefined;
    criteria: [
      {
        label?: string | undefined;
        isInProject?: boolean | undefined;
        relatedToIssueInTeam?: string | undefined;
      }
    ];
  };
  cards: Issue[];
  orderInNotes: number;
};

async function fillCardsAndReturnUnmentioned({
  sortedByPriorityCategories,
  allCards,
}: {
  sortedByPriorityCategories: CategoryUnwinded[];
  allCards: Issue[];
}) {
  let unmentionedCards = allCards.slice();
  let mentionedCards: Issue[] = [];
  for (const obj of sortedByPriorityCategories) {
    const category = obj.category;
    const filteredCards = await filterCards({ category, cards: allCards });

    obj.cards = filteredCards.filter(
      (card) => !mentionedCards.some((c) => c.identifier === card.identifier)
    );
    mentionedCards.push(...obj.cards);
    unmentionedCards = unmentionedCards.filter((c) =>
      obj.cards.every((f) => f.id !== c.id)
    );
  }
  return unmentionedCards;
}

function sortByPriority(notesConfigForBranch: GenerateNotesConfig) {
  const categoriesWithCards = notesConfigForBranch.categories.map(
    (category, index) => ({
      category: category,
      cards: [] as Issue[],
      orderInNotes: category.orderInNotes || index,
    })
  );
  const sortedByPriorityCategories = _.sortBy(
    categoriesWithCards,
    "category.priority"
  );
  return sortedByPriorityCategories;
}

async function filterCards({
  category,
  cards,
}: {
  category: {
    title: string;
    criteria: [
      {
        label?: string | undefined;
        isInProject?: boolean | undefined;
        relatedToIssueInTeam?: string | undefined;
      }
    ];
  };
  cards: Issue[];
}) {
  const filteredCards: Issue[] = [];
  for (const criteria of category.criteria) {
    const cardsByCriteria: Issue[][] = [];
    if (criteria.isInProject) {
      cardsByCriteria.push(await getCardsInProjects(cards));
    }
    if (criteria.label) {
      cardsByCriteria.push(
        await getCardsWithLabel({ cards, label: criteria.label })
      );
    }
    if (criteria.relatedToIssueInTeam) {
      cardsByCriteria.push(
        await getCardsWithRelatedIssues({
          cards,
          relatedTeamKey: criteria.relatedToIssueInTeam,
        })
      );
    }
    filteredCards.push(..._.intersectionBy(...cardsByCriteria, "id"));
  }
  return filteredCards;
}

function getCardTableHeader(relationCriteria?: string | undefined): string[] {
  return [
    `| Card Id ${relationCriteria ? "| Related Card " : ""}| Card Title |`,
    `| --- ${relationCriteria ? "| --- " : ""}| --- |`,
  ];
}

function getCardTableRow({
  card,
  relatedCard,
}: {
  card: Issue;
  relatedCard: Issue | undefined;
}): string {
  return `|[${card.identifier}](${card.url})${
    relatedCard ? `|[${relatedCard.identifier}](${relatedCard.url})` : ""
  }|${card.title.replace(/\|/g, ",")}|`;
}

async function getRelatedCard({
  teamKey,
  card,
}: {
  teamKey: string | undefined;
  card: Issue;
}) {
  let relatedCard: Issue | undefined;
  if (teamKey) {
    const relations = (await card.relations()).nodes;
    for (const relation of relations) {
      const relatedIssue = await relation.relatedIssue;
      if (relatedIssue) {
        const team = (await relatedIssue.team)?.key;
        if (team === teamKey) {
          relatedCard = relatedIssue;
        }
      }
    }
  }
  return relatedCard;
}

async function getCardsWithLabel({
  cards,
  label,
}: {
  cards: Issue[];
  label: string;
}) {
  const result: Issue[] = [];
  for (const card of cards) {
    if ((await card.labels()).nodes.some((l) => l.name === label)) {
      result.push(card);
    }
  }
  return result;
}

async function getCardsInProjects(cards: Issue[]) {
  const result: Issue[] = [];
  for (const card of cards) {
    if (card.project) {
      result.push(card);
    }
  }
  return result;
}

async function getCardsWithRelatedIssues({
  cards,
  relatedTeamKey,
}: {
  cards: Issue[];
  relatedTeamKey: string;
}) {
  const result: Issue[] = [];
  for (const card of cards) {
    const relations = (await card.relations()).nodes;
    let hasTeamRelation = false;
    for (const relation of relations) {
      const relatedIssue = await relation.relatedIssue;
      if (!relatedIssue) {
        continue;
      }
      const team = (await relatedIssue.team)?.key;
      if (team === relatedTeamKey) {
        hasTeamRelation = true;
        break;
      }
    }
    if (hasTeamRelation) {
      result.push(card);
    }
  }
  return result;
}

async function filterOutSubIssues(cards: Issue[]) {
  const hasParentIssue: Record<string, boolean> = {};
  for (const card of cards) {
    const parent = await card.parent;
    const isParentPresentInCards =
      parent && cards.some((c) => c.id === parent.id);
    if (isParentPresentInCards) {
      hasParentIssue[card.id] = true;
    }
  }
  return cards.filter((c) => !hasParentIssue[c.id]);
}
