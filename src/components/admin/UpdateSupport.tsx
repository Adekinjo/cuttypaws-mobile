import { useState } from "react";
import { Switch, Text, View } from "react-native";
import { AdminButton, AdminCard, AdminScreen } from "./AdminCommon";

export default function UpdateSupport({
  inquiryId,
  onUpdate,
}: {
  inquiryId: string;
  onUpdate?: (inquiryId: string, payload: { resolved: boolean }) => void;
}) {
  const [resolved, setResolved] = useState(false);

  return (
    <AdminScreen title="Update Inquiry" subtitle={`Inquiry ${inquiryId}`}>
      <AdminCard>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text>Resolved</Text>
          <Switch value={resolved} onValueChange={setResolved} />
        </View>
        <AdminButton label="Update Inquiry" onPress={() => onUpdate?.(inquiryId, { resolved })} />
      </AdminCard>
    </AdminScreen>
  );
}
