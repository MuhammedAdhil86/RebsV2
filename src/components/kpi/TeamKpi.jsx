import React from "react";
import { fetchTeamKpi } from "../../service/kpiService";
import {
  useKpiData,
  DashboardView,
  Loading,
  ErrorBox,
} from "./CompanyOverview";

function TeamKpi({ month, year, onOpenEmployee }) {
  const team = useKpiData(() => fetchTeamKpi(month, year), [month, year], true);

  if (team.loading) return <Loading />;
  if (team.error) {
    return <ErrorBox message={team.error} onRetry={team.reload} />;
  }
  if (!team.data) return null;

  return (
    <DashboardView
      kpi={team.data}
      scope="team"
      onOpenEmployee={onOpenEmployee}
    />
  );
}

export default TeamKpi;
