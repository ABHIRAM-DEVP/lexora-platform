import { WorkspaceOverviewDashboard } from "@/components/workspace/WorkspaceOverviewDashboard";

export default async function WorkspaceOverviewPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  return <WorkspaceOverviewDashboard workspaceId={workspaceId} />;
}
