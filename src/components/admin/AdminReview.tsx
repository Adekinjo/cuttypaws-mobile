import { Alert } from "react-native";
import { useEffect, useState } from "react";
import ReviewService from "../../api/ReviewService";
import { AdminButton, AdminCard, AdminScreen, EmptyState, LoadingState, Row } from "./AdminCommon";

export default function AdminReview() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const response = await ReviewService.getAllReviews();
      setReviews(response.reviewList || response.reviews || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <AdminScreen title="Reviews" subtitle="Manage product reviews">
      {loading ? <LoadingState label="Loading reviews..." /> : null}
      {!loading && reviews.length === 0 ? <EmptyState label="No reviews found." /> : null}
      {!loading &&
        reviews.map((review) => (
          <AdminCard key={review.id}>
            <Row label="Product" value={review.productName || review.product?.name} />
            <Row label="Reviewer" value={review.userName || review.user?.name} />
            <Row label="Rating" value={review.rating} />
            <Row label="Comment" value={review.comment} />
            <AdminButton
              label="Delete Review"
              variant="danger"
              onPress={() =>
                Alert.alert("Delete review", "Delete this review?", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                      await ReviewService.deleteReview(review.id);
                      load();
                    },
                  },
                ])
              }
            />
          </AdminCard>
        ))}
    </AdminScreen>
  );
}
