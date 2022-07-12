import { LinearClient } from "@linear/sdk";
import { Context } from "semantic-release";
import { ENV_LINEAR_API_KEY } from "./constants";
import { checkTeamsInLinear } from "./linear/api";
import { PluginConfig } from "./types";

export async function verifyConditions(
  pluginConfig: PluginConfig,
  context: Context
) {
  const apiKey = context.env[ENV_LINEAR_API_KEY];
  if (!apiKey) {
    throw new Error(
      `${ENV_LINEAR_API_KEY} environment variable is not defined!`
    );
  }

  const linearClient = new LinearClient({ apiKey });

  if (!pluginConfig.teamKeys) {
    throw new Error("teamKeys are undefined");
  }

  await checkTeamsInLinear({
    linearClient,
    context,
    teamKeys: pluginConfig.teamKeys,
  });

  if (pluginConfig.generateNotes) {
    if (!pluginConfig.generateNotes.every((c) => c.branchName && c.stateName)) {
      throw new Error(
        "generateNotes should be an array of objects with branchName and stateName properties"
      );
    }
  }

  if (pluginConfig.mutateIssues) {
    if (
      !pluginConfig.mutateIssues.every(
        (c) => c.branchName && c.filter?.stateName && c.mutation?.stateName
      )
    ) {
      throw new Error(
        "mutateIssues should be an array of objects with branchName, filter.stateName, mutation.stateName properties"
      );
    }
  }
}
