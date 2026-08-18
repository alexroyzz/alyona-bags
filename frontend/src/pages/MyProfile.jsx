import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlinePencil,
  HiOutlinePlusCircle,
  HiOutlineTrash,
  HiOutlineLocationMarker,
  HiOutlineCheckCircle,
  HiOutlineShoppingBag,
} from "react-icons/hi";
import { useUserAuth } from "../context/UserAuthContext.jsx";
import userApi from "../api/userAxios.js";

const emptyAddress = {
  label: "Home",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  isDefault: false,
};

const MyProfile = () => {
  const { user, setUserOverride } = useUserAuth();

  // -------- Personal details --------
  const [editingInfo, setEditingInfo] = useState(false);
  const [infoForm, setInfoForm] = useState({ name: user?.name || "", phone: user?.phone || "" });
  const [savingInfo, setSavingInfo] = useState(false);

  // -------- Addresses --------
  const [addresses, setAddresses] = useState(user?.addresses || []);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [savingAddress, setSavingAddress] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [settingDefaultId, setSettingDefaultId] = useState(null);

  const handleInfoSave = async (e) => {
    e.preventDefault();
    setSavingInfo(true);
    try {
      const res = await userApi.put("/users/me", infoForm);
      toast.success("Profile updated");
      setEditingInfo(false);
      if (setUserOverride) setUserOverride(res.data.user);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update profile");
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    try {
      const res = editingAddressId
        ? await userApi.put(`/users/me/addresses/${editingAddressId}`, addressForm)
        : await userApi.post("/users/me/addresses", addressForm);
      setAddresses(res.data.addresses);
      if (setUserOverride) setUserOverride({ ...user, addresses: res.data.addresses });
      toast.success(editingAddressId ? "Address updated" : "Address saved");
      setShowAddressForm(false);
      setEditingAddressId(null);
      setAddressForm(emptyAddress);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save address");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleEditAddress = (address) => {
    setAddressForm({
      label: address.label || "Home",
      fullName: address.fullName || "",
      phone: address.phone || "",
      line1: address.line1 || "",
      line2: address.line2 || "",
      city: address.city || "",
      state: address.state || "",
      pincode: address.pincode || "",
      country: address.country || "India",
      isDefault: !!address.isDefault,
    });
    setEditingAddressId(address._id);
    setShowAddressForm(true);
  };

  const handleSetDefaultAddress = async (addressId) => {
    setSettingDefaultId(addressId);
    try {
      const res = await userApi.patch(`/users/me/addresses/${addressId}/default`);
      setAddresses(res.data.addresses);
      if (setUserOverride) setUserOverride({ ...user, addresses: res.data.addresses });
      toast.success("Default address updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not set default address");
    } finally {
      setSettingDefaultId(null);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    setDeletingId(addressId);
    try {
      const res = await userApi.delete(`/users/me/addresses/${addressId}`);
      setAddresses(res.data.addresses);
      toast.success("Address removed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not remove address");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="pt-32 pb-24 container-px">
      <span className="eyebrow">My Account</span>
      <h1 className="mt-3 font-display text-4xl text-ink-900">My Profile</h1>

      <div className="mt-12 grid lg:grid-cols-[280px_1fr] gap-10">
        {/* Sidebar summary */}
        <aside className="card-surface p-7 h-fit">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-full bg-forest-700 text-stone-50 text-lg font-semibold flex items-center justify-center shrink-0">
              {user?.name?.trim()?.[0]?.toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="font-display text-lg text-ink-900 truncate">{user?.name}</p>
              <p className="text-xs text-ink-900/40 truncate">{user?.email}</p>
            </div>
          </div>

          <div className="mt-7 pt-7 border-t border-stone-200 space-y-1">
            <Link
              to="/my-orders"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-ink-900/70 hover:bg-stone-100 hover:text-ink-900 transition-colors"
            >
              <HiOutlineShoppingBag className="text-lg text-ink-900/40" />
              My Orders
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <div className="space-y-8">
          {/* Personal info card */}
          <section className="card-surface p-7">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-ink-900">Personal Information</h2>
              {!editingInfo && (
                <button
                  onClick={() => {
                    setInfoForm({ name: user?.name || "", phone: user?.phone || "" });
                    setEditingInfo(true);
                  }}
                  className="flex items-center gap-1.5 text-sm text-forest-700 font-medium hover:underline"
                >
                  <HiOutlinePencil className="text-base" />
                  Edit
                </button>
              )}
            </div>

            {editingInfo ? (
              <form onSubmit={handleInfoSave} className="mt-6 space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-medium text-ink-900/60 mb-1.5">Full name</label>
                  <input
                    required
                    value={infoForm.name}
                    onChange={(e) => setInfoForm({ ...infoForm, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-900/60 mb-1.5">Phone number</label>
                  <input
                    value={infoForm.phone}
                    onChange={(e) => setInfoForm({ ...infoForm, phone: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm"
                  />
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <button type="submit" disabled={savingInfo} className="btn-primary !py-2.5 !px-6 text-sm disabled:opacity-60">
                    {savingInfo ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingInfo(false)}
                    className="text-sm text-ink-900/50 hover:text-ink-900"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-6 grid sm:grid-cols-2 gap-6 max-w-md">
                <div className="flex items-start gap-3">
                  <HiOutlineUser className="text-lg text-ink-900/30 mt-0.5" />
                  <div>
                    <p className="text-xs text-ink-900/40">Full name</p>
                    <p className="text-sm text-ink-900 mt-0.5">{user?.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <HiOutlineMail className="text-lg text-ink-900/30 mt-0.5" />
                  <div>
                    <p className="text-xs text-ink-900/40">Email</p>
                    <p className="text-sm text-ink-900 mt-0.5">{user?.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <HiOutlinePhone className="text-lg text-ink-900/30 mt-0.5" />
                  <div>
                    <p className="text-xs text-ink-900/40">Phone</p>
                    <p className="text-sm text-ink-900 mt-0.5">{user?.phone || "Not added"}</p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Addresses card */}
          <section className="card-surface p-7">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-ink-900">Saved Addresses</h2>
              {!showAddressForm && (
                <button
                  onClick={() => {
                    setEditingAddressId(null);
                    setAddressForm(emptyAddress);
                    setShowAddressForm(true);
                  }}
                  className="flex items-center gap-1.5 text-sm text-forest-700 font-medium hover:underline"
                >
                  <HiOutlinePlusCircle className="text-base" />
                  Add New
                </button>
              )}
            </div>

            {addresses.length === 0 && !showAddressForm && (
              <div className="mt-6 text-center py-10">
                <HiOutlineLocationMarker className="text-4xl text-ink-900/20 mx-auto" />
                <p className="mt-3 text-sm text-ink-900/50">No addresses saved yet.</p>
              </div>
            )}

            {addresses.length > 0 && (
              <div className="mt-6 grid sm:grid-cols-2 gap-4">
                {addresses.map((a) => (
                  <div key={a._id} className="rounded-lg border border-stone-200 p-5 relative">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] px-2.5 py-1 rounded-full bg-stone-100 text-ink-900/60 font-medium">
                        {a.label}
                      </span>
                      {a.isDefault && (
                        <span className="flex items-center gap-1 text-[11px] text-forest-700 font-medium">
                          <HiOutlineCheckCircle /> Default
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-sm font-medium text-ink-900">{a.fullName}</p>
                    <p className="text-sm text-ink-900/60 mt-0.5 leading-relaxed">
                      {a.line1}
                      {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pincode}, {a.country}
                    </p>
                    <p className="text-sm text-ink-900/60 mt-1">{a.phone}</p>

                    <div className="absolute top-4 right-4 flex items-center gap-3">
                      <button
                        onClick={() => handleEditAddress(a)}
                        className="text-ink-900/30 hover:text-forest-700"
                        aria-label="Edit address"
                      >
                        <HiOutlinePencil />
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(a._id)}
                        disabled={deletingId === a._id}
                        className="text-ink-900/30 hover:text-red-500 disabled:opacity-40"
                        aria-label="Delete address"
                      >
                        <HiOutlineTrash />
                      </button>
                    </div>

                    {!a.isDefault && (
                      <button
                        onClick={() => handleSetDefaultAddress(a._id)}
                        disabled={settingDefaultId === a._id}
                        className="mt-4 text-xs font-medium text-forest-700 hover:underline disabled:opacity-60"
                      >
                        {settingDefaultId === a._id ? "Setting..." : "Set as default"}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {showAddressForm && (
              <form onSubmit={handleSaveAddress} className="mt-6 grid sm:grid-cols-2 gap-4 max-w-2xl">
                {editingAddressId && (
                  <p className="sm:col-span-2 text-xs font-medium text-ink-900/50 -mb-1">Editing address</p>
                )}
                <input
                  required
                  placeholder="Label (e.g. Home, Office)"
                  value={addressForm.label}
                  onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                  className="px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm sm:col-span-2"
                />
                <input
                  required
                  placeholder="Full name"
                  value={addressForm.fullName}
                  onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                  className="px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm"
                />
                <input
                  required
                  placeholder="Phone number"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  className="px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm"
                />
                <input
                  required
                  placeholder="Address line 1"
                  value={addressForm.line1}
                  onChange={(e) => setAddressForm({ ...addressForm, line1: e.target.value })}
                  className="px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm sm:col-span-2"
                />
                <input
                  placeholder="Address line 2 (optional)"
                  value={addressForm.line2}
                  onChange={(e) => setAddressForm({ ...addressForm, line2: e.target.value })}
                  className="px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm sm:col-span-2"
                />
                <input
                  required
                  placeholder="City"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  className="px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm"
                />
                <input
                  required
                  placeholder="State"
                  value={addressForm.state}
                  onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                  className="px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm"
                />
                <input
                  required
                  placeholder="Pincode"
                  value={addressForm.pincode}
                  onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                  className="px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm"
                />
                <input
                  placeholder="Country"
                  value={addressForm.country}
                  onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                  className="px-4 py-3 rounded-lg border border-stone-200 focus:border-forest-700 outline-none text-sm"
                />
                <label className="flex items-center gap-2 text-sm text-ink-900/60 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    className="w-4 h-4 accent-forest-700"
                  />
                  Set as default address
                </label>

                <div className="flex items-center gap-3 sm:col-span-2 pt-1">
                  <button type="submit" disabled={savingAddress} className="btn-primary !py-2.5 !px-6 text-sm disabled:opacity-60">
                    {savingAddress ? "Saving..." : editingAddressId ? "Update Address" : "Save Address"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddressForm(false);
                      setEditingAddressId(null);
                      setAddressForm(emptyAddress);
                    }}
                    className="text-sm text-ink-900/50 hover:text-ink-900"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
