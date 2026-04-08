import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useEffect, useState } from "react";
import AuthService from "../../api/AuthService";
import { AdminCard, AdminScreen, EmptyState, LoadingState, Row, adminStyles } from "./AdminCommon";

export default function AdminAllUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setUsers((await AuthService.getAllUsers()) || []);
      } catch (err: any) {
        setError(err?.message || "Failed to load users");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <AdminScreen title="All Users" subtitle="View platform users">
      {loading ? <LoadingState label="Loading users..." /> : null}
      {!loading && error ? <Text>{error}</Text> : null}
      {!loading && !error && users.length === 0 ? <EmptyState label="No users found." /> : null}
      {!loading &&
        !error &&
        users.map((user) => (
          <Pressable key={user.id} onPress={() => setSelectedUser(user)}>
            <AdminCard>
              <Row label="Name" value={user.name} />
              <Row label="Email" value={user.email} />
              <Row label="Role" value={user.role} />
            </AdminCard>
          </Pressable>
        ))}

      <Modal visible={!!selectedUser} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "#00000066", justifyContent: "center", padding: 16 }}>
          <View style={[adminStyles.card, { maxHeight: "80%" }]}>
            <ScrollView>
              <Text style={adminStyles.title}>{selectedUser?.name || "User Details"}</Text>
              <Row label="ID" value={selectedUser?.id} />
              <Row label="Email" value={selectedUser?.email} />
              <Row label="Phone" value={selectedUser?.phoneNumber} />
              <Row label="Role" value={selectedUser?.role} />
              <Row
                label="Created"
                value={
                  selectedUser?.createdAt
                    ? new Date(selectedUser.createdAt).toLocaleString()
                    : "-"
                }
              />
            </ScrollView>
            <Pressable onPress={() => setSelectedUser(null)} style={adminStyles.button}>
              <Text style={adminStyles.buttonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </AdminScreen>
  );
}
