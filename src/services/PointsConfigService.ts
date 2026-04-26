import { Method, storageAPI } from "../api/storageAPI";
import { PointsConfig, PtsConfigKey } from "../models/PointsConfigModel";

export const getPointsConfig = async (scopeId: string): Promise<PointsConfig | null> => {
  const key = PtsConfigKey(scopeId);
  return await storageAPI(Method.get, key) as PointsConfig | null;
};

export const setPointsConfig = async (scopeId: string, config: PointsConfig): Promise<void> => {
  const key = PtsConfigKey(scopeId);
  await storageAPI(Method.set, key, config);
};
