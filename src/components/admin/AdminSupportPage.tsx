import { Text, View } from "react-native";
import { AdminButton, AdminCard, AdminScreen, EmptyState } from "./AdminCommon";

export default function AdminSupportPage({
  inquiries,
  onDeleteInquiry,
  onUpdateInquiryStatus,
}: {
  inquiries: any[];
  onDeleteInquiry?: (inquiryId: string) => void;
  onUpdateInquiryStatus?: (inquiryId: string, status: string) => void;
}) {
  return (
    <AdminScreen title="Support" subtitle="Handle customer inquiries">
      {!inquiries.length ? <EmptyState label="No inquiries found." /> : null}
      {inquiries.map((inquiry) => (
        <AdminCard key={inquiry.id}>
          <Text>{inquiry.subject}</Text>
          <Text>{inquiry.message}</Text>
          <Text>{inquiry.customerName}</Text>
          <Text>{inquiry.email}</Text>
          <Text>{inquiry.status}</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <AdminButton
              label="Mark Resolved"
              variant="secondary"
              onPress={() => onUpdateInquiryStatus?.(inquiry.id, "RESOLVED")}
            />
            <AdminButton
              label="Delete"
              variant="danger"
              onPress={() => onDeleteInquiry?.(inquiry.id)}
            />
          </View>
        </AdminCard>
      ))}
    </AdminScreen>
  );
}
