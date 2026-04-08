import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

const faqs = [
  {
    question: "How long does shipping take?",
    answer: "Shipping usually takes 3-5 business days within the US.",
    group: "Orders",
  },
  {
    question: "What is your return policy?",
    answer: "You can return products within 30 days of purchase for a full refund.",
    group: "Orders",
  },
  {
    question: "Do you offer international shipping?",
    answer: "Yes, we ship to most countries. International shipping takes 7-14 business days.",
    group: "Orders",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept credit/debit cards, PayPal, and Apple Pay.",
    group: "Payments",
  },
  {
    question: "How can I track my order?",
    answer: "Once your order is shipped, you will receive a tracking number via email.",
    group: "Orders",
  },
  {
    question: "Can I cancel my order after it has been placed?",
    answer:
      "Yes, you can cancel your order within 24 hours of placing it. After that, the order will be processed for shipping.",
    group: "Orders",
  },
  {
    question: "Do you offer discounts or promotions?",
    answer:
      "Yes, we regularly offer discounts and promotions. Subscribe to our newsletter to stay updated.",
    group: "Promotions",
  },
  {
    question: "How do I create an account?",
    answer: "Tap the sign up entry point and complete the registration form with your details.",
    group: "Account",
  },
  {
    question: "What should I do if I forget my password?",
    answer: "Use the forgot password flow on the login screen and follow the reset steps.",
    group: "Account",
  },
  {
    question: "Are my payment details secure?",
    answer: "Yes, encrypted payment processing is used to protect your checkout details.",
    group: "Payments",
  },
  {
    question: "Do you offer gift wrapping?",
    answer: "Yes, gift wrapping is available for an additional fee during checkout.",
    group: "Orders",
  },
  {
    question: "Can I change my shipping address after placing an order?",
    answer:
      "Yes, you can change your shipping address within 24 hours of placing the order by contacting support.",
    group: "Orders",
  },
  {
    question: "What is your warranty policy?",
    answer:
      "We offer a 1-year warranty on supported products. Review the warranty details that came with your purchase.",
    group: "Support",
  },
  {
    question: "How do I contact customer support?",
    answer: "You can reach support by email, phone, or the customer support section in the app.",
    group: "Support",
  },
  {
    question: "Do you have a physical store?",
    answer: "Yes, physical location details and visiting hours are shared in our support channels.",
    group: "Support",
  },
];

const groups = ["All", "Orders", "Payments", "Account", "Promotions", "Support"];

export default function FaqPage({
  onOpenSupport,
}: {
  onOpenSupport?: () => void;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(0);
  const [search, setSearch] = useState("");
  const [activeGroup, setActiveGroup] = useState("All");

  const filteredFaqs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return faqs.filter((faq) => {
      const matchesGroup = activeGroup === "All" || faq.group === activeGroup;
      const matchesQuery =
        !query ||
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.group.toLowerCase().includes(query);

      return matchesGroup && matchesQuery;
    });
  }, [activeGroup, search]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>Help Center</Text>
        </View>
        <Text style={styles.heroTitle}>Frequently asked questions</Text>
        <Text style={styles.heroBody}>
          The web page was a simple accordion. This mobile version keeps the same answers, but adds
          search, category filters, and a clearer support handoff.
        </Text>

        <View style={styles.heroStats}>
          <StatCard label="Questions" value={String(faqs.length)} />
          <StatCard label="Topics" value="5" />
          <StatCard label="Support Ready" value="24/7" />
        </View>
      </View>

      <View style={styles.searchCard}>
        <Text style={styles.sectionTitle}>Find an answer faster</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search shipping, payments, returns..."
          placeholderTextColor="#94A3B8"
          style={styles.searchInput}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupRow}>
          {groups.map((group) => {
            const selected = activeGroup === group;
            return (
              <Pressable
                key={group}
                onPress={() => setActiveGroup(group)}
                style={[styles.groupChip, selected && styles.groupChipActive]}
              >
                <Text style={[styles.groupChipText, selected && styles.groupChipTextActive]}>
                  {group}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.listCard}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Answers</Text>
          <Text style={styles.listMeta}>{filteredFaqs.length} result(s)</Text>
        </View>

        {filteredFaqs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No matching question found</Text>
            <Text style={styles.emptyBody}>
              Try a different keyword or go straight to support for help with your issue.
            </Text>
            <Pressable style={styles.supportButton} onPress={onOpenSupport}>
              <Text style={styles.supportButtonText}>Contact Support</Text>
            </Pressable>
          </View>
        ) : (
          filteredFaqs.map((faq, index) => {
            const isActive = activeIndex === index;
            return (
              <View key={`${faq.question}-${index}`} style={styles.faqCard}>
                <Pressable
                  onPress={() => setActiveIndex(isActive ? null : index)}
                  style={styles.questionRow}
                >
                  <View style={styles.questionCopy}>
                    <Text style={styles.groupLabel}>{faq.group}</Text>
                    <Text style={styles.questionText}>{faq.question}</Text>
                  </View>
                  <View style={[styles.iconWrap, isActive && styles.iconWrapActive]}>
                    <Text style={[styles.iconText, isActive && styles.iconTextActive]}>
                      {isActive ? "−" : "+"}
                    </Text>
                  </View>
                </Pressable>

                {isActive ? (
                  <View style={styles.answerWrap}>
                    <Text style={styles.answerText}>{faq.answer}</Text>
                  </View>
                ) : null}
              </View>
            );
          })
        )}
      </View>

      <View style={styles.supportCard}>
        <Text style={styles.supportEyebrow}>Still need help?</Text>
        <Text style={styles.supportTitle}>Move from self-service to real support</Text>
        <Text style={styles.supportBody}>
          If the answer is not here, use the support flow for order issues, account access, or
          delivery questions that need direct attention.
        </Text>
        <Pressable style={styles.supportButton} onPress={onOpenSupport}>
          <Text style={styles.supportButtonText}>Open Customer Support</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
    backgroundColor: "#EEF3F8",
  },
  heroCard: {
    borderRadius: 28,
    padding: 22,
    gap: 16,
    backgroundColor: "#0F172A",
  },
  heroBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  heroBadgeText: {
    color: "#93C5FD",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: "#F8FAFC",
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
  },
  heroBody: {
    color: "#CBD5E1",
    fontSize: 15,
    lineHeight: 22,
  },
  heroStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: 96,
    borderRadius: 18,
    padding: 14,
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
  },
  statLabel: {
    color: "#BFDBFE",
    fontSize: 12,
    fontWeight: "700",
  },
  searchCard: {
    borderRadius: 24,
    padding: 18,
    gap: 14,
    backgroundColor: "#FFFFFF",
    shadowColor: "#102A43",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  sectionTitle: {
    color: "#102A43",
    fontSize: 20,
    fontWeight: "800",
  },
  searchInput: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D9E2EC",
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#F8FAFC",
    color: "#102A43",
  },
  groupRow: {
    gap: 10,
    paddingRight: 12,
  },
  groupChip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#E2E8F0",
  },
  groupChipActive: {
    backgroundColor: "#1D4ED8",
  },
  groupChipText: {
    color: "#334155",
    fontWeight: "700",
  },
  groupChipTextActive: {
    color: "#FFFFFF",
  },
  listCard: {
    borderRadius: 24,
    padding: 18,
    gap: 12,
    backgroundColor: "#FFFFFF",
    shadowColor: "#102A43",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  listTitle: {
    color: "#102A43",
    fontSize: 20,
    fontWeight: "900",
  },
  listMeta: {
    color: "#64748B",
    fontWeight: "700",
  },
  faqCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    overflow: "hidden",
  },
  questionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    padding: 16,
  },
  questionCopy: {
    flex: 1,
    gap: 6,
  },
  groupLabel: {
    color: "#2563EB",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  questionText: {
    color: "#102A43",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E2E8F0",
  },
  iconWrapActive: {
    backgroundColor: "#DBEAFE",
  },
  iconText: {
    color: "#475569",
    fontSize: 18,
    fontWeight: "900",
  },
  iconTextActive: {
    color: "#1D4ED8",
  },
  answerWrap: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  answerText: {
    color: "#52606D",
    lineHeight: 22,
  },
  emptyState: {
    paddingVertical: 28,
    gap: 10,
    alignItems: "center",
  },
  emptyTitle: {
    color: "#102A43",
    fontSize: 18,
    fontWeight: "800",
  },
  emptyBody: {
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
  },
  supportCard: {
    borderRadius: 24,
    padding: 20,
    gap: 10,
    backgroundColor: "#DBEAFE",
  },
  supportEyebrow: {
    color: "#1D4ED8",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  supportTitle: {
    color: "#102A43",
    fontSize: 24,
    fontWeight: "900",
    lineHeight: 30,
  },
  supportBody: {
    color: "#334155",
    lineHeight: 22,
  },
  supportButton: {
    alignSelf: "flex-start",
    marginTop: 4,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#102A43",
  },
  supportButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});
