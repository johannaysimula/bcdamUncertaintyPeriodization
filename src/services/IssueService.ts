import { requestAPI } from "../api/requestAPI";
// FIKS: Fjernet 'getIssueStatuses'
import { getSelectedIssueType } from "./ProjectService";
import { route } from "@forge/api"; // Fjernet 'startsWith' som ikke brukes
import {
  balancedPoints,
  distributedPoints,
  IssueStatus,
  IssueType,
  issueProperties,
  FetchedIssue,
  Issue,
  IssueCost,
  CostTime,
  GoalTypeEnum,
} from "../models";
import { storage } from "@forge/api";

// FIKS: Fjernet 'issueStatuses' og 'preview' fra parameterne
const queryIssues = async (
  projectId: string,
  issueTypeId: string, // Denne vil nå være strengen "Epic"
  page?: string
) => {
  console.log("iService", "Query Issues");

  const queryParams = new URLSearchParams({
    fields: "summary, subtasks, status",
    // FIKS: JQL bruker nå 'issueTypeId' (som er 'Epic') med anførselstegn
    // Dette er den samme JQL-en som fungerte i Postman (project = FIP AND issuetype = 'Epic')
    jql: `project = ${projectId} AND issuetype = '${issueTypeId}'`,
    startAt: page ? page : "0",
    properties: `${issueProperties.balancedPoints}, ${issueProperties.distributedPoints}, ${issueProperties.issueCost}`,
  });
  const Route = route`/rest/api/3/search/jql?${queryParams}`;
  return requestAPI
    .get(Route)
    .then((response: FetchedIssue) => response)
    .catch((error) => {
      console.error("here", error);
      return Promise.reject("Something went wrong " + error);
    });
};

// FIKS: Fjernet 'issueStatuses' og 'preview' fra parameterne
export const getAllIssues = async (
  projectId: string,
  issueTypeId: string, // Denne vil være "Epic"
  page?: string
): Promise<Issue[]> => {
  console.log("iService", "Get All Issues");
  // FIKS: Kaller queryIssues med færre parametere
  return queryIssues(projectId, issueTypeId, page)
    .then(async ({ issues, startAt, maxResults, total }) => {
      const fetchedIssues: Issue[] = issues.map((issue) => ({
        ...issue,
        goalCollectionId: issueTypeId,
        scopeId: projectId,
        type: GoalTypeEnum.ISSUE,
        description: issue.fields.summary,
        status: issue.fields.status as IssueStatus,
        balancedPoints: issue.properties.evaluation_points,
        distributedPoints: issue.properties.evaluation_distributedpoints,
        issueCost: issue.properties.issueCost || {
          // Setter standard O/M/P-verdier
          cost: 0,
          time: 0,
          balanced_points: 0,
          costOptimistic: 0,
          costPessimistic: 0,
          timeOptimistic: 0,
          timePessimistic: 0,
          benefitOptimistic: 0,
          benefitPessitistic: 0,
        },
      }));
      if (startAt + maxResults < total) {
        const page = (startAt + maxResults).toString();
        // FIKS: Kaller seg selv rekursivt med færre parametere
        return fetchedIssues.concat(
          await getAllIssues(projectId, issueTypeId, page)
        );
      } else {
        return fetchedIssues;
      }
    })
    .catch((error) => {
      console.error(error);
      return Promise.reject(error);
    });
};

// FIKS: 'fetchIssuesPreview' er fjernet

// FIKS: Denne funksjonen kaller ikke lenger 'getIssueStatuses'
export const fetchIssues = async (projectId: string): Promise<Issue[]> => {
  const promises: {
    issueType: Promise<IssueType>;
  } = {
    issueType: getSelectedIssueType(projectId), // Denne returnerer nå { id: 'Epic', ... }
  };
  return Promise.all([promises.issueType])
    .then(async ([issueType]) => {
      // Kaller 'getAllIssues' med 'Epic' som ID
      return getAllIssues(projectId, issueType.id)
        .then((issues) => {
          return issues;
        })
        .catch((error) => {
          console.error(error);
          return Promise.reject(error);
        });
    })
    .catch((error) => {
      console.error(error);
      return Promise.reject(error);
    });
};

// --- INGEN ENDRINGER I RESTEN AV FILEN ---
export const setBenefitPoints = async (
  issueTypeId: string,
  balancedPoints?: balancedPoints
) => {
  console.log("Issue Service", "Set Point to Issue: ", issueTypeId);
  console.log("Ebba", "Set Point to Issue: ", issueProperties);
  const propertyKey = issueProperties.balancedPoints;
  const Route = route`/rest/api/3/issue/${issueTypeId}/properties/${propertyKey}`;
  return requestAPI.put(Route, balancedPoints).catch((error) => {
    console.error(error);
    return { ok: false };
  });
};

const resetBenefitPoints = async (issueTypeId: string) => {
  console.log("Issue Service", "Reset BenefitPoints to Issue: ", issueTypeId);
  const propertyKey = issueProperties.balancedPoints;
  const Route = route`/rest/api/3/jql/issue/${issueTypeId}/properties/${propertyKey}`;
  return requestAPI.delete(Route).catch((error) => {
    console.error(error);
    return { ok: false };
  });
};

export const setDistributedPointsToIssue = async (
  issueTypeId: string,
  distributedPoints?: distributedPoints
) => {
  console.log(
    "Issue Service",
    "Set Distributed Points to Issue: ",
    issueTypeId
  );
  const propertyKey = issueProperties.distributedPoints;
  const Route = route`/rest/api/3/issue/${issueTypeId}/properties/${propertyKey}`;
  return requestAPI.put(Route, distributedPoints).catch((error) => {
    console.error(error);
    return Promise.reject(error);
  });
};

const resetDistributedPointsToIssue = async (issueTypeId: string) => {
  console.log(
    "Issue Service",
    "Reset Distributed Points to Issue: ",
    issueTypeId
  );
  const propertyKey = issueProperties.distributedPoints;
  const Route = route`/rest/api/3//issue/${issueTypeId}/properties/${propertyKey}`;
  return requestAPI.delete(Route).catch((error) => {
    console.error(error);
    return Promise.reject(error);
  });
};

export const resetIssues = async (projectId: string) => {
  return fetchIssues(projectId) // Denne kaller nå den fikse 'fetchIssues'
    .then(async (issues) => {
      const promises: Promise<any>[] = [];
      for (const issue of issues) {
        promises.push(resetDistributedPointsToIssue(issue.id));
        promises.push(resetBenefitPoints(issue.id));
        promises.push(resetCostTime(issue.id));
      }
      return Promise.all(promises).catch((error) => {
        console.error("could not reset issues");
        console.error(error);
        return Promise.reject(error);
      });
    })
    .catch((error) => {
      console.error("could not fetch issues");
      console.error(error);
      return { ok: false };
    });
};

export const setCostTime = async (issues: IssueCost): Promise<void> => {
  const propertyKey = issueProperties.issueCost;
  const promises: Promise<any>[] = [];
  for (const key in issues) {
    console.log("Issue Service", "Set Cost/Time to Issue: ", key);
    const Route = route`/rest/api/3/issue/${key}/properties/${propertyKey}`;
    promises.push(
      requestAPI.put(Route, issues[key]).catch((error) => {
        console.error(error);
        return { ok: false };
      })
    );
  }

  Promise.all(promises).catch((error) => {
    console.error(error);
    return Promise.reject(error);
  });
  return;
};

const resetCostTime = async (issueTypeId: string) => {
  console.log("Issue Service", "Reset cost and time for Issue: ", issueTypeId);
  const propertyKey = issueProperties.issueCost;
  const Route = route`/rest/api/3/issue/${issueTypeId}/properties/${propertyKey}`;
  return requestAPI.delete(Route).catch((error) => {
    console.error(error);
    return { ok: false };
  });
};

const resetBenefitPoints2 = async (issueTypeId: string) => {
  console.log("Issue Service", "Reset Benefit Points for Issue: ", issueTypeId);
  // Bruker 'balancedPoints' (som er 'evaluation_points')
  const propertyKey = issueProperties.balancedPoints;
  const Route = route`/rest/api/3/issue/${issueTypeId}/properties/`;

  return requestAPI.delete(Route).catch((error) => {
    console.error(error);
    return { ok: false };
  });
};

const resetDistributedPoints2 = async (issueTypeId: string) => {
  console.log(
    "Issue Service",
    "Reset Distributed Points for Issue: ",
    issueTypeId
  );
  // Bruker 'distributedPoints' (som er 'evaluation_distributedpoints')
  const propertyKey = issueProperties.distributedPoints;
  const Route = route`/rest/api/3/issue/${issueTypeId}/properties/${propertyKey}`;

  return requestAPI.delete(Route).catch((error) => {
    console.error(error);
    return { ok: false };
  });
};

export const flushEpicCostTime = async (projectId: string): Promise<void> => {
  return fetchIssues(projectId) // Denne kaller nå den fikse 'fetchIssues'
    .then(async (issues) => {
      const promises: Promise<any>[] = [];
      for (const issue of issues) {
        promises.push(resetCostTime(issue.id));
        promises.push(resetDistributedPoints2(issue.id));
        promises.push(resetBenefitPoints2(issue.id));
      }
      Promise.all(promises).catch((error) => {
        console.error("could not reset issue costs and times");
        console.error(error);
        return Promise.reject(error);
      });
      return;
    })
    .catch((error) => {
      console.error("could not fetch issues");
      console.error(error);
      return;
    });
};
