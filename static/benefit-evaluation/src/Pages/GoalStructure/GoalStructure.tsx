import Button, { ButtonGroup } from "@atlaskit/button";
import { useState, useEffect, useCallback, useMemo } from "react"; // Lagt til useMemo
import { Outlet, useLocation, useNavigate } from "react-router";
// Slettet DynamicTable og tilhørende, da vi ikke lenger viser den øverste tabellen
import { useAppContext } from "../../Contexts/AppContext";
import { useAPI } from "../../Contexts/ApiContext";
import PageHeader from "@atlaskit/page-header";
import { HelperMessage } from "@atlaskit/form";
import SectionMessage from "@atlaskit/section-message"; // Importert SectionMessage
import {
  GoalTier,
  GoalCollection,
  Goal,
  balancedPointsEnum,
  GoalTierTypeEnum, // Viktig import for filtrering
} from "../../Models";
import { SelectGoalTier } from "../../Components/GoalTiers/SelectGoalTier";
import { GoalTable } from "../../Components/GoalTiers/GoalTable";
import { AdminGoalCollection } from "./AdminGoalCollection";
import { DeleteGoalCollection } from "./DeleteGoalCollection";
import { FlushGoalCollections } from "./FlushGoalCollections";
import { Loading } from "../../Components/Common/Loading"; // Importer Loading
import { Box, xcss } from "@atlaskit/primitives"; // Importer Box/xcss

// * Goal Tier
type option = {
  label: string;
  value: GoalCollection;
};

export const GoalStructure = () => {
  const [items, setItems] = useState<GoalTier[]>([]); // Holder ALLE tiers
  const [loading, setLoading] = useState<boolean>(true);
  // Slettet isRankable

  const [selectedOption, setSelectedOption] = useState<option>();
  const [isFetching, setFetching] = useState<boolean>(false);

  const [upperIsMonetary, setIsUpperMonetary] = useState<boolean>(false);
  const [postfix, setPostfix] = useState<string>("$");

  // * Open panes
  const [showCreateGoalCollection, setShowCreateGoalCollection] =
    useState<boolean>(false);
  const [showEditGoalCollection, setShowEditGoalCollection] =
    useState<boolean>(false);
  const [editGoalCollection, setEditGoalCollection] = useState<GoalTier | null>(
    null
  );
  const [showDeleteGoalCollection, setShowDeleteGoalCollection] =
    useState<boolean>(false);
  const [deleteGoalCollection, setDeleteGoalCollection] =
    useState<GoalTier | null>(null);
  const [showFlushGoalCollections, setShowFlushGoalCollections] =
    useState<boolean>(false);

  const [scope] = useAppContext();
  const api = useAPI();
  const location = useLocation();
  const refresh = location.state?.refresh;
  const navigation = useNavigate();

  // useEffect for monetary/postfix (uendret)
  useEffect(() => {
    const setValuesMonetaryAndPostfix = async () => {
      if (items.length >= 2) {
        // ... (resten av logikken din)
        const upGoals: Goal[] = await api.goal.getAll(
          items[0].scopeId,
          items[0].id
        );
        // ... (resten av logikken din)
      }
    };
    setValuesMonetaryAndPostfix();
  }, [items]);

  const fetchData = async () => {
    return api.goalTier
      .getAll(scope.id, scope.type)
      .then((response) => {
        return response.reverse();
      })
      .catch((error) => {
        console.error(error);
        return [];
      });
  };

  // useEffect for fetchData (uendret)
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchData().then((items) => {
      if (isMounted) {
        setItems(items); // Setter ALLE items
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [refresh]);

  // --- NY LOGIKK: Del 'items' i to lister ---
  // 1. Finner "Epic"-tier (antatt å være av typen ISSUE_TYPE)
  const epicTier = useMemo(
    () => items.find((item) => item.type === GoalTierTypeEnum.ISSUE_TYPE),
    [items]
  );

  // 2. Finner resten ("Goal Collections") for dropdown-menyen
  const goalCollectionTiers = useMemo(
    () => items.filter((item) => item.type !== GoalTierTypeEnum.ISSUE_TYPE),
    [items]
  );
  // --- SLUTT PÅ NY LOGIKK ---

  // Slettet onRankEnd
  // Slettet rows-callback

  const actions = (
    <ButtonGroup>
      <Button
        appearance="primary"
        onClick={() => setShowCreateGoalCollection(true)}
      >
        New Goal Collection
      </Button>
      <Button
        appearance="default"
        onClick={() => navigation("../goal-structure-okr")}
      >
        OKR View
      </Button>
    </ButtonGroup>
  );

  return (
    <>
      <PageHeader actions={actions}>Goal Structure</PageHeader>

      {/* Slettet DynamicTable for Goal Tiers */}
      {/* --- NY BESKRIVELSE --- */}
      <Box>
        <SectionMessage title="Understanding the Goal Structure">
          <p>
            This page is used to build and manage the hierarchy that connects
            strategic objectives to your deliverable work.
          </p>
          <ul>
            <li>
              <strong>New Goal Collection:</strong> Start by using this button
              to create new strategic tiers (e.g., "Q4 Company Objectives" or
              "Product Initiatives"). And a new Goal Collection will then appear
              below.
            </li>
            <li>
              <strong>Create Goals</strong> Now it is time to create Goals in
              the Goal Collection. Make a goal by pressing the "New Goal"
              button.
            </li>
            <li>
              <strong>Set Goal Points:</strong> The next step is to weight the
              goals against eachother. This will be used to calculate benefit
              points for each epic.
            </li>
            <li>
              <strong>Epics Table:</strong> The table at the bottom displays the
              Epics for the current project. These are set at Project-level. To
              create an Epic press the blue "+ Create" Button at the top of your
              Jira website.
            </li>
            <li>
              <strong>Set Time and Cost</strong> Press the button to set the
              cost and time-value for each epic.
            </li>
          </ul>
          <p>
            <strong>
              Once you have set Goal points and points for cost and time, its
              time to move to the next tab - Estimation
            </strong>
          </p>
        </SectionMessage>
      </Box>
      {/* --- SLUTT PÅ NY BESKRIVELSE --- */}

      <Outlet />

      {/* --- NYTT OPPSETT --- */}

      {/* 1. Viser alltid "Manage Goal Collections"-seksjonen */}
      <>
        <PageHeader
          actions={
            goalCollectionTiers.length > 0 ? (
              <Button
                appearance="danger"
                onClick={() => setShowFlushGoalCollections(true)}
              >
                Delete all goal collections
              </Button>
            ) : undefined
          }
        >
          Manage Goal Collections
        </PageHeader>
        {goalCollectionTiers.length === 0 ? (
          <p style={{ color: "#6B778C" }}>
            No goal collections yet. Click "New Goal Collection" to create one.
          </p>
        ) : (
          <SelectGoalTier
            isDisabled={isFetching}
            onChange={(value) => {
              setSelectedOption(value);
            }}
            selectedOption={selectedOption}
            setSelectedOption={(option: option) => setSelectedOption(option)}
            goalTiers={goalCollectionTiers}
          />
        )}
      </>

      {/* 2. Viser den VALGTE GoalTable (hvis noe er valgt) */}
      {selectedOption && (
        <GoalTable
          goalTier={selectedOption.value}
          isHighestGoalTier={
            items.length > 0 && selectedOption.value.id === items[0].id
          }
          upperIsMonetary={upperIsMonetary}
          postfix={postfix}
          onFetching={(isFetching) => setFetching(isFetching)}
        />
      )}

      {/* 3. Viser ALLTID Epic-tabellen (hvis den finnes) */}
      {loading ? (
        <Loading />
      ) : (
        epicTier && ( // Vises kun hvis epicTier ble funnet
          <Box xcss={xcss({ marginTop: "space.400" })} key={epicTier.id}>
            <PageHeader>{epicTier.name}</PageHeader>
            <GoalTable
              goalTier={epicTier}
              isHighestGoalTier={
                items.length > 0 && epicTier.id === items[0].id
              }
              upperIsMonetary={upperIsMonetary}
              postfix={postfix}
              onFetching={(isFetching) => setFetching(isFetching)}
            />
          </Box>
        )
      )}
      {/* --- SLUTT PÅ NYTT OPPSETT --- */}

      {/* Create goal collection (uendret) */}
      {showCreateGoalCollection && (
        <AdminGoalCollection
          mode="create"
          goal_collection={null}
          close={(refresh: boolean) => {
            setShowCreateGoalCollection(false);
            if (refresh) {
              setLoading(true);
              fetchData().then((items) => {
                setItems(items);
                setLoading(false);
              });
            }
          }}
        />
      )}

      {/* Edit goal collection (uendret) */}
      {showEditGoalCollection && editGoalCollection && (
        <AdminGoalCollection
          mode="edit"
          goal_collection={editGoalCollection}
          close={(refresh: boolean) => {
            setShowEditGoalCollection(false);
            setEditGoalCollection(null);
            if (refresh) {
              setLoading(true);
              fetchData().then((items) => {
                setItems(items);
                setLoading(false);
              });
            }
          }}
        />
      )}

      {/* Flush all goal collections */}
      {showFlushGoalCollections && (
        <FlushGoalCollections
          close={(refresh: boolean) => {
            setShowFlushGoalCollections(false);
            if (refresh) {
              setLoading(true);
              fetchData().then((items) => {
                setItems(items);
                setLoading(false);
              });
            }
          }}
        />
      )}

      {/* Delete goal collection (uendret) */}
      {showDeleteGoalCollection && deleteGoalCollection && (
        <DeleteGoalCollection
          goal_collection_id={deleteGoalCollection.id}
          name={deleteGoalCollection.name}
          close={(refresh: boolean) => {
            setShowDeleteGoalCollection(false);
            setDeleteGoalCollection(null);
            if (refresh) {
              setLoading(true);
              fetchData().then((items) => {
                setItems(items);
                setLoading(false);
              });
            }
          }}
        />
      )}
    </>
  );
};
