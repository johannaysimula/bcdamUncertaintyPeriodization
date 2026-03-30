import Resolver from "@forge/resolver";
import { GCDA, GCHeadDA } from "../dataAccess/GoalCollectionDA";
import { GDA, GHeadDA } from "../dataAccess/GoalDA";

export const importResolver = (resolver: Resolver) => {
  resolver.define('importData', async ({ payload }: { payload: { scopeId: string; data: any } }) => {
    const { scopeId, data } = payload;
    const { gcHead, collections } = data as { gcHead: any; collections: any[] };

    await GCHeadDA.set(scopeId, gcHead);

    for (const { collection, gHead, goals } of collections) {
      await GCDA.set(scopeId, { ...collection, scopeId });

      if (gHead && gHead.goalIds && gHead.goalIds.length > 0) {
        await GHeadDA.set(scopeId, collection.id, gHead);
        for (const goal of goals) {
          if (goal) {
            await GDA.set(scopeId, collection.id, { ...goal, scopeId });
          }
        }
      }
    }

    return { ok: true };
  });
};
