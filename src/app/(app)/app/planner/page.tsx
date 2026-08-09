import { EmptyState } from "@/components/shared/EmptyState";

export default function PlannerPage() {
  return (
    <EmptyState
      kicker="Autopilot"
      headline="Your study plan, rerouted live."
      body="The planning engine lands here next: set your weekly hours, and Autopilot spreads the work — then reroutes when you miss a day."
    />
  );
}
