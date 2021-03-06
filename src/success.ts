import { LinearClient } from "@linear/sdk";
import micromatch from "micromatch";
import { ENV_LINEAR_API_KEY } from "./constants";
import { getLinearCards, moveCards } from "./linear/api";
import { PluginConfig, Context } from "./types";

export async function success(pluginConfig: PluginConfig, context: Context) {
  if (!pluginConfig.mutateIssues) {
    return;
  }

  const branchName = context.envCi.branch;
  const branchConfig = pluginConfig.mutateIssues.find((c) =>
    micromatch.isMatch(branchName, c.branchName)
  );

  if (!branchConfig) {
    return;
  }

  const linearClient = new LinearClient({
    apiKey: context.env[ENV_LINEAR_API_KEY],
  });

  const cards = await getLinearCards({
    linearClient,
    stateName: branchConfig.filter.stateName,
    context,
    teamKeys: pluginConfig.teamKeys,
  });

  await moveCards({
    cards,
    toState: branchConfig.mutation.stateName,
    context,
    includeChildren: !!branchConfig.mutation.mutateSubIssues,
    relatedIssueMutation: branchConfig.mutation.relatedIssueMutation,
  });
}
