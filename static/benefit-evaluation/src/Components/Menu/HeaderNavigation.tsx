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
import { useTranslation, useLocale } from "../../i18n";
import WorldIcon from "@atlaskit/icon/glyph/world";
import Button from "@atlaskit/button";
import Tooltip from "@atlaskit/tooltip";
import Popup from "@atlaskit/popup";
import { MenuGroup, Section, ButtonItem } from "@atlaskit/menu";

type TabLink = {
  name: string;
  src: string;
  id: string;
};

export const HeaderNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedTab, setSelectedTab] = useState<string>();
  const [isLangPopupOpen, setIsLangPopupOpen] = useState(false);
  const [scope] = useAppContext();
  const { t } = useTranslation();
  const currentLocale = useLocale();

  const handleLanguageChange = (newLocale: string) => {
    setIsLangPopupOpen(false);
    window.dispatchEvent(new CustomEvent("languageChange", { detail: newLocale }));
  };

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
    {
      name: "Set Point Values",
      src: "points-config",
      id: "points-config",
    },
    ...(location.pathname.includes("portfolio/pf")
      ? []
      : [
          {
            name: "Uncertainty Analysis",
            src: "analysis",
            id: "analysis",
          },
          {
            name: "Periodization",
            src: "periodization",
            id: "periodization",
          },
        ]),
    {
      name: "Settings",
      src: "settings",
      id: "settings",
    },
  ];

  useEffect(() => {
    const scopeLocation = location.pathname.replaceAll("/", "");
    const index = tabLinks.find((tabLink) => scopeLocation.includes(tabLink.src));
    setSelectedTab(index?.name);
  }, [location]);

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

  const LanguageDropdown = () => (
    <Popup
      isOpen={isLangPopupOpen}
      onClose={() => setIsLangPopupOpen(false)}
      placement="bottom-end"
      content={() => (
        <Box xcss={xcss({ minWidth: "150px", padding: "space.100" })}>
          <MenuGroup>
            <Section title={t("nav.language_tooltip")}>
              <ButtonItem
                isSelected={currentLocale === "no-NO"}
                onClick={() => handleLanguageChange("no-NO")}
              >
                Norsk (bokmål)
              </ButtonItem>
              <ButtonItem
                isSelected={currentLocale === "en-US"}
                onClick={() => handleLanguageChange("en-US")}
              >
                English
              </ButtonItem>
            </Section>
          </MenuGroup>
        </Box>
      )}
      trigger={(triggerProps) => (
        <Box
          xcss={xcss({
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "32px",
            height: "32px",
          })}
        >
          <Tooltip content={t("nav.language_tooltip")}>
            <Button
              {...triggerProps}
              appearance="subtle"
              spacing="none"
              onClick={() => setIsLangPopupOpen(!isLangPopupOpen)}
              iconBefore={<WorldIcon label={t("nav.language_tooltip")} />}
            />
          </Tooltip>
        </Box>
      )}
    />
  );

  return (
    <AtlassianNavigation
      label="site"
      renderProductHome={() => null}
      renderHelp={() => (
        <Flex alignItems="center" gap="space.050">
          <LanguageDropdown />
          <Help tooltip="" onClick={() => {}} />
        </Flex>
      )}
      renderSettings={() => (
        <Settings
          tooltip={t("nav.settings_tooltip")}
          isSelected={
            selectedTab === "Settings" || location.pathname.includes("settings")
          }
          onClick={() => navigate("settings")}
        />
      )}
      primaryItems={[
        <Flex
          key="scope"
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
        ...tabLinks
          .filter((tabLink) => tabLink.name !== "Settings")
          .map((tabLink: TabLink, index) => (
            <div key={index} id={tabLink.id}>
              <PrimaryButton
                isSelected={selectedTab === tabLink.name}
                onClick={() => navigate(tabLink.src)}
              >
                {tabLink.name}
              </PrimaryButton>
            </div>
          )),
      ]}
    />
  );
};
