import Sinon from "sinon";
import * as linearClientGeneratorWrapper from "../src/linear/clientGenerator";
import { generateNotes } from "../src/generateNotes";
import { Context, PluginConfig } from "../src/types";
import { expect } from "chai";
import { Issue, IssueLabel, LinearClient } from "@linear/sdk";
describe("generateNotes", () => {
  let issuesFake: Sinon.SinonSpy<unknown[], unknown>;
  before(() => {
    issuesFake = Sinon.fake.returns(
      Promise.resolve({
        nodes: [],
      })
    );
    const generateFakeClient = Sinon.fake(
      () =>
        ({
          issues: issuesFake,
        } as unknown as LinearClient)
    );
    Sinon.replace(
      linearClientGeneratorWrapper,
      "generateLinearClient",
      generateFakeClient
    );
  });

  beforeEach(() => {
    Sinon.reset();
  });

  it("should return empty string if no generateNotes config is provided", async () => {
    const pluginConfig: PluginConfig = {
      teamKeys: ["teamKey"],
    };
    const context: Context = {
      envCi: {
        branch: "branch",
      },
      logger: {
        log: Sinon.fake(),
        error: Sinon.fake(),
      },
      env: {},
    };
    const releaseNotes = await generateNotes(pluginConfig, context);
    expect(releaseNotes).to.equal("");
  });

  it("returns release notes with empty features category", async () => {
    const pluginConfig: PluginConfig = {
      teamKeys: ["teamKey"],
      generateNotes: [
        {
          branchName: "branch",
          stateName: "state",
          categories: [
            {
              title: "Features",
              priority: 1,
              orderInNotes: 1,
              criteria: [
                {
                  isInProject: true,
                },
              ],
            },
          ],
        },
      ],
    };
    const context: Context = {
      envCi: {
        branch: "branch",
      },
      logger: {
        log: Sinon.fake(),
        error: Sinon.fake(),
      },
      env: {},
    };
    const releaseNotes = await generateNotes(pluginConfig, context);
    expect(releaseNotes).to.equal(
      "## Linear Cards released\nNone linear cards are released in this release"
    );
  });

  it("returns release notes with features category", async () => {
    const pluginConfig: PluginConfig = {
      teamKeys: ["teamKey"],
      generateNotes: [
        {
          branchName: "branch",
          stateName: "state",
          categories: [
            {
              title: "Features",
              priority: 1,
              orderInNotes: 1,
              criteria: [
                {
                  isInProject: true,
                },
              ],
            },
          ],
        },
      ],
    };
    const context: Context = {
      envCi: {
        branch: "branch",
      },
      logger: {
        log: Sinon.fake(),
        error: Sinon.fake(),
      },
      env: {},
    };
    issuesFake = Sinon.fake.returns(
      Promise.resolve({
        nodes: [
          {
            id: "id",
            title: "title",
            identifier: "identifier",
            url: "url",
            project: {},
          },
        ] as Issue[],
      })
    );
    const releaseNotes = await generateNotes(pluginConfig, context);

    expect(releaseNotes).to.equal(
      `## Linear Cards released
### Features
| Card Id | Card Title |
| --- | --- |
|[identifier](url)|title|`
    );
  });

  it("returns release notes with many categories", async () => {
    const pluginConfig: PluginConfig = {
      teamKeys: ["teamKey"],
      generateNotes: [
        {
          branchName: "branch",
          stateName: "state",
          categories: [
            {
              title: "Features",
              priority: 2,
              orderInNotes: 1,
              criteria: [
                {
                  isInProject: true,
                },
              ],
            },
            {
              title: "Bug Fixes",
              priority: 1,
              orderInNotes: 2,
              criteria: [
                {
                  label: "Bug",
                },
              ],
            },
          ],
        },
      ],
    };
    const context: Context = {
      envCi: {
        branch: "branch",
      },
      logger: {
        log: Sinon.fake(),
        error: Sinon.fake(),
      },
      env: {},
    };
    issuesFake = Sinon.fake.returns(
      Promise.resolve({
        nodes: [
          {
            id: "id",
            title: "title",
            identifier: "identifier",
            url: "url",
            project: {},
            labels: Sinon.fake(() =>
              Promise.resolve({
                nodes: [],
              })
            ) as unknown as Issue["labels"],
          },
          {
            id: "id2",
            title: "title2",
            identifier: "identifier2",
            url: "url2",
            project: {},
            labels: Sinon.fake(() =>
              Promise.resolve({
                nodes: [{ name: "Bug" }],
              })
            ) as unknown as Issue["labels"],
          },
        ] as Issue[],
      })
    );
    const releaseNotes = await generateNotes(pluginConfig, context);

    expect(releaseNotes).to.equal(
      `## Linear Cards released
### Features
| Card Id | Card Title |
| --- | --- |
|[identifier](url)|title|
### Bug Fixes
| Card Id | Card Title |
| --- | --- |
|[identifier2](url2)|title2|`
    );
  });
});
