import { useEffect, useState } from "react";
import ApiService from "../../service/ApiService";
import { useNavigate } from "react-router-dom";
import "../../style/AdminReviewPage.css"; // Add CSS for styling

const SupportReviewsPage = () => {
  const [reviews, setReviews] = useState([]); // State to store reviews
  const [loading, setLoading] = useState(true); // State to manage loading state
  const [error, setError] = useState(null); // State to handle errors
  const navigate = useNavigate();

  // Fetch all reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await ApiService.getAllReviews(); // Fetch all reviews
        setReviews(response);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        setError("Failed to load reviews. Please try again later.");
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  // Handle delete review
  const handleDeleteReview = async(id) => {
        const confirmed = window.confirm("Are you sure you want to delete this review")
        if(confirmed){
            try{
                await ApiService.deleteReview(id);
                fetchProduct();
            }catch(error){
                setError(error.response?.data?.message || error.message || "unable to fetch review")
            }
        }
        
    }

  // Handle edit review (navigate to edit page)
  const handleEditReview = (reviewId) => {
    navigate(`/admin/reviews/edit/${reviewId}`); // Navigate to edit page
  };

  if (loading) {
    return <p>Loading reviews...</p>;
  }

  if (error) {
    return <p className="error-message">{error}</p>;
  }

  return (
    <div className="admin-reviews-page">
      <h1>Admin Reviews Management</h1>
      <table className="reviews-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Product ID</th>
            <th>User Name</th>
            <th>Rating</th>
            <th>Comment</th>
            <th>Timestamp</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((review) => (
            <tr key={review.id}>
              <td>{review.id}</td>
              <td>{review.productId}</td>
              <td>{review.userName}</td>
              <td>{review.rating}</td>
              <td>{review.comment}</td>
              <td>{new Date(review.timestamp).toLocaleString()}</td>
              <td>
                <button
                  className="edit-button"
                  onClick={() => handleEditReview(review.id)}
                >
                  Edit
                </button>
                <button
                  className="delete-button"
                  onClick={() => handleDeleteReview(review.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SupportReviewsPage;