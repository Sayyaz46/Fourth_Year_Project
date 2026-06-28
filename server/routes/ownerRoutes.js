const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const {
  createProperty,
  deleteProperty,
  getBookingRequests,
  getMaintenanceRequests,
  getOwnerDashboard,
  getOwnerProperties,
  getOwnerProperty,
  getRentPayments,
  getOwnerMessages,
  replyToTenant,
  updateBookingStatus,
  updateMaintenanceStatus,
  updateProperty
} = require("../controllers/ownerController");

router.use(protect);
router.use(authorizeRoles("owner"));

router.get("/dashboard", getOwnerDashboard);

router.route("/properties")
  .get(getOwnerProperties)
  .post(createProperty);

router.route("/properties/:id")
  .get(getOwnerProperty)
  .put(updateProperty)
  .delete(deleteProperty);

router.get("/bookings", getBookingRequests);
router.patch("/bookings/:id/status", updateBookingStatus);

router.get("/payments", getRentPayments);

router.get("/maintenance", getMaintenanceRequests);
router.patch("/maintenance/:id/status", updateMaintenanceStatus);

router.get("/messages", getOwnerMessages);
router.post("/messages", replyToTenant);

module.exports = router;
