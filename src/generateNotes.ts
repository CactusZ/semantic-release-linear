import { LinearClient } from "@linear/sdk";
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

  const branch = context.envCi.branch;

  const stateName = pluginConfig.generateNotes.find(
    (b) => b.branchName === branch
  )?.stateName;

  if (!stateName) {
    throw new Error(`State not found for branch ${branch}`);
  }

  const cards = await getLinearCards({
    stateName,
    linearClient,
    context,
    teamKeys: pluginConfig.teamKeys,
  });

  const releaseNotes = [];
  releaseNotes.push("## Linear Cards released");

  if (cards.length) {
    releaseNotes.push("| Card Id | Card Title |", "| --- | --- |");
    const sortedCards = _.sortBy(cards, "identifier");
    for (const card of sortedCards) {
      releaseNotes.push(`|[${card.identifier}](${card.url})|${card.title}`);
    }
  } else {
    releaseNotes.push("None linear cards are released in this release");
  }

  return releaseNotes.join("\n");
}
