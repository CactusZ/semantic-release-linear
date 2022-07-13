import { Issue, LinearClient } from "@linear/sdk";
import _ from "lodash";
import { ENV_LINEAR_API_KEY } from "./constants";
import { getLinearCards } from "./linear/api";
import { Context, PluginConfig } from "./types";

export async function generateNotes(
  pluginConfig: PluginConfig,
  context: Context
) {
  if (!pluginConfig.generateNotes) {
    return;
  }
  const linearClient = new LinearClient({
    apiKey: context.env[ENV_LINEAR_API_KEY],
  });

  const { branch } = context.envCi;

  const notesConfigForBranch = pluginConfig.generateNotes.find(
    (b) => b.branchName === branch
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
  stateName: "Deployed To Test" | "Deployed To Preprod";
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
  notesConfigForBranch: {
    branchName: string;
    stateName: "Deployed To Test" | "Deployed To Preprod";
    categories: [
      {
        title: string;
        criteria: [
          {
            label?: string | undefined;
            isInProject?: boolean | undefined;
            relatedToIssueInTeam?: string | undefined;
          }
        ];
      }
    ];
  };
}) {
  const releaseNotes = [];
  releaseNotes.push("## Linear Cards released");

  if (cards.length) {
    let unmentionedCards = cards.slice();
    for (const category of notesConfigForBranch.categories) {
      const filteredCards: Issue[] = await filterCards({ category, cards });
      const relationCriteria = category.criteria.find(
        (c) => c.relatedToIssueInTeam
      )?.relatedToIssueInTeam;
      releaseNotes.push(`### ${category.title}`);
      releaseNotes.push(getCardTableHeader(relationCriteria));
      for (const card of filteredCards) {
        const relatedCard: Issue | undefined = await getRelatedCard({
          teamKey: relationCriteria,
          card,
        });
        releaseNotes.push(getCardTableRow({ card, relatedCard }));
      }
      unmentionedCards = unmentionedCards.filter((c) =>
        filteredCards.every((f) => f.id !== c.id)
      );
    }
    if (unmentionedCards.length) {
      releaseNotes.push("### Other");
      for (const card of unmentionedCards) {
        releaseNotes.push(`|[${card.identifier}](${card.url})|${card.title}`);
      }
    }
  } else {
    releaseNotes.push("None linear cards are released in this release");
  }
  return releaseNotes;
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
        await getCardsWithIssueInTeam({
          cards,
          relatedTeamKey: criteria.relatedToIssueInTeam,
        })
      );
    }
    filteredCards.push(..._.intersectionBy(...cardsByCriteria, "id"));
  }
  return filteredCards;
}

function getCardTableHeader(relationCriteria: string | undefined): any {
  return `| Card Id ${
    relationCriteria ? "| Related Card " : ""
  }| Card Title |", "| --- | --- |`;
}

function getCardTableRow({
  card,
  relatedCard,
}: {
  card: Issue;
  relatedCard: Issue | undefined;
}): any {
  return `|[${card.identifier}](${card.url})${
    relatedCard ? `|[${relatedCard.identifier}](${relatedCard.url})` : ""
  }|${card.title}`;
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

async function getCardsWithIssueInTeam({
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
    if (parent && cards.some((c) => c.id === parent.id)) {
      hasParentIssue[card.id] = true;
    }
  }
  return cards.filter((c) => !hasParentIssue[c.id]);
}
