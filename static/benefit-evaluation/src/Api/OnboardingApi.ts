import { invoke } from "@forge/bridge";

export const onboardingApi = () => {
  return {
    setOnboardingComplete: (complete: boolean) => {
      return invoke("setOnboardingComplete", { complete });
    },
    getOnboardingComplete: (): Promise<boolean> => {
      return invoke("getOnboardingComplete", {});
    },
  };
};
