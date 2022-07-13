import { Issue, LinearClient, Team, User, WorkflowState } from "@linear/sdk";

import _ from "lodash";
import { Context } from "semantic-release";
import { RelatedIssueMutationConfig } from "../types";

export async function checkTeamsInLinear({
  linearClient,
  context,
  teamKeys,
}: {
  linearClient: LinearClient;
  context: Context;
  teamKeys: string[];
}) {
  context.logger.log(`Checking if you have access to all teams in Linear...`);

  const fetchedTeams = await linearClient.teams({
    filter: {
      key: {
        in: teamKeys,
      },
    },
  });
  const teams = fetchedTeams.nodes;
  if (teamKeys.length !== teams.length) {
    context.logger.error("You don't have access to all teams in Linear");
    context.logger.error(
      `You have access to ${teams.length} teams in Linear: ${teams
        .map((t) => t.key)
        .join(", ")}`
    );
    context.logger.error(
      `You need to have access to these teams: ${teamKeys.join(", ")}`
    );
    throw new Error("You don't have access to all teams in Linear");
  }
  context.logger.log("All teams found in Linear");
}

export async function getCardAuthorsMap(cards: Issue[]) {
  const cardAuthors = await Promise.all(cards.map((card) => card.assignee));

  const cardAuthorsMap = cardAuthors.reduce<Record<string, User>>(
    (acc, author) => {
      if (author) {
        acc[author.email] = author;
      }
      return acc;
    },
    {}
  );
  return cardAuthorsMap;
}

export async function getLinearCards({
  stateName,
  linearClient,
  context,
  teamKeys,
}: {
  stateName: string;
  linearClient: LinearClient;
  context: Context;
  teamKeys: string[];
}) {
  context.logger.log(`Getting all ${stateName} cards...`);
  const cards = await linearClient.issues({
    filter: {
      state: {
        name: {
          eq: stateName,
        },
      },
      team: {
        key: {
          in: teamKeys,
        },
      },
    },
  });
  context.logger.log(`${cards.nodes.length} cards are ${stateName}`);
  return cards.nodes;
}

export async function moveCards({
  cards,
  toState,
  context,
  includeChildren,
  relatedIssueMutation,
}: {
  cards: Issue[];
  toState: string;
  context: Context;
  includeChildren: boolean;
  relatedIssueMutation?: RelatedIssueMutationConfig;
}) {
  context.logger.log(`Moving ${cards.length} cards to state ${toState}...`);

  const statesPerTeam = await getTeamStatesFromCards({
    cards,
    toState,
    context,
  });

  for (const card of cards) {
    await moveCard({
      card,
      statesPerTeam,
      toState,
      context,
      includeChildren,
    });
  }
}

async function moveCard({
  card,
  statesPerTeam,
  toState,
  context,
  includeChildren,
  relatedIssueMutation,
}: {
  card: Issue;
  statesPerTeam: Record<string, WorkflowState[]>;
  toState: string;
  context: Context;
  includeChildren: boolean;
  relatedIssueMutation?: RelatedIssueMutationConfig;
}) {
  const team = await card.team;
  if (!team) {
    context.logger.error(`Card ${card.id} has no team`);
    throw new Error(`Card ${card.id} has no team`);
  }
  const teamId = team?.id;
  const teamKey = team?.key;
  if (!teamId || !teamKey) {
    context.logger.error(`Card ${card.id} has no team id or key`);
    throw new Error(`Card ${card.id} has no team id or key`);
  }

  context.logger.log(`Moving card ${card.identifier} to state ${toState}`);

  const stateId = statesPerTeam[teamKey].find((s) => s.name === toState)?.id;
  if (!stateId) {
    context.logger.error(`Team ${teamKey} has no state ${toState}`);
    throw new Error(`Team ${teamKey} has no state ${toState}`);
  }

  if (includeChildren) {
    const subIssues = (await card.children()).nodes || [];
    for (const subIssue of subIssues) {
      context.logger.log(
        `Moving sub-issue ${subIssue.identifier} of issue ${card.identifier}`
      );
      await moveCard({
        card: subIssue,
        statesPerTeam,
        toState,
        context,
        includeChildren,
      });
    }
  }

  await card.update({
    stateId,
  });

  if (relatedIssueMutation) {
    const relatedIssues = (await card.relations()).nodes;
    const relatedCards = (
      await Promise.all(relatedIssues.map((issue) => issue.relatedIssue))
    ).filter((issue) => issue?.team === relatedIssueMutation.teamKey);
    if (relatedCards.length) {
      const team = await relatedCards[0]?.team;
      const newStateId = (await team?.states())?.nodes.find(
        (state) => state.name === relatedIssueMutation.stateName
      )?.id;
      if (!newStateId) {
        throw new Error(`State not found ${relatedIssueMutation.stateName}`);
      }
      await Promise.all(
        relatedCards.map((card) => card?.update({ stateId: newStateId }))
      );
    }
  }
  context.logger.log(`Moved card ${card.identifier} to state ${toState}`);
}

async function getTeamStatesFromCards({
  cards,
  toState,
  context,
}: {
  cards: Issue[];
  toState: string;
  context: Context;
}) {
  context.logger.log(`Getting states for all teams`);
  const teams = (await Promise.all(cards.map((card) => card.team))).filter(
    isTeam
  );
  context.logger.log(`Found ${teams.length} teams`);
  const uniqueTeams = _.uniqBy(teams, (t) => t.key);
  context.logger.log(`Found ${uniqueTeams.length} unique teams`);
  const states = (await Promise.all(uniqueTeams.map((t) => t.states()))).map(
    (s) => s.nodes
  );
  context.logger.log(`Found states`);
  const statesPerTeam = states.reduce<Record<string, WorkflowState[]>>(
    (acc, s, index) => {
      const team = uniqueTeams[index];
      acc[team.key] = s.filter((s) => s.name === toState);
      return acc;
    },
    {}
  );
  context.logger.log(`Calculated states per team`);
  return statesPerTeam;
}

function isTeam(t: Team | undefined): t is Team {
  return !!t;
}
