import { useEffect, useState } from "react";
import CacheService from "../../api/CacheService";
import { AdminButton, AdminCard, AdminScreen, Banner, Row } from "./AdminCommon";

export default function CacheController() {
  const [message, setMessage] = useState("");
  const [dashboard, setDashboard] = useState<any>(null);

  const load = async () => {
    try {
      setDashboard(await CacheService.getCacheDashboard());
    } catch (error: any) {
      setMessage(error?.message || "Failed to load cache dashboard");
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <AdminScreen title="Cache Management" subtitle="Manage cache state">
      <Banner message={message} tone={message.includes("success") ? "success" : "error"} />
      <AdminCard>
        <Row label="Dashboard Loaded" value={dashboard ? "Yes" : "No"} />
        <AdminButton label="Refresh" variant="secondary" onPress={load} />
        <AdminButton label="Clear All Caches" variant="danger" onPress={async () => {
          await CacheService.clearAllCaches();
          setMessage("All caches cleared");
          load();
        }} />
        <AdminButton label="Reset Stats" variant="secondary" onPress={async () => {
          await CacheService.resetCacheStats();
          setMessage("Cache stats reset");
          load();
        }} />
        <AdminButton label="Enable Caching" onPress={async () => {
          await CacheService.enableCaching();
          setMessage("Caching enabled");
          load();
        }} />
        <AdminButton label="Disable Caching" variant="danger" onPress={async () => {
          await CacheService.disableCaching();
          setMessage("Caching disabled");
          load();
        }} />
      </AdminCard>
    </AdminScreen>
  );
}
