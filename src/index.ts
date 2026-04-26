import Resolver from "@forge/resolver";
import { importResolver } from "./resolvers/ImportResolver";
import { pointsConfigResolver } from "./resolvers/PointsConfigResolver";
import { estimationResolver } from "./resolvers/EstimationResolver";
import { goalCollectionResolver } from "./resolvers/GoalCollectionResolver";
import { goalApi } from "./resolvers/GoalResolver";
import { issueResolver } from "./resolvers/IssueResolver";
import { portfolioResolver } from "./resolvers/PortfolioResolver";
import { projectResolver } from "./resolvers/ProjectResolver";
import { scopeResolver } from "./resolvers/ScopeResolver";
import { portfolioItemResolver } from "./resolvers/PortfolioItemResolver";
import { goalTierResolver } from "./resolvers/GoalTierResolver";
import { issueTypeResolver } from "./resolvers/IssueTypeResolver";
import { resetApp } from "./services/AppService";

const resolver = new Resolver();

const models = (resolver: Resolver) => {
  estimationResolver(resolver);
  issueResolver(resolver);
  issueTypeResolver(resolver);
  portfolioItemResolver(resolver);
  portfolioResolver(resolver);
  projectResolver(resolver);
  goalApi(resolver);
  goalCollectionResolver(resolver);
  goalTierResolver(resolver);
  scopeResolver(resolver);
  importResolver(resolver);
  pointsConfigResolver(resolver);

  resolver.define("resetApp", async () => {
    await resetApp();
  });
};

models(resolver);

export const handler = resolver.getDefinitions();
