import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { HiOutlineCube, HiOutlineCollection, HiOutlineMailOpen, HiOutlineBell } from "react-icons/hi";
import api from "../../api/axios.js";
import AdminLayout from "../../components/AdminLayout.jsx";
import Loader from "../../components/Loader.jsx";

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="card-surface p-6 flex items-center gap-4">
    <span className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${color}`}>
      <Icon className="text-xl" />
    </span>
    <div>
      <p className="text-2xl font-display text-ink-900">{value}</p>
      <p className="text-xs text-ink-900/50">{label}</p>
    </div>
  </div>
);

const statusColor = {
  new: "bg-brass-500/10 text-brass-500",
  contacted: "bg-forest-600/10 text-forest-700",
  closed: "bg-stone-200 text-ink-900/50",
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/enquiries/stats/dashboard")
      .then((res) => setStats(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <h1 className="font-display text-2xl text-ink-900 mb-8">Dashboard</h1>

      {loading ? (
        <Loader />
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard icon={HiOutlineCube} label="Total Products" value={stats?.totalProducts ?? 0} color="bg-forest-700/10 text-forest-700" />
            <StatCard icon={HiOutlineCollection} label="Total Categories" value={stats?.totalCategories ?? 0} color="bg-brass-500/10 text-brass-500" />
            <StatCard icon={HiOutlineMailOpen} label="Total Enquiries" value={stats?.totalEnquiries ?? 0} color="bg-ink-900/10 text-ink-900" />
            <StatCard icon={HiOutlineBell} label="New Enquiries" value={stats?.newEnquiries ?? 0} color="bg-red-500/10 text-red-500" />
          </div>

          <div className="mt-10 card-surface p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg text-ink-900">Recent Enquiries</h2>
              <Link to="/admin/enquiries" className="text-sm text-forest-700 hover:underline">
                View all
              </Link>
            </div>
            <div className="divide-y divide-stone-100">
              {stats?.recentEnquiries?.length ? (
                stats.recentEnquiries.map((e) => (
                  <div key={e._id} className="py-3.5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-ink-900">{e.name}</p>
                      <p className="text-xs text-ink-900/50">{e.phone} · {e.productName || e.product?.name || "General enquiry"}</p>
                    </div>
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium capitalize ${statusColor[e.status]}`}>
                      {e.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="py-6 text-sm text-ink-900/40">No enquiries yet.</p>
              )}
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default Dashboard;
