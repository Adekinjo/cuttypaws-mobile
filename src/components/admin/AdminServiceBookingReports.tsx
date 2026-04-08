import { useEffect, useState } from "react";
import ServiceBookingReportService from "../../api/ServiceBookingReportService";
import { AdminButton, AdminCard, AdminScreen, EmptyState, Field, LoadingState, Row } from "./AdminCommon";

export default function AdminServiceBookingReports() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolution, setResolution] = useState<Record<string, string>>({});

  const load = async () => {
    try {
      const response = await ServiceBookingReportService.getAdminReports();
      setReports(response.reportList || response.reports || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <AdminScreen title="Service Reports" subtitle="Review service booking complaints">
      {loading ? <LoadingState label="Loading reports..." /> : null}
      {!loading && reports.length === 0 ? <EmptyState label="No reports found." /> : null}
      {!loading &&
        reports.map((report) => (
          <AdminCard key={report.id}>
            <Row label="Report ID" value={report.id} />
            <Row label="Status" value={report.status} />
            <Row label="Reason" value={report.reason || report.description} />
            <Field
              label="Resolution / Status Payload"
              value={resolution[report.id] || ""}
              onChangeText={(value) =>
                setResolution((prev) => ({ ...prev, [report.id]: value }))
              }
            />
            <AdminButton
              label="Update Report"
              onPress={async () => {
                await ServiceBookingReportService.updateAdminReport(report.id, {
                  resolution: resolution[report.id],
                });
                load();
              }}
            />
          </AdminCard>
        ))}
    </AdminScreen>
  );
}
