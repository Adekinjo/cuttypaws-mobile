import { useNavigate } from "react-router-dom";
import '../../style/Admin.css'


const AdminPage = () => {
    const navigate = useNavigate();

    return(
        <div className="admin-page">
            <h1>Welcome Admin Support</h1>
            <button onClick={()=> navigate("/support/orders")}>Manage Orders</button>
            <button onClick={()=> navigate("/support/customer-view-complaines")}>Customer Support</button>
            <button onClick={()=> navigate("/support/reviews")}>Customer Review</button>
        </div>
    );
};
export default AdminPage;