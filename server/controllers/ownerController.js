const Booking = require("../models/Booking");
const Maintenance = require("../models/Maintenance");
const Payment = require("../models/Payment");
const Property = require("../models/Property");

const VALID_BOOKING_STATUSES = ["pending", "approved", "rejected", "cancelled"];
const VALID_MAINTENANCE_STATUSES = ["Pending", "In Progress", "Resolved", "Rejected"];

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const toNumber = (value, fallback) => {
  if (value === undefined || value === null || value === "") return fallback;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const toStringArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const toImageArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return [String(value).trim()].filter(Boolean);
};

const buildPropertyPayload = (body) => {
  const payload = {};
  const stringFields = [
    "title",
    "address",
    "location",
    "description",
    "propertyType",
    "tenantType",
    "status"
  ];

  stringFields.forEach((field) => {
    if (body[field] !== undefined) {
      payload[field] = String(body[field]).trim();
    }
  });

  ["rent", "bedrooms", "bathrooms", "sqft"].forEach((field) => {
    if (body[field] !== undefined) {
      payload[field] = toNumber(body[field], 0);
    }
  });

  if (body.amenities !== undefined) {
    payload.amenities = toStringArray(body.amenities);
  }

  if (body.images !== undefined) {
    payload.images = toImageArray(body.images);
  }

  return payload;
};

const getOwnerPropertyIds = async (ownerId) => {
  const properties = await Property.find({ owner: ownerId }).select("_id");
  return properties.map((property) => property._id);
};

const getPaymentQuery = (ownerId, propertyIds) => ({
  $or: [
    { owner: ownerId },
    { property: { $in: propertyIds } }
  ]
});

exports.getOwnerDashboard = asyncHandler(async (req, res) => {
  const properties = await Property.find({ owner: req.user._id }).sort({ createdAt: -1 });
  const propertyIds = properties.map((property) => property._id);

  const [bookings, payments, maintenance] = await Promise.all([
    Booking.find({ property: { $in: propertyIds } })
      .populate("tenant", "name email")
      .populate("property", "title address rent status")
      .sort({ createdAt: -1 })
      .limit(20),
    Payment.find(getPaymentQuery(req.user._id, propertyIds))
      .populate("tenant", "name email")
      .populate("property", "title address rent")
      .sort({ paidAt: -1, createdAt: -1 })
      .limit(20),
    Maintenance.find({ property: { $in: propertyIds } })
      .populate("tenant", "name email")
      .populate("property", "title address")
      .sort({ createdAt: -1 })
      .limit(20)
  ]);

  const paidPayments = payments.filter((payment) => {
    const status = String(payment.status || "").toLowerCase();
    return ["paid", "completed", "success", "successful"].includes(status);
  });

  const totalCollected = paidPayments.reduce((total, payment) => total + (payment.amount || 0), 0);

  res.json({
    stats: {
      totalProperties: properties.length,
      occupiedProperties: properties.filter((property) => property.status === "occupied").length,
      pendingBookings: bookings.filter((booking) => booking.status === "pending").length,
      openMaintenance: maintenance.filter((request) => !["Resolved", "Rejected"].includes(request.status)).length,
      totalCollected
    },
    properties,
    bookings,
    payments,
    maintenance
  });
});

exports.getOwnerProperties = asyncHandler(async (req, res) => {
  const properties = await Property.find({ owner: req.user._id }).sort({ createdAt: -1 });
  res.json(properties);
});

exports.getOwnerProperty = asyncHandler(async (req, res) => {
  const property = await Property.findOne({
    _id: req.params.id,
    owner: req.user._id
  });

  if (!property) {
    return res.status(404).json({ message: "Property not found" });
  }

  res.json(property);
});

exports.createProperty = asyncHandler(async (req, res) => {
  const payload = buildPropertyPayload(req.body);

  if (!payload.title || !payload.address || payload.rent === undefined) {
    return res.status(400).json({
      message: "Title, address, and rent are required"
    });
  }

  const property = await Property.create({
    ...payload,
    owner: req.user._id
  });

  res.status(201).json(property);
});

exports.updateProperty = asyncHandler(async (req, res) => {
  const property = await Property.findOne({
    _id: req.params.id,
    owner: req.user._id
  });

  if (!property) {
    return res.status(404).json({ message: "Property not found" });
  }

  Object.assign(property, buildPropertyPayload(req.body));
  const updatedProperty = await property.save();

  res.json(updatedProperty);
});

exports.deleteProperty = asyncHandler(async (req, res) => {
  const property = await Property.findOneAndDelete({
    _id: req.params.id,
    owner: req.user._id
  });

  if (!property) {
    return res.status(404).json({ message: "Property not found" });
  }

  res.json({ message: "Property deleted" });
});

exports.getBookingRequests = asyncHandler(async (req, res) => {
  const propertyIds = await getOwnerPropertyIds(req.user._id);

  const bookings = await Booking.find({ property: { $in: propertyIds } })
    .populate("tenant", "name email")
    .populate("property", "title address rent status")
    .sort({ createdAt: -1 });

  res.json(bookings);
});

exports.updateBookingStatus = asyncHandler(async (req, res) => {
  const { status, decisionNote } = req.body;

  if (!VALID_BOOKING_STATUSES.includes(status)) {
    return res.status(400).json({ message: "Invalid booking status" });
  }

  const propertyIds = await getOwnerPropertyIds(req.user._id);
  const booking = await Booking.findOne({
    _id: req.params.id,
    property: { $in: propertyIds }
  });

  if (!booking) {
    return res.status(404).json({ message: "Booking request not found" });
  }

  booking.status = status;
  booking.decisionNote = decisionNote;
  booking.reviewedAt = new Date();
  booking.reviewedBy = req.user._id;

  if (status === "approved") {
    const leaseStart = booking.moveInDate || booking.leaseStart || new Date();
    booking.leaseStart = booking.leaseStart || leaseStart;

    if (!booking.leaseEnd) {
      const leaseEnd = new Date(leaseStart);
      leaseEnd.setMonth(leaseEnd.getMonth() + (booking.leaseDuration || 12));
      booking.leaseEnd = leaseEnd;
    }

    booking.nextPaymentDue = booking.nextPaymentDue || leaseStart;
    await Property.findByIdAndUpdate(booking.property, { status: "occupied" });
  }

  const updatedBooking = await booking.save();
  await updatedBooking.populate("tenant", "name email");
  await updatedBooking.populate("property", "title address rent status");

  res.json(updatedBooking);
});

exports.getRentPayments = asyncHandler(async (req, res) => {
  const propertyIds = await getOwnerPropertyIds(req.user._id);

  const payments = await Payment.find(getPaymentQuery(req.user._id, propertyIds))
    .populate("tenant", "name email")
    .populate("property", "title address rent")
    .sort({ paidAt: -1, createdAt: -1 });

  res.json(payments);
});

exports.getMaintenanceRequests = asyncHandler(async (req, res) => {
  const propertyIds = await getOwnerPropertyIds(req.user._id);

  const requests = await Maintenance.find({ property: { $in: propertyIds } })
    .populate("tenant", "name email")
    .populate("property", "title address")
    .sort({ createdAt: -1 });

  res.json(requests);
});

exports.updateMaintenanceStatus = asyncHandler(async (req, res) => {
  const { status, ownerNote } = req.body;

  if (!VALID_MAINTENANCE_STATUSES.includes(status)) {
    return res.status(400).json({ message: "Invalid maintenance status" });
  }

  const propertyIds = await getOwnerPropertyIds(req.user._id);
  const request = await Maintenance.findOne({
    _id: req.params.id,
    property: { $in: propertyIds }
  });

  if (!request) {
    return res.status(404).json({ message: "Maintenance request not found" });
  }

  request.status = status;
  request.ownerNote = ownerNote;

  const updatedRequest = await request.save();
  await updatedRequest.populate("tenant", "name email");
  await updatedRequest.populate("property", "title address");

  res.json(updatedRequest);
});
