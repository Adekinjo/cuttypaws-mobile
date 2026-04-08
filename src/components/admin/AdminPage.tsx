import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useCallback, useMemo, useState } from "react";

import AdminPendingServicesPage from "../service-provider/AdminPendingServicesPage";
import SecurityDashboard from "../security/SecurityDashboard";
import SecurityMonitoring from "../security/SecurityMonitoring";
import AddCategory from "./AddCategory";
import AddProduct from "./AddProduct";
import AdminAllUsers from "./AdminAllUsers";
import AdminCategory from "./AdminCategory";
import { AdminCard, AdminScreen, adminStyles } from "./AdminCommon";
import AdminDeals from "./AdminDeals";
import AdminOrder from "./AdminOrder";
import AdminOrderDetails from "./AdminOrderDetails";
import AdminProduct from "./AdminProduct";
import AdminReview from "./AdminReview";
import AdminServiceBookingReports from "./AdminServiceBookingReports";
import AdminSubCategories from "./AdminSubCategories";
import AdminSupportPage from "./AdminSupportPage";
import CacheController from "./CacheController";
import EditCategory from "./EditCategory";
import EditProduct from "./EditProduct";
import EditSubcategory from "./EditSubcategory";

import { Pressable, Text, View } from "react-native";
import { useTheme } from "../context/ThemeContext";

type AdminRoute =
  | "dashboard"
  | "security-dashboard"
  | "security-monitoring"
  | "categories"
  | "add-category"
  | "edit-category"
  | "subcategories"
  | "edit-subcategory"
  | "products"
  | "add-product"
  | "edit-product"
  | "orders"
  | "order-details"
  | "support"
  | "reviews"
  | "all-users"
  | "deals-management"
  | "cache-management"
  | "service-approvals"
  | "service-booking-reports";

type ImageFile = {
  uri: string;
  name: string;
  type: string;
};

const adminCards: {
  title: string;
  route: AdminRoute;
  color: string;
  icon: {
    family: "feather" | "material";
    name: string;
  };
}[] = [
  {
    title: "Security Dashboard",
    route: "security-dashboard",
    color: "#dc3545",
    icon: { family: "material", name: "shield-alert-outline" },
  },
  {
    title: "Security Monitoring",
    route: "security-monitoring",
    color: "#28a745",
    icon: { family: "feather", name: "activity" },
  },
  {
    title: "Manage Categories",
    route: "categories",
    color: "#4CAF50",
    icon: { family: "feather", name: "grid" },
  },
  {
    title: "Manage Subcategories",
    route: "subcategories",
    color: "#2196F3",
    icon: { family: "material", name: "shape-outline" },
  },
  {
    title: "Manage Products",
    route: "products",
    color: "#2196F3",
    icon: { family: "feather", name: "package" },
  },
  {
    title: "Manage Orders",
    route: "orders",
    color: "#FF9800",
    icon: { family: "feather", name: "shopping-bag" },
  },
  {
    title: "Customer Support",
    route: "support",
    color: "#9C27B0",
    icon: { family: "feather", name: "help-circle" },
  },
  {
    title: "Customer Reviews",
    route: "reviews",
    color: "#FFEB3B",
    icon: { family: "feather", name: "star" },
  },
  {
    title: "All Users",
    route: "all-users",
    color: "#E91E63",
    icon: { family: "feather", name: "users" },
  },
  {
    title: "Deals Management",
    route: "deals-management",
    color: "#00BCD4",
    icon: { family: "feather", name: "percent" },
  },
  {
    title: "Redis Cache Management",
    route: "cache-management",
    color: "#A52A2A",
    icon: { family: "material", name: "database-cog-outline" },
  },
  {
    title: "Service Approvals",
    route: "service-approvals",
    color: "#0f172a",
    icon: { family: "material", name: "account-check-outline" },
  },
  {
    title: "Service Reports",
    route: "service-booking-reports",
    color: "#ef4444",
    icon: { family: "material", name: "file-document-alert-outline" },
  },
];

export default function AdminPage() {
  const { colors, isDark } = useTheme();
  const [route, setRoute] = useState<AdminRoute>("dashboard");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedOrderItemId, setSelectedOrderItemId] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<ImageFile | null>(null);
  const [productFormData, setProductFormData] = useState<FormData>(new FormData());

  const resetCategorySelection = useCallback(() => {
    setSelectedCategoryId("");
    setSelectedSubCategoryId("");
    setSelectedImage(null);
  }, []);

  const goToDashboard = useCallback(() => {
    setRoute("dashboard");
  }, []);

  const pickImage = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== "granted") {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.9,
    });

    if (result.canceled || !result.assets.length) {
      return;
    }

    const asset = result.assets[0];
    setSelectedImage({
      uri: asset.uri,
      name: asset.fileName || `admin-image-${Date.now()}.jpg`,
      type: asset.mimeType || "image/jpeg",
    });
  }, []);

  const buildProductPayload = useCallback(async (product: any) => {
    const formData = new FormData();

    Object.entries(product || {}).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (typeof value === "object") return;
      formData.append(key, String(value));
    });

    return formData;
  }, []);

  const renderedScreen = useMemo(() => {
    switch (route) {
      case "security-dashboard":
        return <SecurityDashboard onNavigate={(next) => (next === "back" ? goToDashboard() : undefined)} />;

      case "security-monitoring":
        return <SecurityMonitoring onNavigate={(next) => (next === "back" ? goToDashboard() : undefined)} />;

      case "categories":
        return (
          <AdminCategory
            onAddCategory={() => {
              resetCategorySelection();
              setRoute("add-category");
            }}
            onEditCategory={(id) => {
              setSelectedCategoryId(String(id));
              setSelectedImage(null);
              setRoute("edit-category");
            }}
            onEditSubCategory={(id) => {
              setSelectedSubCategoryId(String(id));
              setSelectedImage(null);
              setRoute("edit-subcategory");
            }}
          />
        );

      case "add-category":
        return (
          <AddCategory
            selectedImage={selectedImage}
            onPickImage={pickImage}
            onBack={() => setRoute("categories")}
            onSuccess={() => {
              resetCategorySelection();
              setRoute("categories");
            }}
          />
        );

      case "edit-category":
        return selectedCategoryId ? (
          <EditCategory
            categoryId={selectedCategoryId}
            selectedImage={selectedImage}
            onPickImage={pickImage}
            onBack={() => setRoute("categories")}
            onSuccess={() => {
              resetCategorySelection();
              setRoute("categories");
            }}
          />
        ) : (
          <AdminCategory onAddCategory={() => setRoute("add-category")} />
        );

      case "subcategories":
        return (
          <AdminSubCategories
            onBack={goToDashboard}
            onEditSubCategory={(id) => {
              setSelectedSubCategoryId(String(id));
              setSelectedImage(null);
              setRoute("edit-subcategory");
            }}
          />
        );

      case "edit-subcategory":
        return selectedSubCategoryId ? (
          <EditSubcategory
            subCategoryId={selectedSubCategoryId}
            selectedImage={selectedImage}
            onPickImage={pickImage}
            onBack={() => setRoute("subcategories")}
            onSuccess={() => {
              setSelectedSubCategoryId("");
              setSelectedImage(null);
              setRoute("subcategories");
            }}
          />
        ) : (
          <AdminSubCategories onBack={goToDashboard} />
        );

      case "products":
        return (
          <AdminProduct
            onAdd={() => {
              setProductFormData(new FormData());
              setRoute("add-product");
            }}
            onEdit={(productId) => {
              setSelectedProductId(String(productId));
              setRoute("edit-product");
            }}
          />
        );

      case "add-product":
        return (
          <AddProduct
            formData={productFormData}
            setFormData={(builder) => setProductFormData(builder())}
            onBack={() => setRoute("products")}
            onSuccess={() => setRoute("products")}
          />
        );

      case "edit-product":
        return selectedProductId ? (
          <EditProduct
            productId={selectedProductId}
            onBack={() => setRoute("products")}
            onSubmit={buildProductPayload}
          />
        ) : (
          <AdminProduct onAdd={() => setRoute("add-product")} />
        );

      case "orders":
        return (
          <AdminOrder
            onOpenOrder={(itemId) => {
              setSelectedOrderItemId(String(itemId));
              setRoute("order-details");
            }}
          />
        );

      case "order-details":
        return selectedOrderItemId ? <AdminOrderDetails itemId={selectedOrderItemId} /> : <AdminOrder />;

      case "support":
        return <AdminSupportPage inquiries={[]} />;

      case "reviews":
        return <AdminReview />;

      case "all-users":
        return <AdminAllUsers />;

      case "deals-management":
        return <AdminDeals />;

      case "cache-management":
        return <CacheController />;

      case "service-approvals":
        return <AdminPendingServicesPage />;

      case "service-booking-reports":
        return <AdminServiceBookingReports />;

      case "dashboard":
      default:
        return (
          <AdminScreen title="Admin Dashboard" subtitle="Manage your platform">
            {adminCards.map((card) => (
              <Pressable key={card.route} onPress={() => setRoute(card.route)}>
                <AdminCard>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: `${card.color}22`,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {card.icon.family === "feather" ? (
                      <Feather
                        name={card.icon.name as keyof typeof Feather.glyphMap}
                        size={20}
                        color={card.color}
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name={card.icon.name as keyof typeof MaterialCommunityIcons.glyphMap}
                        size={20}
                        color={card.color}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      adminStyles.title,
                      {
                        color: colors.text,
                        fontSize: 15,
                        lineHeight: 20,
                      },
                    ]}
                  >
                    {card.title}
                  </Text>
                  <Text
                    style={[
                      adminStyles.subtitle,
                      {
                        color: isDark ? colors.textMuted : colors.textSoft,
                        fontSize: 12,
                        textTransform: "capitalize",
                      },
                    ]}
                  >
                    {card.route.replace(/-/g, " ")}
                  </Text>
                </AdminCard>
              </Pressable>
            ))}
          </AdminScreen>
        );
    }
  }, [
    buildProductPayload,
    colors.text,
    colors.textMuted,
    colors.textSoft,
    goToDashboard,
    isDark,
    pickImage,
    productFormData,
    resetCategorySelection,
    route,
    selectedCategoryId,
    selectedImage,
    selectedOrderItemId,
    selectedProductId,
    selectedSubCategoryId,
  ]);

  return renderedScreen;
}
