import { Context as SemanticReleaseContext } from "semantic-release";

export type PluginConfig = {
  teamKeys: string[];

  generateNotes?: [
    {
      branchName: string;
      stateName: "Deployed To Test" | "Deployed To Preprod";
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
        stateName: "Deployed To Test" | "Deployed To Preprod";
      };
      mutation: {
        stateName: "Deployed To Preprod" | "Released";
        mutateSubIssues?: boolean;
      };
    }
  ];
};

export type Context = SemanticReleaseContext & {
  envCi: {
    branch: string;
  };
};
