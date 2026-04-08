import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import AuthService from "../../api/AuthService";
import { AdminButton, AdminCard, Banner, Field } from "../admin/AdminCommon";

type AddressForm = {
  street: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
};

const initialAddress: AddressForm = {
  street: "",
  city: "",
  state: "",
  zipcode: "",
  country: "",
};

export default function AddressPage({
  mode = "add",
  onSaved,
  onBack,
}: {
  mode?: "add" | "edit";
  onSaved?: () => void;
  onBack?: () => void;
}) {
  const [address, setAddress] = useState<AddressForm>(initialAddress);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchUserInfo = async () => {
      if (mode !== "edit") {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await AuthService.getLoggedInInfo();
        const userAddress = response?.user?.address;
        if (!mounted || !userAddress) return;

        setAddress({
          street: userAddress.street || "",
          city: userAddress.city || "",
          state: userAddress.state || "",
          zipcode: userAddress.zipcode || "",
          country: userAddress.country || "",
        });
      } catch (error: any) {
        if (!mounted) return;
        setMessage(
          error?.response?.data?.message ||
            error?.message ||
            "Unable to fetch saved address."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchUserInfo();

    return () => {
      mounted = false;
    };
  }, [mode]);

  const updateField = (field: keyof AddressForm, value: string) => {
    setAddress((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setMessage("");

    const requiredFields = Object.entries(address).filter(([, value]) => !value.trim());
    if (requiredFields.length > 0) {
      setMessage("Please complete all address fields.");
      return;
    }

    try {
      setSaving(true);
      await AuthService.saveAddress({
        street: address.street.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        zipcode: address.zipcode.trim(),
        country: address.country.trim(),
      });
      setMessage(mode === "edit" ? "Address updated successfully." : "Address saved successfully.");
      onSaved?.();
    } catch (error: any) {
      setMessage(
        error?.response?.data?.message || error?.message || "Failed to save address."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Banner
        message={message}
        tone={message.includes("successfully") ? "success" : "error"}
      />

      <View style={styles.heroCard}>
        <View style={styles.heroTextBlock}>
          <Text style={styles.eyebrow}>{mode === "edit" ? "Edit Address" : "Add Address"}</Text>
          <Text style={styles.heroTitle}>
            {mode === "edit" ? "Keep delivery details current" : "Set up your delivery address"}
          </Text>
          <Text style={styles.heroBody}>
            Your saved address helps checkout move faster and keeps deliveries pointed to the right
            location.
          </Text>
        </View>

        <View style={styles.heroTips}>
          <View style={styles.tipCard}>
            <Text style={styles.tipLabel}>Faster checkout</Text>
            <Text style={styles.tipText}>Reuse saved address data when placing orders.</Text>
          </View>
          <View style={styles.tipCard}>
            <Text style={styles.tipLabel}>Better delivery accuracy</Text>
            <Text style={styles.tipText}>Keep city, state, and zip code precise and current.</Text>
          </View>
        </View>
      </View>

      <AdminCard>
        <Text style={styles.sectionTitle}>Address Details</Text>
        <Field
          label="Street"
          value={address.street}
          onChangeText={(value: string) => updateField("street", value)}
          placeholder="Enter street address"
        />
        <Field
          label="City"
          value={address.city}
          onChangeText={(value: string) => updateField("city", value)}
          placeholder="Enter city"
        />
        <Field
          label="State"
          value={address.state}
          onChangeText={(value: string) => updateField("state", value)}
          placeholder="Enter state"
        />
        <Field
          label="Zip Code"
          value={address.zipcode}
          onChangeText={(value: string) => updateField("zipcode", value)}
          placeholder="Enter zip code"
        />
        <Field
          label="Country"
          value={address.country}
          onChangeText={(value: string) => updateField("country", value)}
          placeholder="Enter country"
        />
      </AdminCard>

      <AdminCard>
        <Text style={styles.sectionTitle}>Review</Text>
        <Text style={styles.reviewText}>
          Double-check the address before saving so future deliveries and checkout flows use the
          right destination.
        </Text>
        <View style={styles.actionStack}>
          <AdminButton
            label={
              saving
                ? mode === "edit"
                  ? "Updating Address..."
                  : "Saving Address..."
                : mode === "edit"
                  ? "Update Address"
                  : "Save Address"
            }
            onPress={handleSubmit}
            disabled={saving || loading}
          />
          <AdminButton label="Back" variant="secondary" onPress={onBack} />
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
  reviewText: {
    color: "#64748B",
    lineHeight: 20,
  },
  actionStack: {
    gap: 10,
  },
});
