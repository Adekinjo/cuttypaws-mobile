import { useEffect, useState } from "react";
import ApiService from "../../service/ApiService";
import '../../style/AdminSupport.css';

const AdminSupportPage = () => {
  const [inquiries, setInquiries] = useState([]);

  // Fetch all inquiries when the component mounts
  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        const response = await ApiService.getAllInquiries();
        setInquiries(response);
      } catch (error) {
        console.error("Error fetching inquiries:", error);
      }
    };
    fetchInquiries();
  }, []);

  // Handle status change for a specific inquiry
  const handleStatusChange = async (id, status) => {
    try {
      const updatedInquiry = await ApiService.updateComplaintStatus(id, status);
      setInquiries((prevInquiries) =>
        prevInquiries.map((inquiry) =>
          inquiry.id === id ? updatedInquiry : inquiry
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  // Handle deletion of a specific inquiry
  const handleDeleteInquiry = async (id) => {
    try {
      await ApiService.deleteInquiry(id);
      setInquiries((prevInquiries) =>
        prevInquiries.filter((inquiry) => inquiry.id !== id)
      );
    } catch (error) {
      console.error("Error deleting inquiry:", error);
    }
  };

  return (
    <div className="inquiries-page">
      <h1 className="page-title">Customer Support Inquiries</h1>
      <div className="inquiries-list">
        {inquiries.length === 0 ? (
          <p>No inquiries found.</p>
        ) : (
          inquiries.map((inquiry) => (
            <div className="inquiry-item" key={inquiry.id}>
              <h3 className="inquiry-subject">{inquiry.subject}</h3>
              <p className="inquiry-message">{inquiry.message}</p>
              <div className="inquiry-details">
                <p><strong>By:</strong> {inquiry.customerName}</p>
                <p><strong>Email:</strong> {inquiry.email}</p>
                <p><strong>Status:</strong> {inquiry.status}</p>
              </div>
              <div className="inquiry-actions">
                {/* Dropdown to update the status */}
                <select
                  value={inquiry.status || "PENDING"} // Ensure value is never null
                  onChange={(e) => handleStatusChange(inquiry.id, e.target.value)}
                >
                  <option value="CREATED">Created</option>
                  <option value="PENDING">Pending</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
                {/* Button to delete the inquiry */}
                <button onClick={() => handleDeleteInquiry(inquiry.id)}>Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminSupportPage;