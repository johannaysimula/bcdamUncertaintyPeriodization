import { HeadType } from "@atlaskit/dynamic-table/dist/types/types";
import { GoalTier, GoalTierTypeEnum } from "../../../Models/GoalTierModel";

export const EpicTableHead = (
  goalTier: GoalTier,
  isMonetary: boolean
): HeadType | undefined => {
  return {
    cells: [
      {
        key: "name",
        content: "Name",
        isSortable: true,
      },
      {
        key: "description",
        content: "Description",
        isSortable: true,
        shouldTruncate: true,
      },
      {
        key: "status",
        content: "Status",
        isSortable: true,
      },
      {
        key: "balancedPoints",
        content:
          goalTier.type === GoalTierTypeEnum.ISSUE_TYPE
            ? isMonetary
              ? "Benefit"
              : "Benefit Points"
            : goalTier.type === GoalTierTypeEnum.PORTFOLIO_ITEM
            ? "Portfolio Item Points"
            : "Weight",
        isSortable: true,
      },
      {
        key: "benefit",
        content: isMonetary ? "Benefit" : "PERT Benefit",
        isSortable: true,
      },
      {
        key: "cost",
        content: isMonetary ? "Cost" : "PERT Cost",
        isSortable: true,
      },
      {
        key: "time",
        content: isMonetary ? "Time" : "PERT Time",
        isSortable: true,
      },
      {
        key: "benefitCost",
        content: isMonetary ? "Benefit/Cost" : "BP/CP",
        isSortable: true,
      },
    ],
  };
};
