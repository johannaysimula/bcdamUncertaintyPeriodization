// Dynamic hook for OKR Goal Structure page.
// Reads the existing tier hierarchy established by the Standard page - no creation or deletion.
// Tier order from getAllGoalTiers: [ISSUE_TYPE, tier_1 (closest to epics), tier_2, ...]
// Mapping: ISSUE_TYPE → Epics, tier_1 → Planned Benefits, tier_2 → Objectives/Purposes

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAPI } from "../../Contexts/ApiContext";
import { useAppContext } from "../../Contexts/AppContext";
import {
  Goal,
  GoalCollection,
  GoalTableItem,
  GoalTableItemTypeEnum,
  GoalTier,
  GoalTierTypeEnum,
  Issue,
} from "../../Models";

type GoalType = "Objective" | "Benefit" | "Product";

interface DrawerState {
  goalType: GoalType;
  goalCategory?: string;
  goalToEdit: Goal | null;
}

interface CostTimeModalState {
  isOpen: boolean;
  goals: GoalTableItem[];
  upperIsMonetary: boolean;
  postfix: string;
}

interface SetValuesModalState {
  isOpen: boolean;
  goals: Goal[];
  goal_tier_id: string;
}

export const useGoalStructureDynamic = () => {
  const [scope] = useAppContext();
  const api = useAPI();

  const [loading, setLoading] = useState(true);
  const [allTiers, setAllTiers] = useState<GoalTier[]>([]);
  const [goals, setGoals] = useState<Goal[] | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerContext, setDrawerContext] = useState<DrawerState | null>(null);
  const [costTimeModal, setCostTimeModal] = useState<CostTimeModalState | null>(null);
  const [setValuesModal, setSetValuesModal] = useState<SetValuesModalState | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);

  // Derived tier references — updated whenever allTiers changes
  const epicTier = useMemo(
    () => allTiers.find((t) => t.type === GoalTierTypeEnum.ISSUE_TYPE),
    [allTiers]
  );
  // tier_1 = immediately above ISSUE_TYPE = Planned Benefits
  const benefitTier = useMemo(
    () => allTiers.filter((t) => t.type !== GoalTierTypeEnum.ISSUE_TYPE)[0],
    [allTiers]
  );
  // tier_2 = above benefit tier = Objectives
  const objectiveTier = useMemo(
    () => allTiers.filter((t) => t.type !== GoalTierTypeEnum.ISSUE_TYPE)[1],
    [allTiers]
  );

  const fetchAndOrganizeGoals = useCallback(async () => {
    if (!scope.id) return;
    setLoading(true);
    try {
      const tiers = await api.goalTier.getAll(scope.id, scope.type);
      setAllTiers(tiers);

      // Load goals from all tiers in parallel, using issue API for ISSUE_TYPE tiers
      const goalPromises = tiers.map((t) =>
        t.type === GoalTierTypeEnum.ISSUE_TYPE
          ? api.issue.getAll().then((issues: Issue[]) =>
              issues.map((issue) => ({ ...issue, goalCollectionId: t.id } as Goal))
            )
          : api.goal.getAll(scope.id, t.id)
      );
      const goalArrays = await Promise.all(goalPromises);
      setGoals(goalArrays.flat());
    } catch (err) {
      console.error("Error loading goal structure:", err);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, [scope.id, scope.type, api]);

  useEffect(() => {
    fetchAndOrganizeGoals();
  }, [fetchAndOrganizeGoals]);

  // Filtered goal lists derived from tier IDs
  const allGoals = goals ?? [];
  const epicGoals = useMemo(
    () => (epicTier ? allGoals.filter((g) => g.goalCollectionId === epicTier.id) : []),
    [allGoals, epicTier]
  );
  const benefitGoals = useMemo(
    () => (benefitTier ? allGoals.filter((g) => g.goalCollectionId === benefitTier.id) : []),
    [allGoals, benefitTier]
  );
  const formaalGoals = useMemo(
    () => (objectiveTier ? allGoals.filter((g) => g.goalCollectionId === objectiveTier.id) : []),
    [allGoals, objectiveTier]
  );

  // formaalCollectionData: the objective tier cast as GoalCollection for description editing
  const formaalCollectionData = useMemo(
    () => objectiveTier as GoalCollection | undefined,
    [objectiveTier]
  );

  // --- Handlers ---

  const onCloseDrawer = useCallback(
    (shouldRefresh?: boolean) => {
      setIsDrawerOpen(false);
      setDrawerContext(null);
      if (shouldRefresh) fetchAndOrganizeGoals();
    },
    [fetchAndOrganizeGoals]
  );

  const handleEditGoal = useCallback(
    (goal: Goal) => {
      let type: GoalType;
      if (epicTier && goal.goalCollectionId === epicTier.id) type = "Product";
      else if (objectiveTier && goal.goalCollectionId === objectiveTier.id) type = "Objective";
      else type = "Benefit";

      setDrawerContext({ goalType: type, goalCategory: goal.goalCollectionId, goalToEdit: goal });
      setIsDrawerOpen(true);
    },
    [epicTier, objectiveTier]
  );

  const handleAddGoal = useCallback(
    (goalType: GoalType, goalCollectionId: string) => {
      setDrawerContext({ goalType, goalCategory: goalCollectionId, goalToEdit: null });
      setIsDrawerOpen(true);
    },
    []
  );

  const openDeleteModal = useCallback((goal: Goal) => setGoalToDelete(goal), []);
  const closeDeleteModal = useCallback(() => setGoalToDelete(null), []);

  const handleDeleteGoal = useCallback(async () => {
    const goal = goalToDelete;
    if (!goal) { closeDeleteModal(); return; }
    try {
      await api.goal.delete(scope.id, goal.goalCollectionId, goal.id);
      fetchAndOrganizeGoals();
    } catch (err) {
      console.error("Failed to delete goal:", err);
    } finally {
      closeDeleteModal();
    }
  }, [goalToDelete, scope.id, api.goal, fetchAndOrganizeGoals, closeDeleteModal]);

  const handleUpdateCollectionDescription = useCallback(
    async (collection: GoalCollection, newDescription: string) => {
      if (!scope.id) return;
      try {
        await api.goalCollection.update(scope.id, { ...collection, description: newDescription });
        fetchAndOrganizeGoals();
      } catch (err) {
        console.error("Failed to update collection description:", err);
      }
    },
    [scope.id, api.goalCollection, fetchAndOrganizeGoals]
  );

  const handleSetCostTime = useCallback((epicGoalList: Goal[]) => {
    const mappedGoals: GoalTableItem[] = epicGoalList.map((g) => ({
      ...g,
      type: g.type as unknown as GoalTableItemTypeEnum,
    }));
    setCostTimeModal({ isOpen: true, goals: mappedGoals, upperIsMonetary: false, postfix: "pts" });
  }, []);

  const handleCostTimeModalClose = useCallback(
    (shouldRefresh = false) => {
      setCostTimeModal(null);
      if (shouldRefresh) fetchAndOrganizeGoals();
    },
    [fetchAndOrganizeGoals]
  );

  const handleOpenSetValuesModal = useCallback((goals: Goal[], goalCollectionId: string) => {
    setSetValuesModal({ isOpen: true, goals, goal_tier_id: goalCollectionId });
  }, []);

  const handleCloseSetValuesModal = useCallback(() => setSetValuesModal(null), []);

  const handleRefreshData = useCallback(() => fetchAndOrganizeGoals(), [fetchAndOrganizeGoals]);

  return {
    loading: loading || goals === null,
    allGoals,
    epicGoals,
    formaalGoals,
    formaalCollectionData,
    benefitGoals,
    epicTier,
    benefitTier,
    objectiveTier,
    handlers: {
      handleAddGoal,
      handleEditGoal,
      handleDeleteGoal,
      onCloseDrawer,
      handleSetCostTime,
      handleCostTimeModalClose,
      handleUpdateCollectionDescription,
      handleOpenSetValuesModal,
      handleCloseSetValuesModal,
      handleRefreshData,
      onDeleteGoal: openDeleteModal,
    },
    deleteModal: {
      isOpen: !!goalToDelete,
      goalToDelete,
      onClose: closeDeleteModal,
      onConfirm: handleDeleteGoal,
    },
    drawer: { isDrawerOpen, context: drawerContext },
    costTimeModal,
    setValuesModal,
    scope,
  };
};
