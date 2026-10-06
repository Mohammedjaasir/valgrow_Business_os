import { ProductTour } from "./product-tour";
import { WelcomeDialog } from "./welcome-dialog";

/** Global onboarding overlays (welcome dialog, product tour), mounted once per AppShell. */
export function OnboardingOverlays() {
  return (
    <>
      <WelcomeDialog />
      <ProductTour />
    </>
  );
}
