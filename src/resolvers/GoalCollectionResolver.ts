import Resolver from "@forge/resolver";
import { changeRanking, createGoalCollection, deleteGoalCollection, flushGoalCollections, getAllGoalCollections, getAllGoalCollectionsByRanking, getGoalCollection, updateGoalCollection } from "../services/GoalCollectionService";
import { GoalCollection } from "../models/GoalCollectionModel";

export const goalCollectionResolver = (resolver: Resolver) => {
  //Get
  resolver.define('getGoalCollection', async ({ payload: { scopeId, id } }): Promise<GoalCollection | undefined> => {
    return await getGoalCollection(scopeId, id);
  });
  
  //Create
  resolver.define('createGoalCollection', async ({ payload: { scopeId, goalCollection } }) => {
    return await createGoalCollection(scopeId, goalCollection)
  });

  //Update
  resolver.define('updateGoalCollection', async ({ payload: { scopeId, goalCollection } }) => {
    return await updateGoalCollection(scopeId, goalCollection);
  });

  //Delete
  resolver.define('deleteGoalCollection', async ({ payload: { scopeId, id } }) => {
    return await deleteGoalCollection(scopeId, id);
  });

  //Flush all
  resolver.define('flushGoalCollections', async ({ payload: { scopeId } }) => {
    return await flushGoalCollections(scopeId);
  });

  //GetAll
  resolver.define('getAllGoalCollections', async ({ payload: { scopeId } }): Promise<GoalCollection[]> => {
    return await getAllGoalCollections(scopeId);
  });

  resolver.define('changeGoalCollectionRanking', async ({ payload: { scopeId, id1, id2 } }) => {
    return changeRanking(scopeId, id1, id2)
  });
}