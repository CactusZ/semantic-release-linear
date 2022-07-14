import { LinearClient } from "@linear/sdk";
import micromatch from "micromatch";
import { ENV_LINEAR_API_KEY } from "./constants";
import { getLinearCards } from "./linear/api";
import { PluginConfig, Context } from "./types";

export async function analyzeCommits(
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

  const stateName = pluginConfig.generateNotes.find((b) =>
    micromatch.isMatch(branch, b.branchName)
  )?.stateName;

  if (!stateName) {
    throw new Error(`State not found for branch ${branch}`);
  }

  const cards = await getLinearCards({
    context,
    linearClient,
    teamKeys: pluginConfig.teamKeys,
    stateName,
  });

  if (cards.length > 0) {
    return "minor";
  } else {
    return null;
  }
}
