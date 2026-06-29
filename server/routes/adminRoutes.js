const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const User = require("../models/User");
const Property = require("../models/Property");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Maintenance = require("../models/Maintenance");

router.use(protect);
router.use(authorizeRoles("admin"));

/* ==============================
   DASHBOARD STATS
============================== */

router.get("/dashboard", async (req, res) => {
    try {

        const totalUsers = await User.countDocuments();

        const totalOwners = await User.countDocuments({
            role: "owner"
        });

        const totalTenants = await User.countDocuments({
            role: "tenant"
        });

const allProperties = await Property.find();

console.log("ALL PROPERTIES:");
console.log(allProperties);

const totalProperties = allProperties.length;

const availableProperties = allProperties.filter(
    p => p.status === "available"
).length;

const occupiedProperties = allProperties.filter(
    p => p.status === "occupied"
).length;

const pendingProperties = allProperties.filter(
    p => p.approved === false
).length;

        const totalBookings = await Booking.countDocuments();

        const pendingBookings = await Booking.countDocuments({
            status: "pending"
        });

        const approvedBookings = await Booking.countDocuments({
            status: "approved"
        });

        const rejectedBookings = await Booking.countDocuments({
            status: "rejected"
        });

        const maintenanceRequests = await Maintenance.countDocuments();

        const payments = await Payment.find();

        const totalRevenue = payments.reduce((sum, payment) => {
            return sum + Number(payment.amount || 0);
        }, 0);

        const occupancyRate =
            totalProperties === 0
                ? 0
                : Math.round((occupiedProperties / totalProperties) * 100);

        res.json({

            totalUsers,

            totalOwners,

            totalTenants,

            totalProperties,

            availableProperties,

            occupiedProperties,

            pendingProperties,

            totalBookings,

            pendingBookings,

            approvedBookings,

            rejectedBookings,

            maintenanceRequests,

            totalRevenue,

            occupancyRate

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            message: error.message
        });

    }
});

/* ==============================
   USERS
============================== */

router.get("/users", async (req, res) => {

    const users = await User.find().select("-password");

    res.json(users);

});

/* ==============================
   DELETE USER
============================== */

router.delete("/users/:id", async (req, res) => {

    await User.findByIdAndDelete(req.params.id);

    res.json({
        message: "User deleted successfully"
    });

});
/* ==============================
   ALL PROPERTIES
============================== */

router.get("/properties", async (req, res) => {

    try {

        const properties = await Property.find()
            .populate("owner", "name email phone")
            .sort({ createdAt: -1 });

        res.json(properties);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

});

/* ==============================
   VIEW ALL PROPERTIES
============================== */

router.get("/properties", async (req, res) => {

    try {

        const properties = await Property.find()
            .populate("owner", "name email phone")
            .sort({ createdAt: -1 });

        res.json(properties);

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

});


/* ==============================
   APPROVE PROPERTY
============================== */

router.put("/properties/:id/approve", async (req, res) => {

    try {

        const property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({
                message: "Property not found"
            });
        }

        property.approved = true;

        await property.save();

        res.json({
            message: "Property approved successfully."
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

});


/* ==============================
   DELETE PROPERTY
============================== */

router.delete("/properties/:id", async (req, res) => {

    try {

        const property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({
                message: "Property not found"
            });
        }

        await property.deleteOne();

        res.json({
            message: "Property deleted successfully."
        });

    } catch (err) {

        res.status(500).json({
            message: err.message
        });

    }

});

module.exports = router;