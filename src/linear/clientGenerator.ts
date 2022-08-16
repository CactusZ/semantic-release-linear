import { LinearClient } from "@linear/sdk";
import { ENV_LINEAR_API_KEY } from "../constants";
import { Context } from "../types";

export function generateLinearClient(context: Context) {
  return new LinearClient({
    apiKey: context.env[ENV_LINEAR_API_KEY],
  });
}
