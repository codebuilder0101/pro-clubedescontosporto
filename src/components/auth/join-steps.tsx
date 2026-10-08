import { useTranslations } from "next-intl";
import { Icon, type IconName } from "../icon";

/** Account — Payment — Card progress indicator for the join flow. */
export function JoinSteps({ current }: { current: 1 | 2 | 3 }) {
  const t = useTranslations("Auth");
  const steps: { label: string; icon: IconName }[] = [
    { label: t("stepAccount"), icon: "user" },
    { label: t("stepPayment"), icon: "wallet" },
    { label: t("stepCard"), icon: "card" },
  ];
  return (
    <ol aria-label={t("stepsLabel")} className="steps flex-wrap">
      {steps.map((s, i) => {
        const n = i + 1;
        const state = n < current ? "done" : n === current ? "current" : "todo";
        return (
          <li key={s.label} data-state={state} aria-current={state === "current" ? "step" : undefined}>
            <span className={`ci ${state === "done" ? "ci-leaf" : state === "current" ? "ci-sun" : "ci-slate"}`}>
              <Icon name={state === "done" ? "check" : s.icon} />
            </span>
            {/* On phones only the current step keeps its label. */}
            <span className={state === "current" ? undefined : "max-sm:sr-only"}>{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
