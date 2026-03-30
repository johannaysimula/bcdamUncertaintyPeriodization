import { invoke } from "@forge/bridge";

export const importApi = () => ({
  importData: (scopeId: string, data: any): Promise<{ ok: boolean }> =>
    invoke("importData", { scopeId, data }),
});
