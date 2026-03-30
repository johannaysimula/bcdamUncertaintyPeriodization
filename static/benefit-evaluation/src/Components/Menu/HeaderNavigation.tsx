import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAppContext } from "../../Contexts/AppContext";
import {
  AtlassianNavigation,
  Help,
  PrimaryButton,
  Settings,
} from "@atlaskit/atlassian-navigation";
import { Box, Flex, xcss } from "@atlaskit/primitives";
import { useAPI } from "../../Contexts/ApiContext";

type TabLink = {
  name: string;
  src: string;
  id: string;
};

export const HeaderNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedTab, setSelectedTab] = useState<string>();
  const [scope] = useAppContext();
  const api = useAPI();

  useEffect(() => {
    const scopeLocation = location.pathname.replaceAll("/", "");
    const index = tabLinks.find((tabLink) => {
      return scopeLocation.includes(tabLink.src);
    });
    setSelectedTab(index?.name);
  }, [location]);

  const tabLinks: TabLink[] = [
    {
      name: "Goal Structure",
      src: "goal-structure",
      id: "goal-structure",
    },
    {
      name: "Estimation",
      src: "estimation",
      id: "estimation",
    },
    ...(location.pathname.includes("portfolio/pf")
      ? []
      : [
          {
            name: "Analysis",
            src: "analysis",
            id: "analysis",
          },
        ]),
    {
      name: "Settings",
      src: "settings",
      id: "settings",
    },
  ];

  const ScopeHeader = () => {
    const headerStyle = xcss({
      color: "color.text.accent.blue",
      fontWeight: "bold",
      textOverflow: "ellipsis",
      overflow: "hidden",
      whiteSpace: "nowrap",
      width: "100%",
      textAlign: "left",
    });

    return (
      <Box as="h5" xcss={headerStyle}>
        {scope.name.toUpperCase()}
      </Box>
    );
  };

  const DefaultSettings = () => (
    <Settings
      tooltip="Settings"
      isSelected={selectedTab === "Settings"}
      onClick={() => navigate("settings")}
    />
  );

  return (
    <AtlassianNavigation
      label="site"
      renderProductHome={() => null}
      renderHelp={() => <Help tooltip="" onClick={() => {}} />}
      renderSettings={DefaultSettings}
      primaryItems={[
        <Flex
          alignItems="center"
          justifyContent="center"
          xcss={xcss({
            height: "100%",
            marginLeft: "4px",
            marginRight: "16px",
            maxWidth: "150px",
            overflow: "hidden",
            color: "color.text.subtle",
          })}
        >
          <ScopeHeader />
        </Flex>,
        ...tabLinks.map((tabLink: TabLink, index) => {
          if (tabLink.name !== "Settings") {
            return (
              <div key={index} id={tabLink.id}>
                <PrimaryButton
                  isSelected={selectedTab === tabLink.name}
                  onClick={() => navigate(tabLink.src)}
                >
                  {tabLink.name}
                </PrimaryButton>
              </div>
            );
          }
        }),
      ]}
    />
  );
};
