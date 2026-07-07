import { useSearchParams } from "react-router-dom";
import { useCallback } from "react";

/**
 * useWizardSteps abstracts the logic of managing wizard steps into the URL query parameters.
 * This ensures that browser Back/Forward navigation works seamlessly without resetting the SPA state.
 */
export function useWizardSteps(defaultStep: number = 1, maxStep: number = 10, paramName: string = "step") {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentStep = (() => {
    const stepParam = searchParams.get(paramName);
    if (!stepParam) return defaultStep;
    const parsed = parseInt(stepParam, 10);
    if (isNaN(parsed) || parsed < 1) return 1;
    if (parsed > maxStep) return maxStep;
    return parsed;
  })();

  const setStep = useCallback(
    (newStep: number) => {
      setSearchParams(
        (prev) => {
          const clamped = Math.max(1, Math.min(newStep, maxStep));
          prev.set(paramName, clamped.toString());
          return prev;
        },
        { replace: false } // Allows history stack to build up for Back button
      );
    },
    [setSearchParams, maxStep, paramName]
  );

  const nextStep = useCallback(() => {
    if (currentStep < maxStep) {
      setStep(currentStep + 1);
    }
  }, [currentStep, maxStep, setStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setStep(currentStep - 1);
    }
  }, [currentStep, setStep]);

  return { currentStep, setStep, nextStep, prevStep };
}
