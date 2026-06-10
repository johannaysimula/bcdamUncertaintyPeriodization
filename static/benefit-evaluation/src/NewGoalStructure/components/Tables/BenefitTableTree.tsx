import React from "react";
import TableTree, {
  Rows,
  Row,
  Cell,
  Header,
  Headers,
} from "@atlaskit/table-tree";
import EditIcon from "@atlaskit/icon/glyph/edit";
import TrashIcon from "@atlaskit/icon/glyph/trash";
import Button, { ButtonGroup } from "@atlaskit/button";
import { Goal } from "../../../Models";
import AddIcon from "@atlaskit/icon/glyph/add";
import Lozenge from "@atlaskit/lozenge";
import { NYTTE_COLLECTION_ID } from "../../constants/goalConstants";
import Tooltip from "@atlaskit/tooltip";

// Import the translation hook
import { useTranslation } from "../../../i18n";

interface BenefitRootItem {
  id: string;
  name: string;
  goals: Goal[];
}

type TableItem = BenefitRootItem | Goal;

interface BenefitTableTreeProps {
  data: Goal[];
  onAddGoal: (
    parentId: string,
    goalCollectionId: string,
    category?: string
  ) => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (goal: Goal) => void;
  /** Optional: override the collection ID (defaults to NYTTE_COLLECTION_ID) */
  collectionId?: string;
}

export const BenefitTableTree: React.FC<BenefitTableTreeProps> = ({
  onAddGoal,
  onEditGoal,
  onDeleteGoal,
  data: benefitgoals,
  collectionId = NYTTE_COLLECTION_ID,
}) => {
  const { t } = useTranslation();

  const rootId = `root::${collectionId}`;
  const BENEFIT_ROOT_ITEM: BenefitRootItem = {
    id: rootId,
    name: t("benefit_table.root_name"),
    goals: benefitgoals,
  };

  const items: BenefitRootItem[] = [BENEFIT_ROOT_ITEM];

  return (
    <>
      <TableTree>
        <Headers>
          <Header width={250}>{t("benefit_table.headers.name")}</Header>
          <Header width={720}>{t("benefit_table.headers.description")}</Header>
          <Header width={90}></Header>
          <Header width={100}></Header>
          <Header width={125}>{t("benefit_table.headers.points")}</Header>
          <Header width={130}>{t("benefit_table.headers.actions")}</Header>
        </Headers>

        <Rows
          items={items as TableItem[]}
          render={(item: TableItem) => {
            const isRoot = item.id === rootId;
            const goal = item as Goal;
            const children = isRoot ? (item as BenefitRootItem).goals : [];
            const isLiveGoal = !isRoot;

            const primaryLabel = isRoot
              ? t("benefit_table.root_name")
              : goal.key || goal.id;

            return (
              <Row
                itemId={item.id}
                items={children}
                hasChildren={isRoot}
                isDefaultExpanded
              >
                <Cell>
                  <Tooltip content={t("benefit_table.tooltip")}>
                    <strong>{primaryLabel}</strong>
                  </Tooltip>
                </Cell>

                <Cell>{isLiveGoal ? goal.description : ""}</Cell>

                <Cell></Cell>
                <Cell></Cell>

                <Cell>
                  {!isRoot && (
                    <Lozenge appearance="new" isBold>
                      {goal.balancedPoints?.value}
                    </Lozenge>
                  )}
                </Cell>

                <Cell>
                  {isRoot && (
                    <Button
                      appearance="subtle"
                      iconBefore={
                        <AddIcon
                          size="small"
                          label={t("benefit_table.buttons.add")}
                        />
                      }
                      onClick={() =>
                        onAddGoal(BENEFIT_ROOT_ITEM.id, collectionId)
                      }
                    />
                  )}

                  {isLiveGoal && (
                    <ButtonGroup>
                      <Button
                        appearance="subtle"
                        iconBefore={
                          <EditIcon
                            size="small"
                            label={t("benefit_table.buttons.edit")}
                          />
                        }
                        onClick={() => onEditGoal(goal)}
                      />
                      <Button
                        appearance="subtle"
                        iconBefore={
                          <TrashIcon
                            size="small"
                            label={t("benefit_table.buttons.delete")}
                          />
                        }
                        onClick={() => onDeleteGoal(goal)}
                      />
                    </ButtonGroup>
                  )}
                </Cell>
              </Row>
            );
          }}
        />
      </TableTree>
    </>
  );
};
