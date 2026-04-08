
import { useState, useEffect } from "react";
import ApiService from "../../service/ApiService";
import { useNavigate } from "react-router-dom";
import Pagination from "../common/Pagination";
import '../../style/AdminOrder.css';

const OrderStatus = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"];

const SupportOrder = () => {
  const [orders, setOrders] = useState([]);
  const [filterOrders, setFilterOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();
  const itemsPerPage = 10;

  // Fetch orders when status or page changes
  useEffect(() => {
    fetchOrders();
  }, [searchStatus, currentPage]);

  const fetchOrders = async () => {
    let response;
    try {
      if (searchStatus) {
        // Fetch orders filtered by searchStatus
        response = await ApiService.getOrderItemByStatus(searchStatus);
      } else {
        // Fetch all orders if no status is selected
        response = await ApiService.getAllOrders();
      }

      const orderList = response.orderItemList || [];

      setTotalPages(Math.ceil(orderList.length / itemsPerPage));
      setOrders(orderList);
      // Slice orders for pagination
      setFilterOrders(orderList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage));
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || "Unable to fetch orders");
      setTimeout(() => {
        setMessage('');
      }, 3000);
    }
  };

  // Handle the search filter change
  const handleSearchStatusChange = (e) => {
    setSearchStatus(e.target.value);
    setCurrentPage(1); // Reset to the first page
  };

  // Handle the filter by status (this is for the dropdown filter)
  const handleFilter = (e) => {
    const filterValue = e.target.value;
    setStatusFilter(filterValue);
    setCurrentPage(1); // Reset to the first page

    if (filterValue) {
      const filtered = orders.filter(order => order.status === filterValue);
      setFilterOrders(filtered.slice(0, itemsPerPage));
      setTotalPages(Math.ceil(filtered.length / itemsPerPage));
    } else {
      // No filter applied, show all orders
      setFilterOrders(orders.slice(0, itemsPerPage));
      setTotalPages(Math.ceil(orders.length / itemsPerPage));
    }
  };

  // Handle viewing order details
  const handleOrderDetails = (id) => {
    navigate(`/admin/order-details/${id}`);
  };

  return (
    <div className="admin-orders">
      <h2>Orders</h2>
      {message && <p className="message">{message}</p>}
      <div className="filter-container">
        <div className="filter-status">
          <label>Filter By Status</label>
          <select value={statusFilter} onChange={handleFilter}>
            <option value="">All</option>
            {OrderStatus.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
        <div className="search-status">
          <label>Search By Status</label>
          <select value={searchStatus} onChange={handleSearchStatusChange}>
            <option value="">All</option>
            {OrderStatus.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>
      <table className="order-table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Customer</th>
            <th>Status</th>
            <th>Price</th>
            <th>Date Ordered</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filterOrders.map(order => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.user.name}</td>
              <td>{order.status}</td>
              <td>{order.price.toFixed(2)}</td>
              <td>{new Date(order.createdAt).toLocaleDateString()}</td>
              <td>
                <button onClick={() => handleOrderDetails(order.id)}>Details</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={(page) => setCurrentPage(page)} />
    </div>
  );
};

export default SupportOrder;
