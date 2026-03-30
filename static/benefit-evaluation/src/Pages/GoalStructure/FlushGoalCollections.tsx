import { useAPI } from "../../Contexts/ApiContext";
import { useEffect } from "react";
import { useFlags } from "@atlaskit/flag";
import { useAlert } from "../../Contexts/AlertContext";
import SuccessIcon from "@atlaskit/icon/glyph/check-circle";
import ErrorIcon from "@atlaskit/icon/glyph/error";
import { token } from "@atlaskit/tokens";
import { useAppContext } from "../../Contexts/AppContext";

type FlushGoalCollectionsProps = {
  close: (refresh: boolean) => void;
};

export const FlushGoalCollections = (props: FlushGoalCollectionsProps) => {
  const api = useAPI();
  const [scope] = useAppContext();
  const { showAlert } = useAlert();
  const { showFlag } = useFlags();

  useEffect(() => {
    showAlert({
      title: "Delete all goal collections",
      body: "Are you sure you want to delete all goal collections and their goals? This cannot be undone. Epics in Jira will not be affected.",
      confirmText: "Delete all",
      onCancel: () => props.close(false),
      onConfirm: () => flushAll(),
    });
  }, []);

  const flushAll = async () => {
    await api.goalCollection
      .flushAll(scope.id)
      .then(() => {
        showFlag({
          title: "Deleted",
          description: "All goal collections have been deleted.",
          isAutoDismiss: true,
          icon: (
            <SuccessIcon
              primaryColor={token("color.icon.success", "#14854F")}
              label="Success"
            />
          ),
        });
        props.close(true);
      })
      .catch(() => {
        showFlag({
          title: "Error",
          description: "Could not delete all goal collections.",
          isAutoDismiss: true,
          icon: (
            <ErrorIcon
              primaryColor={token("color.icon.danger", "#DE350B")}
              label="Error"
            />
          ),
        });
        props.close(false);
      });
  };

  return <div />;
};
