const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const Booking = require("../models/Booking");
const Maintenance = require("../models/Maintenance");
const Message = require("../models/Message");
const Notification = require("../models/Notification");
const Payment = require("../models/Payment");
const Property = require("../models/Property");
const User = require("../models/User");

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const toNumber = (value, fallback = 0) => {
  if (value === undefined || value === null || value === "") return fallback;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const toImageArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return [String(value).trim()].filter(Boolean);
};

const regexFor = (value) => new RegExp(String(value).trim(), "i");

const createNotification = async ({ user, type, title, message, link = "" }) => {
  if (!user || !title) return null;

  return Notification.create({
    user,
    type,
    title,
    message,
    link
  });
};

const populateBooking = (query) => (
  query
    .populate({
      path: "property",
      populate: {
        path: "owner",
        select: "name email phone profilePicture"
      }
    })
    .populate("tenant", "name email phone profilePicture")
);

const getApprovedBookings = async (tenantId) => (
  populateBooking(
    Booking.find({ tenant: tenantId, status: "approved" })
      .sort({ leaseStart: -1, createdAt: -1 })
  )
);

const getCurrentBookingFrom = (bookings) => {
  const now = new Date();

  return bookings.find((booking) => {
    if (!booking.property) return false;
    if (!booking.leaseEnd) return true;
    return new Date(booking.leaseEnd) >= now;
  }) || null;
};

router.use(protect);
router.use(authorizeRoles("tenant"));
router.get("/test", (req, res) => {
    res.json({
        success: true,
        message: "Tenant route is working"
    });
});

router.get("/dashboard", asyncHandler(async (req, res) => {
  const [bookings, approvedBookings, payments, maintenance, notifications, recentMessages, profile] = await Promise.all([
    populateBooking(
      Booking.find({ tenant: req.user._id }).sort({ createdAt: -1 })
    ),
    getApprovedBookings(req.user._id),
    Payment.find({ tenant: req.user._id })
      .populate({
        path: "property",
        populate: {
          path: "owner",
          select: "name email phone profilePicture"
        }
      })
      .sort({ paidAt: -1, createdAt: -1 }),
    Maintenance.find({ tenant: req.user._id })
      .populate({
        path: "property",
        populate: {
          path: "owner",
          select: "name email phone profilePicture"
        }
      })
      .sort({ createdAt: -1 }),
    Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(25),
    Message.find({ tenant: req.user._id })
      .populate("sender", "name role profilePicture")
      .populate("receiver", "name role profilePicture")
      .populate("property", "title address")
      .sort({ createdAt: -1 })
      .limit(20),
    User.findById(req.user._id).select("-password -verificationToken")
  ]);

  const currentRental = getCurrentBookingFrom(approvedBookings);
  const rentalHistory = approvedBookings.filter((booking) => {
    if (!booking.leaseEnd) return false;
    return new Date(booking.leaseEnd) < new Date();
  });

  res.json({
    profile,
    stats: {
      pendingBookings: bookings.filter((booking) => booking.status === "pending").length,
      approvedBookings: bookings.filter((booking) => booking.status === "approved").length,
      rejectedBookings: bookings.filter((booking) => booking.status === "rejected").length,
      unreadNotifications: notifications.filter((notification) => !notification.read).length,
      openMaintenance: maintenance.filter((request) => !["Resolved", "Rejected"].includes(request.status)).length
    },
    currentRental,
    rentalHistory,
    bookings,
    payments,
    maintenance,
    notifications,
    recentMessages
  });
}));

router.get("/properties", asyncHandler(async (req, res) => {


    const {
        search,
        city,
        area,
        minPrice,
        maxPrice,
        bedrooms,
        propertyType
    } = req.query;

    const filter = {
        status: "available"
    };

    if (search) {

        filter.$or = [
            { title: { $regex: search, $options: "i" } },
            { address: { $regex: search, $options: "i" } },
            { location: { $regex: search, $options: "i" } },
            { city: { $regex: search, $options: "i" } },
            { area: { $regex: search, $options: "i" } }
        ];

    }

    if (city) {

        filter.city = {
            $regex: city,
            $options: "i"
        };

    }

    if (area) {

        filter.area = {
            $regex: area,
            $options: "i"
        };

    }

    if (propertyType) {

        filter.propertyType = propertyType;

    }

    if (bedrooms) {

        filter.bedrooms = {
            $gte: Number(bedrooms)
        };

    }

    if (minPrice || maxPrice) {

        filter.rent = {};

        if (minPrice)
            filter.rent.$gte = Number(minPrice);

        if (maxPrice)
            filter.rent.$lte = Number(maxPrice);

    }

    const properties = await Property.find(filter)
        .populate("owner", "name email phone")
        .sort({
            createdAt: -1
        });

    res.json(properties);

}));
router.get("/properties/:id", asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id)
    .populate("owner", "name email phone profilePicture");

  if (!property) {
    return res.status(404).json({ message: "Property not found" });
  }

  res.json(property);
}));

router.get("/bookings", asyncHandler(async (req, res) => {
  const bookings = await populateBooking(
    Booking.find({ tenant: req.user._id }).sort({ createdAt: -1 })
  );

  res.json(bookings);
}));

router.post("/bookings", asyncHandler(async (req, res) => {
  const {
    propertyId,
    moveInDate,
    leaseDuration,
    fullName,
    email,
    phone,
    occupation,
    monthlyIncome,
    emergencyContact,
    emergencyPhone,
    documents
  } = req.body;

  if (!propertyId || !moveInDate || !fullName || !email || !phone) {
    return res.status(400).json({ message: "Property, move-in date, name, email, and phone are required" });
  }

  const property = await Property.findById(propertyId).populate("owner", "name email phone");

  if (!property) {
    return res.status(404).json({ message: "Property not found" });
  }

  if (property.status !== "available") {
    return res.status(400).json({ message: "This property is not available for booking" });
  }

  const existingBooking = await Booking.findOne({
    tenant: req.user._id,
    property: property._id,
    status: { $in: ["pending", "approved"] }
  });

  if (existingBooking) {
    return res.status(400).json({ message: "You already have an active request for this property" });
  }

  const booking = await Booking.create({
    tenant: req.user._id,
    property: property._id,
    moveInDate,
    leaseDuration: toNumber(leaseDuration, 12),
    fullName,
    email,
    phone,
    occupation,
    monthlyIncome: toNumber(monthlyIncome, 0),
    emergencyContact,
    emergencyPhone,
    documents: toImageArray(documents)
  });

  await createNotification({
    user: property.owner?._id || property.owner,
    type: "booking",
    title: "New booking request",
    message: `${req.user.name} requested ${property.title}.`,
    link: "owner-dashboard.html"
  });

  const populatedBooking = await populateBooking(Booking.findById(booking._id));
  res.status(201).json(populatedBooking);
}));

router.get("/payments", asyncHandler(async (req, res) => {
  const payments = await Payment.find({ tenant: req.user._id })
    .populate({
      path: "property",
      populate: {
        path: "owner",
        select: "name email phone profilePicture"
      }
    })
    .sort({ paidAt: -1, createdAt: -1 });

  res.json(payments);
}));

router.post("/payments", asyncHandler(async (req, res) => {
  const {
    bookingId,
    propertyId,
    amount,
    method,
    month,
    transactionId,
    screenshot
  } = req.body;

  const approvedBookings = await getApprovedBookings(req.user._id);
  const booking = bookingId
    ? approvedBookings.find((item) => String(item._id) === String(bookingId))
    : approvedBookings.find((item) => String(item.property?._id) === String(propertyId)) || getCurrentBookingFrom(approvedBookings);

  if (!booking || !booking.property) {
    return res.status(400).json({ message: "An approved rental is required before rent payment" });
  }

  const rentAmount = toNumber(amount, booking.property.rent || 0);

  if (rentAmount <= 0) {
    return res.status(400).json({ message: "Payment amount must be greater than zero" });
  }

  const payment = await Payment.create({
    tenant: req.user._id,
    property: booking.property._id,
    owner: booking.property.owner?._id || booking.property.owner,
    amount: rentAmount,
    method: method || "Manual",
    month,
    transactionId,
    screenshot: screenshot || "",
    receiptNumber: `RNT-${Date.now()}-${String(req.user._id).slice(-4)}`,
    status: "Paid",
    paidAt: new Date()
  });

  if (booking.nextPaymentDue) {
    const nextPaymentDue = new Date(booking.nextPaymentDue);
    nextPaymentDue.setMonth(nextPaymentDue.getMonth() + 1);
    booking.nextPaymentDue = nextPaymentDue;
    await booking.save();
  }

  await Promise.all([
    createNotification({
      user: req.user._id,
      type: "payment",
      title: "Payment received",
      message: `Your ${month || "rent"} payment for ${booking.property.title} was recorded.`,
      link: "tenant-dashboard.html"
    }),
    createNotification({
      user: booking.property.owner?._id || booking.property.owner,
      type: "payment",
      title: "Rent payment received",
      message: `${req.user.name} paid ${rentAmount} for ${booking.property.title}.`,
      link: "owner-dashboard.html"
    })
  ]);

  const populatedPayment = await Payment.findById(payment._id)
    .populate({
      path: "property",
      populate: {
        path: "owner",
        select: "name email phone profilePicture"
      }
    });

  res.status(201).json(populatedPayment);
}));

router.get("/maintenance", asyncHandler(async (req, res) => {
  const requests = await Maintenance.find({ tenant: req.user._id })
    .populate({
      path: "property",
      populate: {
        path: "owner",
        select: "name email phone profilePicture"
      }
    })
    .sort({ createdAt: -1 });

  res.json(requests);
}));

router.post("/maintenance", asyncHandler(async (req, res) => {
  const {
    propertyId,
    issue,
    description,
    priority,
    photos
  } = req.body;

  if (!issue) {
    return res.status(400).json({ message: "Issue type is required" });
  }

  const approvedBookings = await getApprovedBookings(req.user._id);
  const booking = propertyId
    ? approvedBookings.find((item) => String(item.property?._id) === String(propertyId))
    : getCurrentBookingFrom(approvedBookings);

  if (!booking || !booking.property) {
    return res.status(400).json({ message: "An approved rental is required before creating maintenance requests" });
  }

  const request = await Maintenance.create({
    tenant: req.user._id,
    property: booking.property._id,
    issue,
    description,
    priority: priority || "medium",
    photos: toImageArray(photos)
  });

  await createNotification({
    user: booking.property.owner?._id || booking.property.owner,
    type: "maintenance",
    title: "New maintenance request",
    message: `${req.user.name} reported ${issue} at ${booking.property.title}.`,
    link: "owner-dashboard.html"
  });

  const populatedRequest = await Maintenance.findById(request._id)
    .populate({
      path: "property",
      populate: {
        path: "owner",
        select: "name email phone profilePicture"
      }
    });

  res.status(201).json(populatedRequest);
}));

router.get("/notifications", asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 });

  res.json(notifications);
}));

router.patch("/notifications/read-all", asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ message: "Notifications marked as read" });
}));

router.patch("/notifications/:id/read", asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { new: true }
  );

  if (!notification) {
    return res.status(404).json({ message: "Notification not found" });
  }

  res.json(notification);
}));

router.get("/messages", asyncHandler(async (req, res) => {
  const { ownerId, propertyId } = req.query;
  const filter = { tenant: req.user._id };

  if (ownerId) filter.owner = ownerId;
  if (propertyId) filter.property = propertyId;

  const messages = await Message.find(filter)
    .populate("sender", "name role profilePicture")
    .populate("receiver", "name role profilePicture")
    .populate("property", "title address")
    .sort({ createdAt: 1 });

  res.json(messages);
}));

router.post("/messages", asyncHandler(async (req, res) => {
  const { ownerId, propertyId, body } = req.body;

  if (!body || !String(body).trim()) {
    return res.status(400).json({ message: "Message cannot be empty" });
  }

  let owner = ownerId ? await User.findOne({ _id: ownerId, role: "owner" }) : null;
  let property = null;

  if (propertyId) {
    property = await Property.findById(propertyId).populate("owner", "name email phone role");
    owner = owner || property?.owner;
  }

  if (!owner) {
    const approvedBookings = await getApprovedBookings(req.user._id);
    const currentBooking = getCurrentBookingFrom(approvedBookings);
    property = currentBooking?.property || null;
    owner = property?.owner || null;
  }

  if (!owner) {
    return res.status(400).json({ message: "No owner conversation is available yet" });
  }

  const message = await Message.create({
    tenant: req.user._id,
    owner: owner._id || owner,
    property: property?._id,
    sender: req.user._id,
    receiver: owner._id || owner,
    body: String(body).trim()
  });

  await createNotification({
    user: owner._id || owner,
    type: "message",
    title: "New message",
    message: `${req.user.name} sent you a message.`,
    link: "owner-dashboard.html"
  });

  const populatedMessage = await Message.findById(message._id)
    .populate("sender", "name role profilePicture")
    .populate("receiver", "name role profilePicture")
    .populate("property", "title address");

  res.status(201).json(populatedMessage);
}));

router.put("/profile", asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    profilePicture,
    password
  } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (email && email !== user.email) {
    const existingUser = await User.findOne({
      email,
      _id: { $ne: user._id }
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email is already in use" });
    }

    user.email = email;
  }

  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (profilePicture !== undefined) user.profilePicture = profilePicture;

  if (password) {
    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const samePassword = await bcrypt.compare(password, user.password);
    if (!samePassword) {
      user.password = password;
    }
  }

  await user.save();

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    profilePicture: user.profilePicture,
    role: user.role
  });
}));

module.exports = router;
