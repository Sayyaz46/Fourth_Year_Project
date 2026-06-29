const { useEffect, useMemo, useState } = React;

const API_URL = "http://localhost:5000/api/tenant";
const storedUser = (() => {
  try {
    return JSON.parse(localStorage.getItem("user"));
  } catch (error) {
    return null;
  }
})();

const isTenantSession = storedUser && storedUser.role === "tenant" && storedUser.token;

if (!isTenantSession) {
  window.location.href = "login.html";
}

const money = (value) => `BDT ${Number(value || 0).toLocaleString("en-BD")}`;
const formatDate = (value) => value ? new Date(value).toLocaleDateString("en-BD") : "Not set";
const formatDateTime = (value) => value ? new Date(value).toLocaleString("en-BD") : "Not set";
const formatMonthValue = () => new Date().toISOString().slice(0, 7);

const remainingDays = (endDate) => {
  if (!endDate) return "Not set";
  const end = new Date(endDate);
  const today = new Date();
  const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
  return diff > 0 ? `${diff} days` : "Completed";
};

const firstImage = (property) => property?.images?.[0] || "";

const readFiles = (files) => (
  Promise.all(Array.from(files || []).map((file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  })))
);

const Icon = ({ children, className = "h-5 w-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const HomeIcon = ({ className }) => <Icon className={className}><path d="M3 11l9-8 9 8"/><path d="M5 10v11h14V10"/><path d="M9 21v-6h6v6"/></Icon>;
const SearchIcon = ({ className }) => <Icon className={className}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></Icon>;
const CalendarIcon = ({ className }) => <Icon className={className}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></Icon>;
const CreditCardIcon = ({ className }) => <Icon className={className}><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></Icon>;
const WrenchIcon = ({ className }) => <Icon className={className}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.3-3.3a6 6 0 0 1-7.9 7.9l-6.6 6.6a2.1 2.1 0 0 1-3-3l6.6-6.6a6 6 0 0 1 7.9-7.9l-3.3 3.3z"/></Icon>;
const BellIcon = ({ className }) => <Icon className={className}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></Icon>;
const MessageIcon = ({ className }) => <Icon className={className}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></Icon>;
const UserIcon = ({ className }) => <Icon className={className}><path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="7" r="4"/></Icon>;
const ClockIcon = ({ className }) => <Icon className={className}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></Icon>;
const CheckIcon = ({ className }) => <Icon className={className}><path d="M20 6L9 17l-5-5"/></Icon>;
const XIcon = ({ className }) => <Icon className={className}><path d="M18 6L6 18"/><path d="M6 6l12 12"/></Icon>;
const UploadIcon = ({ className }) => <Icon className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/></Icon>;
const DownloadIcon = ({ className }) => <Icon className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></Icon>;
const LogOutIcon = ({ className }) => <Icon className={className}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></Icon>;

const emptyDashboard = {
  profile: {},
  stats: {},
  currentRental: null,
  rentalHistory: [],
  bookings: [],
  payments: [],
  maintenance: [],
  notifications: [],
  recentMessages: []
};

const defaultFilters = {
  search: "",
  city: "",
  area: "",
  minPrice: "",
  maxPrice: "",
  bedrooms: "",
  propertyType: ""
};

function TenantDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [properties, setProperties] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [bookingProperty, setBookingProperty] = useState(null);
  const [bookingForm, setBookingForm] = useState(() => ({
    moveInDate: "",
    leaseDuration: "12",
    fullName: storedUser?.name || "",
    email: storedUser?.email || "",
    phone: storedUser?.phone || "",
    occupation: "",
    monthlyIncome: "",
    emergencyContact: "",
    emergencyPhone: "",
    documents: []
  }));
  const [paymentForm, setPaymentForm] = useState({
    bookingId: "",
    month: formatMonthValue(),
    amount: "",
    method: "bKash",
    transactionId: "",
    screenshot: ""
  });
  const [maintenanceForm, setMaintenanceForm] = useState({
    propertyId: "",
    issue: "Plumbing",
    priority: "medium",
    description: "",
    photos: []
  });
  const [profileForm, setProfileForm] = useState({
    name: storedUser?.name || "",
    email: storedUser?.email || "",
    phone: storedUser?.phone || "",
    profilePicture: storedUser?.profilePicture || "",
    password: ""
  });
  const [chatMessages, setChatMessages] = useState([]);
  const [chatDraft, setChatDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [propertiesLoading, setPropertiesLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const authHeaders = useMemo(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${storedUser.token}`
  }), []);

  const apiFetch = async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...authHeaders,
        ...(options.headers || {})
      }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("user");
        window.location.href = "login.html";
      }
      throw new Error(data.message || "Request failed");
    }

    return data;
  };

  const loadDashboard = async () => {
    try {
      setError("");
      const data = await apiFetch("/dashboard");
      setDashboard({ ...emptyDashboard, ...data });
      setProfileForm((current) => ({
        ...current,
        name: data.profile?.name || storedUser.name || "",
        email: data.profile?.email || storedUser.email || "",
        phone: data.profile?.phone || "",
        profilePicture: data.profile?.profilePicture || ""
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

const loadProperties = async (nextFilters = filters) => {

    const params = new URLSearchParams();

    Object.entries(nextFilters).forEach(([key, value]) => {

        if (value !== "" && value !== null && value !== undefined) {

            params.append(key, value);

        }

    });

    try {

        setPropertiesLoading(true);

        const response = await fetch(

            `${API_URL}/properties?${params.toString()}`,

            {

                method: "GET",

                headers: {

                    Authorization: `Bearer ${storedUser.token}`

                }

            }

        );

        if (!response.ok) {

            throw new Error("Unable to load properties");

        }

        const data = await response.json();

        console.log("Properties Received:", data);

        setProperties(data);

    }

    catch (err) {

        console.error(err);

        setError(err.message);

    }

    finally {

        setPropertiesLoading(false);

    }

};

useEffect(() => {

    async function initialize() {

        await loadDashboard();

        await loadProperties();

    }

    initialize();

}, []);

  const approvedBookings = useMemo(() => (
    (dashboard.bookings || []).filter((booking) => booking.status === "approved" && booking.property)
  ), [dashboard.bookings]);

  const currentRental = dashboard.currentRental || approvedBookings[0] || null;
  const chatRental = currentRental || approvedBookings[0] || null;

  useEffect(() => {
    if (!currentRental?.property) return;

    setPaymentForm((current) => ({
      ...current,
      bookingId: current.bookingId || currentRental._id,
      amount: current.amount || currentRental.property.rent || ""
    }));

    setMaintenanceForm((current) => ({
      ...current,
      propertyId: current.propertyId || currentRental.property._id
    }));
  }, [currentRental?._id]);

  const loadChat = async () => {
    if (!chatRental?.property?.owner) {
      setChatMessages([]);
      return;
    }

    const params = new URLSearchParams({
      ownerId: chatRental.property.owner._id,
      propertyId: chatRental.property._id
    });

    try {
      const data = await apiFetch(`/messages?${params}`);
      setChatMessages(data);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (activeTab === "chat") {
      loadChat();
    }
  }, [activeTab, chatRental?._id]);

  const logout = () => {
    localStorage.removeItem("user");
    window.location.href = "login.html";
  };

  const openBooking = (property) => {
    setSelectedProperty(null);
    setBookingProperty(property);
    setBookingForm((current) => ({
      ...current,
      fullName: current.fullName || dashboard.profile?.name || storedUser.name || "",
      email: current.email || dashboard.profile?.email || storedUser.email || "",
      phone: current.phone || dashboard.profile?.phone || ""
    }));
  };

  const submitBooking = async (event) => {
    event.preventDefault();
    if (!bookingProperty) return;

    try {
      setSaving(true);
      setError("");
      await apiFetch("/bookings", {
        method: "POST",
        body: JSON.stringify({
          ...bookingForm,
          propertyId: bookingProperty._id
        })
      });
      setNotice("Booking request sent to the owner.");
      setBookingProperty(null);
      setActiveTab("bookings");
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const submitPayment = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      await apiFetch("/payments", {
        method: "POST",
        body: JSON.stringify(paymentForm)
      });
      setNotice("Rent payment recorded.");
      setPaymentForm((current) => ({
        ...current,
        transactionId: "",
        screenshot: ""
      }));
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const submitMaintenance = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      await apiFetch("/maintenance", {
        method: "POST",
        body: JSON.stringify(maintenanceForm)
      });
      setNotice("Maintenance request created.");
      setMaintenanceForm((current) => ({
        ...current,
        description: "",
        photos: []
      }));
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!chatDraft.trim() || !chatRental?.property?.owner) return;

    try {
      setError("");
      const message = await apiFetch("/messages", {
        method: "POST",
        body: JSON.stringify({
          ownerId: chatRental.property.owner._id,
          propertyId: chatRental.property._id,
          body: chatDraft
        })
      });
      setChatMessages((current) => [...current, message]);
      setChatDraft("");
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      const updatedProfile = await apiFetch("/profile", {
        method: "PUT",
        body: JSON.stringify(profileForm)
      });

      localStorage.setItem("user", JSON.stringify({
        ...storedUser,
        ...updatedProfile,
        token: storedUser.token
      }));
      setProfileForm((current) => ({ ...current, password: "" }));
      setNotice("Profile updated.");
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      setError("");
      await apiFetch("/notifications/read-all", { method: "PATCH" });
      await loadDashboard();
    } catch (err) {
      setError(err.message);
    }
  };

  const downloadReceipt = (payment) => {
    const receipt = [
      "BasaVara Rent Receipt",
      `Receipt: ${payment.receiptNumber || payment._id}`,
      `Month: ${payment.month || "Not set"}`,
      `Property: ${payment.property?.title || "Property"}`,
      `Owner: ${payment.property?.owner?.name || "Owner"}`,
      `Amount: ${money(payment.amount)}`,
      `Method: ${payment.method || "Manual"}`,
      `Status: ${payment.status || "Paid"}`,
      `Payment date: ${formatDateTime(payment.paidAt || payment.createdAt)}`,
      `Transaction ID: ${payment.transactionId || "Not provided"}`
    ].join("\n");

    const blob = new Blob([receipt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${payment.receiptNumber || "rent-receipt"}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    loadProperties(filters);
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    loadProperties(defaultFilters);
  };

  const tabs = [
    ["overview", "Overview", HomeIcon],
    ["browse", "Browse", SearchIcon],
    ["bookings", "My Booking", CalendarIcon],
    ["payments", "Rent Payment", CreditCardIcon],
    ["maintenance", "Maintenance", WrenchIcon],
    ["notifications", "Notifications", BellIcon],
    ["chat", "Chat", MessageIcon],
    ["profile", "Profile", UserIcon]
  ];

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-700">Loading tenant dashboard...</div>;
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="rounded-lg bg-blue-600 p-2 text-white">
              <HomeIcon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold text-slate-950">Tenant Dashboard</h1>
              <p className="truncate text-sm text-slate-600">Welcome, {dashboard.profile?.name || storedUser.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("notifications")}
              className="relative rounded-lg p-2 text-slate-700 hover:bg-slate-100 hover:text-blue-700"
              title="Notifications"
            >
              <BellIcon className="h-5 w-5" />
              {(dashboard.stats?.unreadNotifications || 0) > 0 && (
                <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-rose-500"></span>
              )}
            </button>
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-rose-50 hover:text-rose-700"
            >
              <LogOutIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {(error || notice) && (
          <div className={`mb-4 rounded-lg border px-4 py-3 text-sm ${error ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
            {error || notice}
          </div>
        )}

        <nav className="mb-6 flex gap-2 overflow-x-auto rounded-lg border border-slate-200 bg-white p-2">
          {tabs.map(([id, label, TabIcon]) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${activeTab === id ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100"}`}
            >
              <TabIcon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>

        {activeTab === "overview" && (
          <OverviewTab
            dashboard={dashboard}
            currentRental={currentRental}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === "browse" && (
          <BrowseTab
            filters={filters}
            setFilters={setFilters}
            properties={properties}
            loading={propertiesLoading}
            onSubmit={handleFilterSubmit}
            onReset={resetFilters}
            onView={setSelectedProperty}
            onBook={openBooking}
          />
        )}

        {activeTab === "bookings" && (
          <BookingsTab bookings={dashboard.bookings || []} />
        )}

        {activeTab === "payments" && (
          <PaymentsTab
            approvedBookings={approvedBookings}
            paymentForm={paymentForm}
            setPaymentForm={setPaymentForm}
            payments={dashboard.payments || []}
            saving={saving}
            onSubmit={submitPayment}
            onDownload={downloadReceipt}
          />
        )}

        {activeTab === "maintenance" && (
          <MaintenanceTab
            approvedBookings={approvedBookings}
            maintenanceForm={maintenanceForm}
            setMaintenanceForm={setMaintenanceForm}
            requests={dashboard.maintenance || []}
            saving={saving}
            onSubmit={submitMaintenance}
          />
        )}

        {activeTab === "notifications" && (
          <NotificationsTab
            notifications={dashboard.notifications || []}
            onMarkAll={markAllNotificationsRead}
          />
        )}

        {activeTab === "chat" && (
          <ChatTab
            chatRental={chatRental}
            messages={chatMessages}
            draft={chatDraft}
            setDraft={setChatDraft}
            onSubmit={sendMessage}
            onRefresh={loadChat}
          />
        )}

        {activeTab === "profile" && (
          <ProfileTab
            form={profileForm}
            setForm={setProfileForm}
            saving={saving}
            onSubmit={saveProfile}
          />
        )}
      </main>

      {selectedProperty && (
        <PropertyModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onBook={() => openBooking(selectedProperty)}
        />
      )}

      {bookingProperty && (
        <BookingModal
          property={bookingProperty}
          form={bookingForm}
          setForm={setBookingForm}
          saving={saving}
          onClose={() => setBookingProperty(null)}
          onSubmit={submitBooking}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const normalized = String(status || "pending").toLowerCase();
  const classes = {
    available: "border-emerald-200 bg-emerald-50 text-emerald-700",
    pending: "border-amber-200 bg-amber-50 text-amber-700",
    approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
    paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
    rejected: "border-rose-200 bg-rose-50 text-rose-700",
    cancelled: "border-slate-200 bg-slate-100 text-slate-700",
    occupied: "border-blue-200 bg-blue-50 text-blue-700",
    "in progress": "border-amber-200 bg-amber-50 text-amber-700",
    resolved: "border-emerald-200 bg-emerald-50 text-emerald-700"
  };
  const label = String(status || "Pending").replace(/^\w/, (char) => char.toUpperCase());

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${classes[normalized] || "border-slate-200 bg-slate-100 text-slate-700"}`}>
      {label}
    </span>
  );
}

function StatCard({ label, value, icon: CardIcon, color }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className={`mb-3 inline-flex rounded-lg p-2 ${color}`}>
        <CardIcon className="h-5 w-5" />
      </div>
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function OverviewTab({ dashboard, currentRental, setActiveTab }) {
  const stats = dashboard.stats || {};
  const statCards = [
    { label: "Pending Booking", value: stats.pendingBookings || 0, icon: ClockIcon, color: "bg-amber-50 text-amber-700" },
    { label: "Approved Booking", value: stats.approvedBookings || 0, icon: CheckIcon, color: "bg-emerald-50 text-emerald-700" },
    { label: "Rejected Booking", value: stats.rejectedBookings || 0, icon: XIcon, color: "bg-rose-50 text-rose-700" },
    { label: "Open Maintenance", value: stats.openMaintenance || 0, icon: WrenchIcon, color: "bg-blue-50 text-blue-700" }
  ];

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((item) => <StatCard key={item.label} {...item} />)}
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-2">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Current Rental</h2>
              <p className="text-sm text-slate-600">Active contract and rent details</p>
            </div>
            {currentRental?.status && <StatusBadge status={currentRental.status} />}
          </div>

          {currentRental?.property ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-[160px_1fr]">
              <div className="h-40 overflow-hidden rounded-lg bg-slate-200">
                {firstImage(currentRental.property) ? (
                  <img src={firstImage(currentRental.property)} alt={currentRental.property.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">No image</div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-950">{currentRental.property.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{currentRental.property.address}</p>
                <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Detail label="Monthly Rent" value={money(currentRental.property.rent)} />
                  <Detail label="Owner Name" value={currentRental.property.owner?.name || "Owner"} />
                  <Detail label="Contract Start" value={formatDate(currentRental.leaseStart || currentRental.moveInDate)} />
                  <Detail label="Contract End" value={formatDate(currentRental.leaseEnd)} />
                  <Detail label="Remaining Days" value={remainingDays(currentRental.leaseEnd)} />
                  <Detail label="Next Payment" value={formatDate(currentRental.nextPaymentDue)} />
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={() => setActiveTab("payments")} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                    <CreditCardIcon className="h-4 w-4" />
                    Pay Rent
                  </button>
                  <button onClick={() => setActiveTab("maintenance")} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-blue-600 hover:text-blue-700">
                    <WrenchIcon className="h-4 w-4" />
                    Maintenance
                  </button>
                  <button onClick={() => setActiveTab("chat")} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-blue-600 hover:text-blue-700">
                    <MessageIcon className="h-4 w-4" />
                    Message Owner
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <EmptyState text="No approved rental yet." />
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950">Notifications</h2>
            <button onClick={() => setActiveTab("notifications")} className="text-sm font-medium text-blue-700 hover:text-blue-800">View all</button>
          </div>
          <div className="space-y-3">
            {(dashboard.notifications || []).slice(0, 4).map((item) => (
              <div key={item._id} className={`rounded-lg border p-3 ${item.read ? "border-slate-200 bg-white" : "border-blue-200 bg-blue-50"}`}>
                <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                <p className="mt-2 text-xs text-slate-500">{formatDateTime(item.createdAt)}</p>
              </div>
            ))}
            {(dashboard.notifications || []).length === 0 && <EmptyState text="No notifications yet." />}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-slate-950">Rental History</h2>
        <div className="space-y-3">
          {(dashboard.rentalHistory || []).map((booking) => (
            <div key={booking._id} className="flex flex-col gap-2 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-slate-950">{booking.property?.title || "Property"}</h3>
                <p className="text-sm text-slate-600">Stayed {formatDate(booking.leaseStart || booking.moveInDate)} - {formatDate(booking.leaseEnd)}</p>
              </div>
              <StatusBadge status="Completed" />
            </div>
          ))}
          {(dashboard.rentalHistory || []).length === 0 && <EmptyState text="No previous rentals found." />}
        </div>
      </section>
    </div>
  );
}

function BrowseTab({ filters, setFilters, properties, loading, onSubmit, onReset, onView, onBook }) {
  const updateFilter = (field, value) => setFilters((current) => ({ ...current, [field]: value }));

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <Input label="Search" value={filters.search} onChange={(value) => updateFilter("search", value)} placeholder="Title or address" />
          <Input label="City" value={filters.city} onChange={(value) => updateFilter("city", value)} placeholder="Sylhet" />
          <Input label="Area" value={filters.area} onChange={(value) => updateFilter("area", value)} placeholder="Zindabazar" />
          <Input label="Min Price" type="number" value={filters.minPrice} onChange={(value) => updateFilter("minPrice", value)} placeholder="10000" />
          <Input label="Max Price" type="number" value={filters.maxPrice} onChange={(value) => updateFilter("maxPrice", value)} placeholder="30000" />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Bedrooms</label>
            <select value={filters.bedrooms} onChange={(event) => updateFilter("bedrooms", event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-600 focus:outline-none">
              <option value="">Any</option>
              <option value="1">1+</option>
              <option value="2">2+</option>
              <option value="3">3+</option>
              <option value="4">4+</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Property Type</label>
            <select value={filters.propertyType} onChange={(event) => updateFilter("propertyType", event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-600 focus:outline-none">
              <option value="">Any</option>
              <option>Apartment</option>
              <option>House</option>
              <option>Studio</option>
              <option>Sublet</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            <SearchIcon className="h-4 w-4" />
            Search
          </button>
          <button type="button" onClick={onReset} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-blue-600 hover:text-blue-700">
            Reset
          </button>
        </div>
      </form>

      {loading ? (
        <EmptyState text="Loading properties..." />
      ) : properties.length === 0 ? (
        <EmptyState text="No available properties match the filters." />
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => (
            <article key={property._id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="h-48 bg-slate-200">
                {firstImage(property) ? (
                  <img src={firstImage(property)} alt={property.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-500">No image</div>
                )}
              </div>
              <div className="p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-950">{property.title}</h3>
                    <p className="text-sm text-slate-600">{property.address}</p>
                  </div>
                  <StatusBadge status={property.status} />
                </div>
                <div className="mb-4 grid grid-cols-2 gap-2 text-sm text-slate-700">
                  <span>{money(property.rent)}/mo</span>
                  <span>{property.bedrooms || 0} beds</span>
                  <span>{property.bathrooms || 0} baths</span>
                  <span>{property.propertyType || "Property"}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => onView(property)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-blue-600 hover:text-blue-700">
                    Details
                  </button>
                  <button onClick={() => onBook(property)} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                    <CalendarIcon className="h-4 w-4" />
                    Book Now
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

function BookingsTab({ bookings }) {
  return (
    <section className="space-y-4">
      {bookings.length === 0 && <EmptyState text="No booking requests yet." />}
      {bookings.map((booking) => (
        <div key={booking._id} className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-slate-950">{booking.property?.title || "Property"}</h3>
                <StatusBadge status={booking.status} />
              </div>
              <p className="text-sm text-slate-600">{booking.property?.address || "Address unavailable"}</p>
              <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Detail label="Booking Date" value={formatDate(booking.createdAt)} />
                <Detail label="Rental Start" value={formatDate(booking.moveInDate || booking.leaseStart)} />
                <Detail label="Lease Duration" value={`${booking.leaseDuration || 12} months`} />
              </dl>
              {booking.decisionNote && <p className="mt-3 text-sm text-slate-600">{booking.decisionNote}</p>}
            </div>
            <div className="text-sm font-semibold text-slate-950">{money(booking.property?.rent)}/mo</div>
          </div>
        </div>
      ))}
    </section>
  );
}

function PaymentsTab({ approvedBookings, paymentForm, setPaymentForm, payments, saving, onSubmit, onDownload }) {
  const selectedBooking = approvedBookings.find((booking) => booking._id === paymentForm.bookingId);

  const updateForm = (field, value) => {
    setPaymentForm((current) => ({ ...current, [field]: value }));
  };

  const updateBooking = (bookingId) => {
    const booking = approvedBookings.find((item) => item._id === bookingId);
    setPaymentForm((current) => ({
      ...current,
      bookingId,
      amount: booking?.property?.rent || current.amount
    }));
  };

  const handleScreenshot = async (event) => {
    const [image] = await readFiles(event.target.files);
    updateForm("screenshot", image || "");
    event.target.value = "";
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <form onSubmit={onSubmit} className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-2">
        <h2 className="mb-4 text-lg font-semibold text-slate-950">Pay Monthly Rent</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Current Rental</label>
            <select required value={paymentForm.bookingId} onChange={(event) => updateBooking(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-600 focus:outline-none">
              <option value="">Select rental</option>
              {approvedBookings.map((booking) => (
                <option key={booking._id} value={booking._id}>{booking.property?.title}</option>
              ))}
            </select>
          </div>
          <Input label="Month" type="month" value={paymentForm.month} onChange={(value) => updateForm("month", value)} />
          <Input label="Amount" type="number" value={paymentForm.amount} onChange={(value) => updateForm("amount", value)} placeholder={selectedBooking?.property?.rent || ""} />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Payment Method</label>
            <select value={paymentForm.method} onChange={(event) => updateForm("method", event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-600 focus:outline-none">
              <option>bKash</option>
              <option>Nagad</option>
              <option>Bank Transfer</option>
              <option>Card</option>
              <option>Cash</option>
            </select>
          </div>
          <Input label="Transaction ID" value={paymentForm.transactionId} onChange={(value) => updateForm("transactionId", value)} placeholder="Optional" />
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Payment Screenshot</label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm font-medium text-slate-700 hover:border-blue-600 hover:text-blue-700">
              <UploadIcon className="h-4 w-4" />
              Upload screenshot
              <input type="file" accept="image/*" onChange={handleScreenshot} className="hidden" />
            </label>
            {paymentForm.screenshot && <img src={paymentForm.screenshot} alt="Payment screenshot" className="mt-3 h-24 w-24 rounded-lg object-cover" />}
          </div>
          <button disabled={saving || approvedBookings.length === 0} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300">
            <CreditCardIcon className="h-4 w-4" />
            {saving ? "Saving..." : "Submit Payment"}
          </button>
        </div>
      </form>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white lg:col-span-3">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-950">Payment History</h2>
        </div>
        {payments.length === 0 ? (
          <EmptyState text="No payment history yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-100 text-left text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Month</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Payment Date</th>
                  <th className="px-4 py-3 font-semibold">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {payments.map((payment) => (
                  <tr key={payment._id}>
                    <td className="px-4 py-3 text-slate-700">{payment.month || "Not set"}</td>
                    <td className="px-4 py-3 font-semibold text-slate-950">{money(payment.amount)}</td>
                    <td className="px-4 py-3"><StatusBadge status={payment.status} /></td>
                    <td className="px-4 py-3 text-slate-700">{formatDate(payment.paidAt || payment.createdAt)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => onDownload(payment)} className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:border-blue-600 hover:text-blue-700">
                        <DownloadIcon className="h-3.5 w-3.5" />
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function MaintenanceTab({ approvedBookings, maintenanceForm, setMaintenanceForm, requests, saving, onSubmit }) {
  const updateForm = (field, value) => setMaintenanceForm((current) => ({ ...current, [field]: value }));

  const handlePhotos = async (event) => {
    const images = await readFiles(event.target.files);
    updateForm("photos", images);
    event.target.value = "";
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <form onSubmit={onSubmit} className="rounded-lg border border-slate-200 bg-white p-5 lg:col-span-2">
        <h2 className="mb-4 text-lg font-semibold text-slate-950">Create Maintenance Request</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Rental</label>
            <select required value={maintenanceForm.propertyId} onChange={(event) => updateForm("propertyId", event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-600 focus:outline-none">
              <option value="">Select rental</option>
              {approvedBookings.map((booking) => (
                <option key={booking._id} value={booking.property?._id}>{booking.property?.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Issue Type</label>
            <select value={maintenanceForm.issue} onChange={(event) => updateForm("issue", event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-600 focus:outline-none">
              <option>Plumbing</option>
              <option>Electrical</option>
              <option>Appliance</option>
              <option>Painting</option>
              <option>Cleaning</option>
              <option>Security</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Priority</label>
            <select value={maintenanceForm.priority} onChange={(event) => updateForm("priority", event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-600 focus:outline-none">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <textarea required rows="5" value={maintenanceForm.description} onChange={(event) => updateForm("description", event.target.value)} className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-600 focus:outline-none" placeholder="Describe the issue" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Image</label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm font-medium text-slate-700 hover:border-blue-600 hover:text-blue-700">
              <UploadIcon className="h-4 w-4" />
              Upload image
              <input type="file" accept="image/*" multiple onChange={handlePhotos} className="hidden" />
            </label>
            {maintenanceForm.photos.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {maintenanceForm.photos.map((image, index) => <img key={index} src={image} alt="Maintenance upload" className="h-20 w-20 rounded-lg object-cover" />)}
              </div>
            )}
          </div>
          <button disabled={saving || approvedBookings.length === 0} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300">
            <WrenchIcon className="h-4 w-4" />
            {saving ? "Saving..." : "Submit Request"}
          </button>
        </div>
      </form>

      <section className="space-y-4 lg:col-span-3">
        {requests.length === 0 && <EmptyState text="No maintenance requests yet." />}
        {requests.map((request) => (
          <div key={request._id} className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-950">{request.issue}</h3>
                  <StatusBadge status={request.status} />
                </div>
                <p className="text-sm text-slate-700">{request.property?.title || "Property"}</p>
                <p className="mt-2 text-sm text-slate-600">{request.description}</p>
                {request.ownerNote && <p className="mt-2 text-sm font-medium text-slate-700">Owner note: {request.ownerNote}</p>}
              </div>
              <div className="text-sm text-slate-600">{formatDate(request.createdAt)}</div>
            </div>
            {request.photos?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {request.photos.map((image, index) => <img key={index} src={image} alt="Maintenance" className="h-20 w-20 rounded-lg object-cover" />)}
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}

function NotificationsTab({ notifications, onMarkAll }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-950">Notifications</h2>
        <button onClick={onMarkAll} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-blue-600 hover:text-blue-700">
          Mark all read
        </button>
      </div>
      <div className="divide-y divide-slate-200">
        {notifications.length === 0 && <EmptyState text="No notifications yet." />}
        {notifications.map((notification) => (
          <div key={notification._id} className={`px-5 py-4 ${notification.read ? "bg-white" : "bg-blue-50"}`}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-950">{notification.title}</h3>
                  {!notification.read && <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">New</span>}
                </div>
                <p className="mt-1 text-sm text-slate-600">{notification.message}</p>
              </div>
              <p className="text-xs text-slate-500">{formatDateTime(notification.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ChatTab({ chatRental, messages, draft, setDraft, onSubmit, onRefresh }) {
  const owner = chatRental?.property?.owner;

  if (!owner) {
    return <EmptyState text="No owner conversation is available yet." />;
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{owner.name || "Owner"}</h2>
          <p className="text-sm text-slate-600">{chatRental.property?.title || "Current rental"}</p>
        </div>
        <button onClick={onRefresh} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-blue-600 hover:text-blue-700">
          Refresh
        </button>
      </div>
      <div className="h-[460px] overflow-y-auto bg-slate-50 p-5">
        {messages.length === 0 && <EmptyState text="No messages yet." />}
        <div className="space-y-3">
          {messages.map((message) => {
            const fromTenant = String(message.sender?._id || message.sender) === String(storedUser._id);
            return (
              <div key={message._id} className={`flex ${fromTenant ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[82%] rounded-lg px-4 py-3 text-sm shadow-sm ${fromTenant ? "bg-blue-600 text-white" : "border border-slate-200 bg-white text-slate-800"}`}>
                  <p>{message.body}</p>
                  <p className={`mt-1 text-[11px] ${fromTenant ? "text-blue-100" : "text-slate-500"}`}>{formatDateTime(message.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-2 border-t border-slate-200 p-4 sm:flex-row">
        <input value={draft} onChange={(event) => setDraft(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-600 focus:outline-none" placeholder="Write a message" />
        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
          <MessageIcon className="h-4 w-4" />
          Send
        </button>
      </form>
    </section>
  );
}

function ProfileTab({ form, setForm, saving, onSubmit }) {
  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handlePhoto = async (event) => {
    const [image] = await readFiles(event.target.files);
    updateForm("profilePicture", image || "");
    event.target.value = "";
  };

  return (
    <form onSubmit={onSubmit} className="max-w-3xl rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-lg font-semibold text-slate-950">Tenant Profile</h2>
      <div className="mb-6 flex items-center gap-4">
        <div className="h-20 w-20 overflow-hidden rounded-full bg-slate-200">
          {form.profilePicture ? (
            <img src={form.profilePicture} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-500"><UserIcon className="h-8 w-8" /></div>
          )}
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-blue-600 hover:text-blue-700">
          <UploadIcon className="h-4 w-4" />
          Upload photo
          <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
        </label>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Name" value={form.name} onChange={(value) => updateForm("name", value)} />
        <Input label="Phone" value={form.phone} onChange={(value) => updateForm("phone", value)} />
        <Input label="Email" type="email" value={form.email} onChange={(value) => updateForm("email", value)} />
        <Input label="Password" type="password" value={form.password} onChange={(value) => updateForm("password", value)} placeholder="Leave blank to keep current" />
      </div>
      <button disabled={saving} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300">
        <CheckIcon className="h-4 w-4" />
        {saving ? "Saving..." : "Save Profile"}
      </button>
    </form>
  );
}

function PropertyModal({ property, onClose, onBook }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 p-4">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">{property.title}</h2>
            <p className="text-sm text-slate-600">{property.address}</p>
          </div>
          <button onClick={onClose} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Close</button>
        </div>
        <div className="p-5">
          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(property.images?.length ? property.images : [""]).map((image, index) => (
              <div key={index} className="h-56 overflow-hidden rounded-lg bg-slate-200">
                {image ? <img src={image} alt={property.title} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-500">No image</div>}
              </div>
            ))}
          </div>
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Detail label="Monthly Rent" value={money(property.rent)} />
            <Detail label="Bedrooms" value={property.bedrooms || 0} />
            <Detail label="Bathrooms" value={property.bathrooms || 0} />
            <Detail label="Availability" value={property.status || "available"} />
            <Detail label="Property Type" value={property.propertyType || "Property"} />
            <Detail label="Area" value={property.area || property.location || "Not set"} />
            <Detail label="City" value={property.city || "Not set"} />
            <Detail label="Owner" value={property.owner?.name || "Owner"} />
          </dl>
          {property.description && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold text-slate-950">Description</h3>
              <p className="text-sm leading-6 text-slate-700">{property.description}</p>
            </div>
          )}
          {property.amenities?.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold text-slate-950">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((amenity) => <span key={amenity} className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-700">{amenity}</span>)}
              </div>
            </div>
          )}
          <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-slate-950">Owner Information</h3>
            <p className="text-sm text-slate-700">{property.owner?.name || "Owner"}</p>
            <p className="text-sm text-slate-600">{property.owner?.email || "Email unavailable"}</p>
            <p className="text-sm text-slate-600">{property.owner?.phone || "Phone unavailable"}</p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={onBook} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700">
              <CalendarIcon className="h-4 w-4" />
              Book Now
            </button>
            <button onClick={onClose} className="rounded-lg border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:border-blue-600 hover:text-blue-700">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookingModal({ property, form, setForm, saving, onClose, onSubmit }) {
  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleDocuments = async (event) => {
    const documents = await readFiles(event.target.files);
    updateForm("documents", documents);
    event.target.value = "";
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 p-4">
      <form onSubmit={onSubmit} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">Booking Request</h2>
            <p className="text-sm text-slate-600">{property.title} - {money(property.rent)}/month</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Close</button>
        </div>
        <div className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input required label="Rental Start Date" type="date" value={form.moveInDate} onChange={(value) => updateForm("moveInDate", value)} />
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Lease Duration</label>
              <select value={form.leaseDuration} onChange={(event) => updateForm("leaseDuration", event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-600 focus:outline-none">
                <option value="6">6 months</option>
                <option value="12">12 months</option>
                <option value="24">24 months</option>
              </select>
            </div>
            <Input required label="Full Name" value={form.fullName} onChange={(value) => updateForm("fullName", value)} />
            <Input required label="Email" type="email" value={form.email} onChange={(value) => updateForm("email", value)} />
            <Input required label="Phone" value={form.phone} onChange={(value) => updateForm("phone", value)} />
            <Input label="Occupation" value={form.occupation} onChange={(value) => updateForm("occupation", value)} />
            <Input label="Monthly Income" type="number" value={form.monthlyIncome} onChange={(value) => updateForm("monthlyIncome", value)} />
            <Input label="Emergency Contact" value={form.emergencyContact} onChange={(value) => updateForm("emergencyContact", value)} />
            <Input label="Emergency Phone" value={form.emergencyPhone} onChange={(value) => updateForm("emergencyPhone", value)} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">Documents</label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm font-medium text-slate-700 hover:border-blue-600 hover:text-blue-700">
              <UploadIcon className="h-4 w-4" />
              Upload documents
              <input type="file" accept="image/*,.pdf" multiple onChange={handleDocuments} className="hidden" />
            </label>
            {form.documents?.length > 0 && <p className="mt-2 text-sm text-slate-600">{form.documents.length} files attached</p>}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-slate-300 px-4 py-3 font-medium text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button disabled={saving} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-slate-300">
              <CalendarIcon className="h-4 w-4" />
              {saving ? "Sending..." : "Send Booking Request"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="mt-1 font-medium text-slate-950">{value}</dd>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", placeholder = "", required = false }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-blue-600 focus:outline-none"
      />
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
      {text}
    </div>
  );
}

if (isTenantSession) {
  ReactDOM.createRoot(document.getElementById("root")).render(<TenantDashboard />);
}
