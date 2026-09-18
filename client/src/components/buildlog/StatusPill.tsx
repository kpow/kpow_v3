import type { BuildStatus } from "@/lib/buildlog";

export function StatusPill({ status, mini }: { status: BuildStatus; mini?: boolean }) {
  return (
    <span className={`pill ${status}${mini ? " mini" : ""}`}>
      <span className="led" />
      {status}
    </span>
  );
}
