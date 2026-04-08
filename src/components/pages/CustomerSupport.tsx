import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useState } from "react";
import { AdminButton, AdminCard, Banner, Field } from "../admin/AdminCommon";

type SupportPayload = {
  customerName: string;
  email: string;
  subject: string;
  message: string;
};

const WHATSAPP_URL = "https://wa.me/2348135072306";
const SUPPORT_EMAIL = "support@cuttypaws.com";

export default function CustomerSupport({
  onSubmitInquiry,
}: {
  onSubmitInquiry?: (payload: SupportPayload) => Promise<any>;
}) {
  const [formData, setFormData] = useState<SupportPayload>({
    customerName: "",
    email: "",
    subject: "",
    message: "",
  });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field: keyof SupportPayload, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setMessage("");

    if (
      !formData.customerName.trim() ||
      !formData.email.trim() ||
      !formData.subject.trim() ||
      !formData.message.trim()
    ) {
      setMessage("Please complete all support fields.");
      return;
    }

    if (!onSubmitInquiry) {
      setMessage("Support submission service is not configured yet. Use WhatsApp or email below.");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmitInquiry({
        customerName: formData.customerName.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      });
      setMessage("Inquiry submitted successfully.");
      setFormData({
        customerName: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error: any) {
      setMessage(error?.message || "Error submitting inquiry.");
    } finally {
      setSubmitting(false);
    }
  };

  const openWhatsAppChat = async () => {
    await Linking.openURL(WHATSAPP_URL);
  };

  const openEmail = async () => {
    await Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Banner
        message={message}
        tone={message.includes("successfully") ? "success" : "error"}
      />

      <View style={styles.heroCard}>
        <View style={styles.heroTextBlock}>
          <Text style={styles.eyebrow}>Customer Support</Text>
          <Text style={styles.heroTitle}>Report a complaint or ask for help</Text>
          <Text style={styles.heroBody}>
            Reach the support team with order issues, payment concerns, account questions, or any
            other platform-related problem.
          </Text>
        </View>

        <View style={styles.heroTips}>
          <View style={styles.tipCard}>
            <Text style={styles.tipLabel}>Fast escalation</Text>
            <Text style={styles.tipText}>Use the form for structured complaints and issue details.</Text>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipLabel}>Direct channels</Text>
            <Text style={styles.tipText}>WhatsApp and email remain available when you need instant contact.</Text>
          </View>
        </View>
      </View>

      <AdminCard>
        <Text style={styles.sectionTitle}>Support Form</Text>
        <Field
          label="Your Name"
          value={formData.customerName}
          onChangeText={(value) => updateField("customerName", value)}
          placeholder="Enter your name"
        />
        <Field
          label="Your Email"
          value={formData.email}
          onChangeText={(value) => updateField("email", value)}
          placeholder="Enter your email"
          keyboardType="email-address"
        />
        <Field
          label="Subject"
          value={formData.subject}
          onChangeText={(value) => updateField("subject", value)}
          placeholder="Enter the subject"
        />
        <View style={styles.messageField}>
          <Text style={styles.messageLabel}>Complaint / Message</Text>
          <TextInput
            style={styles.messageInput}
            multiline
            value={formData.message}
            onChangeText={(value) => updateField("message", value)}
            placeholder="Enter your complaint or message"
            textAlignVertical="top"
          />
        </View>
        <AdminButton
          label={submitting ? "Submitting..." : "Submit"}
          onPress={handleSubmit}
          disabled={submitting}
        />
      </AdminCard>

      <AdminCard>
        <Text style={styles.sectionTitle}>Direct Support Channels</Text>
        <Text style={styles.channelText}>
          If you prefer a faster or more conversational route, contact support directly.
        </Text>

        <Pressable style={styles.channelButtonWhatsApp} onPress={openWhatsAppChat}>
          <Text style={styles.channelButtonText}>Chat with Support on WhatsApp</Text>
        </Pressable>

        <Pressable style={styles.channelButtonEmail} onPress={openEmail}>
          <Text style={styles.channelButtonText}>Email Support</Text>
        </Pressable>

        <View style={styles.contactMeta}>
          <Text style={styles.contactText}>WhatsApp: +234 813 507 2306</Text>
          <Text style={styles.contactText}>Email: {SUPPORT_EMAIL}</Text>
        </View>
      </AdminCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
    backgroundColor: "#EEF3F8",
  },
  heroCard: {
    borderRadius: 24,
    padding: 20,
    gap: 18,
    backgroundColor: "#102A43",
  },
  heroTextBlock: {
    gap: 8,
  },
  eyebrow: {
    color: "#93C5FD",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroTitle: {
    color: "#F8FAFC",
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 34,
  },
  heroBody: {
    color: "#D9E2EC",
    lineHeight: 22,
  },
  heroTips: {
    gap: 10,
  },
  tipCard: {
    borderRadius: 18,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    gap: 4,
  },
  tipLabel: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 15,
  },
  tipText: {
    color: "#CBD5E1",
    lineHeight: 19,
  },
  sectionTitle: {
    color: "#102A43",
    fontSize: 18,
    fontWeight: "900",
  },
  messageField: {
    gap: 6,
  },
  messageLabel: {
    color: "#243B53",
    fontWeight: "700",
  },
  messageInput: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#CBD2D9",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
  },
  channelText: {
    color: "#64748B",
    lineHeight: 20,
  },
  channelButtonWhatsApp: {
    backgroundColor: "#16A34A",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  channelButtonEmail: {
    backgroundColor: "#2563EB",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  channelButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  contactMeta: {
    gap: 4,
  },
  contactText: {
    color: "#475569",
    fontWeight: "700",
  },
});
