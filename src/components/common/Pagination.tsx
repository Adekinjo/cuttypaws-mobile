import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

function buildVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  return Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = buildVisiblePages(currentPage, totalPages);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Pages</Text>
          <Text style={styles.subtitle}>
            Page {currentPage} of {totalPages}
          </Text>
        </View>
        <View style={styles.summaryChip}>
          <Text style={styles.summaryChipText}>{totalPages} total</Text>
        </View>
      </View>

      <View style={styles.controlRow}>
        <Pressable
          onPress={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          style={[styles.navButton, currentPage === 1 && styles.navButtonDisabled]}
        >
          <Text style={[styles.navButtonText, currentPage === 1 && styles.navButtonTextDisabled]}>
            Previous
          </Text>
        </Pressable>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pageRow}
        >
          {pages.map((page, index) => {
            const previousPage = pages[index - 1];
            const showGap = index > 0 && page - previousPage > 1;

            return (
              <View key={page} style={styles.pageWithGap}>
                {showGap ? <Text style={styles.gapText}>...</Text> : null}
                <Pressable
                  onPress={() => onPageChange(page)}
                  style={[styles.pageButton, page === currentPage && styles.pageButtonActive]}
                >
                  <Text
                    style={[
                      styles.pageButtonText,
                      page === currentPage && styles.pageButtonTextActive,
                    ]}
                  >
                    {page}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>

        <Pressable
          onPress={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          style={[
            styles.navButton,
            currentPage === totalPages && styles.navButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.navButtonText,
              currentPage === totalPages && styles.navButtonTextDisabled,
            ]}
          >
            Next
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: "#102A43",
    fontSize: 17,
    fontWeight: "900",
  },
  subtitle: {
    color: "#64748B",
  },
  summaryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#E0F2FE",
  },
  summaryChipText: {
    color: "#0F172A",
    fontWeight: "800",
    fontSize: 12,
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  navButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#102A43",
  },
  navButtonDisabled: {
    backgroundColor: "#E2E8F0",
  },
  navButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
  navButtonTextDisabled: {
    color: "#94A3B8",
  },
  pageRow: {
    gap: 8,
    alignItems: "center",
  },
  pageWithGap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  gapText: {
    color: "#64748B",
    fontWeight: "700",
  },
  pageButton: {
    minWidth: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  pageButtonActive: {
    backgroundColor: "#2563EB",
    borderColor: "#2563EB",
  },
  pageButtonText: {
    color: "#102A43",
    fontWeight: "800",
  },
  pageButtonTextActive: {
    color: "#FFFFFF",
  },
});
