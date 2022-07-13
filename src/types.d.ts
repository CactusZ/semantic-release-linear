import { Context as SemanticReleaseContext } from "semantic-release";

type RelatedIssueMutationConfig = {
  teamKey?: string;
  stateName?: string;
};

export type PluginConfig = {
  teamKeys: string[];

  generateNotes?: [
    {
      branchName: string;
      stateName: string;
      categories: [
        {
          title: string;
          criteria: [
            {
              label?: string;
              isInProject?: boolean;
              relatedToIssueInTeam?: string;
            }
          ];
        }
      ];
    }
  ];
  mutateIssues?: [
    {
      branchName: string;
      filter: {
        stateName: string;
      };
      mutation: {
        stateName: string;
        mutateSubIssues?: boolean;
        relatedIssueMutation?: RelatedIssueMutationConfig;
      };
    }
  ];
};

export type Context = SemanticReleaseContext & {
  envCi: {
    branch: string;
  };
};
