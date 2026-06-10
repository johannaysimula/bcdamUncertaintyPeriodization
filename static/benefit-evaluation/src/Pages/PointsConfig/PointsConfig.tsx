import { useEffect, useState } from "react";
import PageHeader from "@atlaskit/page-header";
import Button from "@atlaskit/button";
import Textfield from "@atlaskit/textfield";
import SectionMessage from "@atlaskit/section-message";
import { useTranslation } from "../../i18n";
import { useAppContext } from "../../Contexts/AppContext";
import { useAPI } from "../../Contexts/ApiContext";
import { PointsConfig, DEFAULT_POINTS_CONFIG } from "../../Models/PointsConfigModel";

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginBottom: "12px",
};

const labelStyle: React.CSSProperties = {
  minWidth: "220px",
  fontWeight: 500,
};

interface ConfigRowProps {
  label: string;
  value: number;
  unit: string;
  onValueChange: (v: number) => void;
  onUnitChange: (v: string) => void;
}

const ConfigRow = ({ label, value, unit, onValueChange, onUnitChange }: ConfigRowProps) => (
  <div style={rowStyle}>
    <span style={labelStyle}>{label}</span>
    <div style={{ width: "110px" }}>
      <Textfield
        type="number"
        value={value}
        min={0}
        step="any"
        onChange={(e) => onValueChange(parseFloat((e.target as HTMLInputElement).value) || 0)}
      />
    </div>
    <div style={{ width: "140px" }}>
      <Textfield
        value={unit}
        onChange={(e) => onUnitChange((e.target as HTMLInputElement).value)}
      />
    </div>
  </div>
);

export const PointsConfigPage = () => {
  const { t } = useTranslation();
  const [scope] = useAppContext();
  const api = useAPI();

  const [config, setConfig] = useState<PointsConfig>({
    scopeId: scope.id,
    ...DEFAULT_POINTS_CONFIG,
  });
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    api.pointsConfig.get(scope.id).then((data) => {
      if (data) setConfig(data);
    });
  }, [scope.id]);

  const handleSave = async () => {
    setSaved(false);
    setSaveError(false);
    try {
      await api.pointsConfig.set(scope.id, { ...config, scopeId: scope.id });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveError(true);
    }
  };

  const update = (field: keyof PointsConfig) => (value: number | string) =>
    setConfig((prev) => ({ ...prev, [field]: value }));

  return (
    <>
      <PageHeader>{t("points_config.title")}</PageHeader>
      <p style={{ marginBottom: "24px" }}>{t("points_config.description")}</p>

      {saved && (
        <div style={{ marginBottom: "16px" }}>
          <SectionMessage appearance="success">
            <p>{t("points_config.save_success")}</p>
          </SectionMessage>
        </div>
      )}
      {saveError && (
        <div style={{ marginBottom: "16px" }}>
          <SectionMessage appearance="error">
            <p>{t("points_config.save_error")}</p>
          </SectionMessage>
        </div>
      )}

      <h3 style={{ marginBottom: "12px" }}>{t("points_config.bp_section")}</h3>
      <ConfigRow
        label={t("points_config.monetary_label")}
        value={config.bpMonetaryValue}
        unit={config.bpCurrency}
        onValueChange={update("bpMonetaryValue") as (v: number) => void}
        onUnitChange={update("bpCurrency") as (v: string) => void}
      />

      <h3 style={{ marginTop: "24px", marginBottom: "12px" }}>{t("points_config.sp_section")}</h3>
      <ConfigRow
        label={t("points_config.monetary_label")}
        value={config.spMonetaryValue}
        unit={config.spCurrency}
        onValueChange={update("spMonetaryValue") as (v: number) => void}
        onUnitChange={update("spCurrency") as (v: string) => void}
      />

      <h3 style={{ marginTop: "24px", marginBottom: "12px" }}>{t("points_config.tp_section")}</h3>
      <ConfigRow
        label={t("points_config.monetary_label")}
        value={config.tpValue}
        unit={config.tpUnit}
        onValueChange={update("tpValue") as (v: number) => void}
        onUnitChange={update("tpUnit") as (v: string) => void}
      />

      <div style={{ marginTop: "24px" }}>
        <Button appearance="primary" onClick={handleSave}>
          {t("points_config.save")}
        </Button>
      </div>
    </>
  );
};
