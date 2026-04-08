import { AdminButton } from "./AdminCommon";

export default function DeleteSupport({
  inquiryId,
  onDelete,
}: {
  inquiryId: string;
  onDelete?: (inquiryId: string) => void;
}) {
  return <AdminButton label="Delete Inquiry" variant="danger" onPress={() => onDelete?.(inquiryId)} />;
}
