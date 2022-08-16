import { Context as SemanticReleaseContext } from "semantic-release";

type RelatedIssueMutationConfig = {
  teamKey?: string;
  stateName?: string;
};

export type GenerateNotesConfig = {
  branchName: string;
  stateName: string;
  categories: Array<{
    title: string;
    priority?: number;
    orderInNotes?: number;
    criteria: [
      {
        label?: string;
        isInProject?: boolean;
        relatedToIssueInTeam?: string;
      }
    ];
  }>;
};

export type MutateIssuesConfig = [
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

export type PluginConfig = {
  teamKeys: string[];

  generateNotes?: GenerateNotesConfig[];
  mutateIssues?: MutateIssuesConfig;
};

export type Context = SemanticReleaseContext & {
  envCi: {
    branch: string;
  };
};
