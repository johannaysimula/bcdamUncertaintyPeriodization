import { invoke } from "@forge/bridge";
import { PointsConfig } from "../Models/PointsConfigModel";

export const pointsConfigApi = () => ({
  get: (scopeId: string): Promise<PointsConfig | null> =>
    invoke("getPointsConfig", { scopeId }),
  set: (scopeId: string, config: PointsConfig): Promise<void> =>
    invoke("setPointsConfig", { scopeId, config }),
});
