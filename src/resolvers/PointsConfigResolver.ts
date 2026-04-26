import Resolver from "@forge/resolver";
import { PointsConfig } from "../models/PointsConfigModel";
import { getPointsConfig, setPointsConfig } from "../services/PointsConfigService";

export const pointsConfigResolver = (resolver: Resolver) => {
  resolver.define("getPointsConfig", async ({ payload: { scopeId } }): Promise<PointsConfig | null> => {
    return await getPointsConfig(scopeId);
  });

  resolver.define("setPointsConfig", async ({ payload: { scopeId, config } }): Promise<void> => {
    await setPointsConfig(scopeId, config);
  });
};
