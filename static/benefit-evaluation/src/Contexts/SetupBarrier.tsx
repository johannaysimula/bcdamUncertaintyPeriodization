import { ReactNode, useEffect, useMemo, useState } from "react";
import { Project, Portfolio } from "../Models";
// Vi trenger ikke lenger 'getProject' siden vi hopper over kallet
// import { getProject } from '../Api/ProjectApi'
import { SetIssueType } from "../Components/SettingsComponents/SetIssueType";
import { ScopeTypeEnum, useAppContext } from "./AppContext";
import { Loading } from "../Components/Common/Loading";
import { SetIssueStatuses } from "../Components/SettingsComponents/SetIssueStatuses";
import { ProgressTracker, Stages } from "@atlaskit/progress-tracker";
import PageHeader from "@atlaskit/page-header";
import { useAPI } from "./ApiContext";

type SetupBarrierProps = {
  children: ReactNode;
};

export type SetupBarrierContextType = {
  getCurrentLocationDetails: () => Promise<Project | Portfolio | undefined>;
};

export const SetupBarrierProvider = ({ children }: SetupBarrierProps) => {
  // --- START PÅ ENDRING ---

  // 1. Vi fjerner 'isLoading' og setter state direkte.
  const [isLoading, setLoading] = useState<boolean>(false); // Trenger ikke laste
  const [isFetching, setFetching] = useState<boolean>(false);

  // 2. Vi hardkoder 'issueType' og 'issueStatuses'
  //    Basert på JQL-en din (issuetype = 10000) og JSON (status id = 10000)
  const [issueType, setIssueType] = useState<string>("10000"); // Hardkodet "Epic" ID
  const [issueStatuses, setIssueStatuses] = useState<string[]>(["10000"]); // Hardkodet "To Do" ID

  const [scope] = useAppContext();
  const api = useAPI();

  // 3. Vi fjerner 'checkProject'-funksjonen helt.
  // const checkProject = async () => { ... }

  // 4. Vi fjerner 'useEffect'-kroken som kalte checkProject.
  // useEffect(() => { ... }, [scope]);

  // --- SLUTT PÅ ENDRING ---

  // Denne vil nå alltid være 'true' på grunn av den hardkodede staten
  const authorized = useMemo(() => {
    return issueType && issueStatuses && issueStatuses.length > 0;
  }, [issueType, issueStatuses]);

  const items: Stages = [
    // Denne er bare visuell, så vi setter den til "ferdig"
    {
      id: "disabled-1",
      label: "Select Issue Type",
      percentageComplete: 100,
      status: "disabled",
    },
    {
      id: "current-1",
      label: "Select Issue Statuses",
      percentageComplete: 100,
      status: "disabled",
    },
  ];

  return scope.type === ScopeTypeEnum.PROJECT ? (
    isLoading ? (
      <Loading />
    ) : authorized ? (
      // Appen vil nå gå hit umiddelbart
      <>{children}</>
    ) : (
      // Denne skjermen vil aldri vises lenger
      <div
        style={{
          position: "relative",
          marginTop: "24px",
          marginBottom: "24px",
          paddingLeft: "40px",
          paddingRight: "40px",
        }}
      >
        <PageHeader>Project Initialization</PageHeader>
        <ProgressTracker items={items} />
        <p>
          To initiate the Project, select the issue type you use as your epic
        </p>
        <SetIssueType
          onSave={() => {
            /* Gjør ingenting */
          }}
        />
        {issueType && (
          <>
            <p>Select which issue statuses you want to evalute</p>
            <p>This can be changed later</p>
            <SetIssueStatuses
              onSave={() => {
                /* Gjør ingenting */
              }}
            />
          </>
        )}
        {isFetching && <Loading />}
      </div>
    )
  ) : (
    <>{children}</>
  );
};
