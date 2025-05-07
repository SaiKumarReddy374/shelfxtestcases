import React, { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import {
  Tabs,
  Tab,
  Box,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import axios from "axios";

const AdminDashboard = () => {
  const [sellers, setSellers] = useState([]);
  const [buyers, setBuyers] = useState([]); // New state for buyers
  const [subs, setSubs] = useState([]);
  const [booksUploaded, setBooksUploaded] = useState(0);
  const [sellCount,setSellCount] = useState(0);
  const [buyCount, setBuyCount] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [editSeller, setEditSeller] = useState(null);
  const [editBuyer, setEditBuyer] = useState(null); // Add this state
  const [open, setOpen] = useState(false);

  // Fetch sellers and buyers from the database
  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const response = await axios.get("http://localhost:5000/sellers");
        setSellers(response.data);
      } catch (err) {
        console.error("Error fetching sellers:", err);
      }
    };

    const fetchBuyers = async () => {
      try {
        const response = await axios.get("http://localhost:5000/buyers");
        setBuyers(response.data);
      } catch (err) {
        console.error("Error fetching buyers:", err);
      }
    };

    const fetchBooksCount = async () => {
      try {
        const response = await axios.get("http://localhost:5000/books/count");
        setBooksUploaded(response.data.count);
      } catch (err) {
        console.error("Error fetching books count:", err);
      }
    };

    const getCountSellers = async () => {
      try {
        const response = await axios.get("http://localhost:5000/countSellers");
        setSellCount(response.data.count);
      } catch (err) {
        console.error("Error fetching books count:", err);
      }
    };

    const getCountBuyers = async () => {
      try {
        const response = await axios.get("http://localhost:5000/countBuyers");
        setBuyCount(response.data.count);
      } catch (err) {
        console.error("Error fetching books count:", err);
      }
    };


    const fetchSubscriptions = async () => {
      try {
        const response = await axios.get("http://localhost:5000/subscription");
        setSubs(response.data);
      } catch (err) {
        console.error("Error fetching books count:", err);
      }
    };

    fetchSellers();
    fetchSubscriptions();
    getCountBuyers();
    getCountSellers();
    fetchBuyers(); // Fetch buyers as well
    fetchBooksCount();
  }, []);

  // Data for Pie Chart
  const userData = [
    {
      name: "Sellers",
      value: parseInt(sellCount),
    },
    {
      name: "Buyers",
      value: parseInt(buyCount),
    },
  ];

  const COLORS = ["#0088FE", "#00C49F"];

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleEditClick = (person, type) => {
    if (type === 'seller') {
      setEditSeller(person);
    } else if (type === 'buyer') {
      setEditBuyer(person);
    }
    setOpen(true);
  };
  

  const handleDeleteClickSeller = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/sellers/${id}`);
      setSellers(sellers.filter((seller) => seller.id !== id));
    } catch (err) {
      console.error("Error deleting seller:", err);
    }
  };

  const handleDeleteClickBuyer = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/buyers/${id}`);
      setBuyers(buyers.filter((buyer) => buyer.id !== id));
    } catch (err) {
      console.error("Error deleting seller:", err);
    }
  };

  const handleSaveSeller = async () => {
    try {
      await axios.put(
        `http://localhost:5000/sellers/${editSeller.id}`,
        editSeller
      );
      setSellers(
        sellers.map((seller) =>
          seller.id === editSeller.id ? editSeller : seller
        )
      );
      setOpen(false);
      setEditSeller(null);
    } catch (err) {
      console.error("Error saving seller:", err);
    }
  };

  const handleSaveBuyer = async () => {
    try {
      await axios.put(
        `http://localhost:5000/buyers/${editBuyer.id}`,
        editBuyer
      );
      setBuyers(
        buyers.map((buyer) =>
          buyer.id === editBuyer.id ? editBuyer : buyer
        )
      );
      setOpen(false);
      setEditSeller(null);
    } catch (err) {
      console.error("Error saving seller:", err);
    }
  };


  return (
    <>
      <h2 className="text-2xl tracking-tight font-extrabold mb-2 p-4 text-[#FFD369]">
        Admin Dashboard
      </h2>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#222831",
          color: "#EEEEEE",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: "1200px", width: "100%" }}>
          {/* Chart Container */}
          <div
            style={{
              backgroundColor: "#393E46",
              borderRadius: "8px",
              padding: "2rem",
              boxShadow: "0 10px 15px rgba(0, 0, 0, 0.1)",
              marginTop: "20px",
            }}
          >
            {/* Charts Layout */}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {/* User Roles Distribution Pie Chart */}
              <div style={{ flex: "1", marginRight: "1rem" }}>
                <h3 style={{ color: "#FFD369" }}>User Roles Distribution</h3>
                <PieChart width={400} height={400}>
                  <Pie
                    data={userData}
                    cx={200}
                    cy={200}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {userData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </div>

              {/* Books Uploaded Bar Chart */}
              <div style={{ flex: "1" }}>
                <h3 style={{ color: "#FFD369", marginBottom: "60px" }}>
                  Books Uploaded
                </h3>
                <BarChart
                  width={400}
                  height={300}
                  data={[{ name: "Books", count: booksUploaded }]}
                >
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#00C49F" />
                </BarChart>
              </div>
            </div>
          </div>

          {/* Tabs for Sellers and Buyers */}
          <Box sx={{ width: "100%", marginTop: "20px" }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab label="Sellers" sx={{ color: "#FFFFFF" }} />
              <Tab label="Buyers" sx={{ color: "#FFFFFF" }} /> {/* New Buyers Tab */}
              <Tab label="Subscriptions" sx={{ color: "#FFFFFF" }} />
            </Tabs>
            <TabPanel value={activeTab} index={0}>
              <h4 style={{ color: "#FFD369" }}>Sellers Information</h4>
              <table
                style={{
                  width: "100%",
                  color: "#EEE",
                  marginTop: "10px",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        border: "1px solid #EEE",
                        padding: "8px",
                        textAlign: "left",
                        width: "20%",
                      }}
                    >
                      ID
                    </th>
                    <th
                      style={{
                        border: "1px solid #EEE",
                        padding: "8px",
                        textAlign: "left",
                        width: "30%",
                      }}
                    >
                      Name
                    </th>
                    <th
                      style={{
                        border: "1px solid #EEE",
                        padding: "8px",
                        textAlign: "left",
                        width: "30%",
                      }}
                    >
                      Email
                    </th>
                    <th
                      style={{
                        border: "1px solid #EEE",
                        padding: "8px",
                        textAlign: "center",
                        width: "20%",
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sellers.map((seller) => (
                    <tr key={seller.id}>
                      <td style={{ border: "1px solid #EEE", padding: "8px" }}>
                        {seller.id}
                      </td>
                      <td style={{ border: "1px solid #EEE", padding: "8px" }}>
                        {seller.username}
                      </td>
                      <td style={{ border: "1px solid #EEE", padding: "8px" }}>
                        {seller.email}
                      </td>
                      <td
                        style={{
                          border: "1px solid #EEE",
                          padding: "8px",
                          textAlign: "center",
                        }}
                      >
                        <Button
                          variant="contained"
                          onClick={() => handleEditClick(seller,'seller')}
                          sx={{ padding: "4px", marginRight: "8px" }} // Add margin here
                        >
                          Edit
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          onClick={() => handleDeleteClickSeller(seller.id)}
                          sx={{ padding: "4px" }}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TabPanel>
            <TabPanel value={activeTab} index={1}>
              <h4 style={{ color: "#FFD369" }}>Buyers Information</h4>
              <table
                style={{
                  width: "100%",
                  color: "#EEE",
                  marginTop: "10px",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        border: "1px solid #EEE",
                        padding: "8px",
                        textAlign: "left",
                        width: "20%",
                      }}
                    >
                      ID
                    </th>
                    <th
                      style={{
                        border: "1px solid #EEE",
                        padding: "8px",
                        textAlign: "left",
                        width: "30%",
                      }}
                    >
                      Name
                    </th>
                    <th
                      style={{
                        border: "1px solid #EEE",
                        padding: "8px",
                        textAlign: "left",
                        width: "30%",
                      }}
                    >
                      Email
                    </th>
                    <th
                      style={{
                        border: "1px solid #EEE",
                        padding: "8px",
                        textAlign: "center",
                        width: "20%",
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {buyers.map((buyer) => (
                    <tr key={buyer.id}>
                      <td style={{ border: "1px solid #EEE", padding: "8px" }}>
                        {buyer.id}
                      </td>
                      <td style={{ border: "1px solid #EEE", padding: "8px" }}>
                        {buyer.username}
                      </td>
                      <td style={{ border: "1px solid #EEE", padding: "8px" }}>
                        {buyer.email}
                      </td>
                      <td
                        style={{
                          border: "1px solid #EEE",
                          padding: "8px",
                          textAlign: "center",
                        }}
                      >
                        <Button
                          variant="contained"
                          onClick={() => handleEditClick(buyer, 'buyer')}
                          sx={{ padding: "4px", marginRight: "8px" }} // Add margin here
                        >
                          Edit
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          onClick={() => handleDeleteClickBuyer(buyer.id)}
                          sx={{ padding: "4px" }}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TabPanel>
            <TabPanel value={activeTab} index={2}>
              <h4 style={{ color: "#FFD369" }}>Subscriptions</h4>
              <table
                style={{
                  width: "100%",
                  color: "#EEE",
                  marginTop: "10px",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        border: "1px solid #EEE",
                        padding: "8px",
                        textAlign: "left",
                        width: "20%",
                      }}
                    >
                      ID
                    </th>
                    <th
                      style={{
                        border: "1px solid #EEE",
                        padding: "8px",
                        textAlign: "left",
                        width: "30%",
                      }}
                    >
                      Seller ID
                    </th>
                    <th
                      style={{
                        border: "1px solid #EEE",
                        padding: "8px",
                        textAlign: "left",
                        width: "30%",
                      }}
                    >
                      Plan
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {subs.map((sub) => (
                    <tr key={sub.id}>
                      <td style={{ border: "1px solid #EEE", padding: "8px" }}>
                        {sub.id}
                      </td>
                      <td style={{ border: "1px solid #EEE", padding: "8px" }}>
                        {sub.userId}
                      </td>
                      <td style={{ border: "1px solid #EEE", padding: "8px" }}>
                        {sub.plan}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TabPanel>
          </Box>

          {/* Edit Dialog */}
          <Dialog open={open} onClose={() => setOpen(false)}>
  <DialogTitle>
    {editSeller ? "Edit Seller" : editBuyer ? "Edit Buyer" : "Edit"}
  </DialogTitle>
  <DialogContent>
    {/* Form for editing seller */}
    {editSeller && (
      <>
        <TextField
          label="Username"
          fullWidth
          margin="normal"
          value={editSeller?.username || ""}
          onChange={(e) =>
            setEditSeller({ ...editSeller, username: e.target.value })
          }
        />
        <TextField
          label="Email"
          fullWidth
          margin="normal"
          value={editSeller?.email || ""}
          onChange={(e) =>
            setEditSeller({ ...editSeller, email: e.target.value })
          }
        />
        {/* Additional fields for seller if needed */}
      </>
    )}

    {/* Form for editing buyer */}
    {editBuyer && (
      <>
        <TextField
          label="Username"
          fullWidth
          margin="normal"
          value={editBuyer?.username || ""}
          onChange={(e) =>
            setEditBuyer({ ...editBuyer, username: e.target.value })
          }
        />
        <TextField
          label="Email"
          fullWidth
          margin="normal"
          value={editBuyer?.email || ""}
          onChange={(e) =>
            setEditBuyer({ ...editBuyer, email: e.target.value })
          }
        />
        {/* Additional fields for buyer if needed */}
      </>
    )}
  </DialogContent>

  <DialogActions>
    {editSeller && (
      <Button onClick={handleSaveSeller} color="primary">
        Save Seller
      </Button>
    )}
    {editBuyer && (
      <Button onClick={handleSaveBuyer} color="primary">
        Save Buyer
      </Button>
    )}
    <Button onClick={() => setOpen(false)} color="secondary">
      Cancel
    </Button>
  </DialogActions>
</Dialog>

        </div>
      </div>
    </>
  );
};

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
};

export default AdminDashboard;