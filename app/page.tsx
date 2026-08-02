import { Dashboard, type DashboardProps } from "@/components/Dashboard";
import overviewJson from "@/data/generated/overview.json";
import statesJson from "@/data/generated/states.json";
import countiesJson from "@/data/generated/counties.json";
import vaccinationJson from "@/data/generated/vaccination.json";
import chronicJson from "@/data/generated/chronic.json";

const overview = overviewJson as DashboardProps["overview"];
const states = statesJson as unknown as DashboardProps["states"];
const counties = countiesJson as unknown as DashboardProps["counties"];
const vaccination = vaccinationJson as unknown as DashboardProps["vaccination"];
const chronic = chronicJson as unknown as DashboardProps["chronic"];

function getLatestDataDate(
  overview: DashboardProps["overview"],
  states: DashboardProps["states"],
  vaccination: DashboardProps["vaccination"]
): string {
  const dates = [
    overview.flu.asOf,
    overview.covid.asOf,
    overview.rsv.asOf,
    overview.measles.asOf,
    states.flu["CDC NSSP"]?.asOf,
    states.measles.weekly?.asOf,
    vaccination.mmrHealthmap?.asOf,
  ].filter((d) => d);

  if (!dates.length) return "unknown";
  return dates.reduce((latest, current) => (current > latest ? current : latest));
}

export default function Home() {
  const latestDataDate = getLatestDataDate(overview, states, vaccination);
  const generatedDate = new Date(overview.generatedAt).toLocaleString();

  return (
    <div className="min-h-full" style={{ background: "var(--color-bg-page)" }}>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <header className="mb-4 pb-3" style={{ borderBottom: "1px solid var(--color-border-default)" }}>
          <h1 className="text-base font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
            Public Health Surveillance Dashboard
          </h1>
          <p className="mt-1 text-xs leading-tight" style={{ color: "var(--color-text-secondary)" }}>
            Current US disease activity from PopHIVE. Personal reference — not a clinical tool.
          </p>
          <p className="text-xs font-medium" style={{ color: "var(--color-text-secondary)" }}>
            Last updated: <span style={{ color: "var(--color-text-primary)" }}>{latestDataDate}</span>
          </p>
        </header>
        <Dashboard
          overview={overview}
          states={states}
          counties={counties}
          vaccination={vaccination}
          chronic={chronic}
        />
      </main>
    </div>
  );
}
