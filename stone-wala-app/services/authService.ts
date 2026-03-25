import { AUTH_ENDPOINTS } from "@/constants/api";
import api from "./api";

// ── Vendor Auth ─────────────────────────────────────────

// Step 1: GST check karo — exists ya nahi
export const checkGst = async (gstNumber: string) => {
  const res = await api.post(AUTH_ENDPOINTS.GST_CHECK, {
    gst_number: gstNumber,
  });
  return res.data;
  // Returns: { exists: true, phone: "98XXXXXXXX" }
  // OR:      { exists: false }
};

// Step 2a: Existing vendor OTP verify
export const verifyVendorOtp = async (phone: string, otp: string) => {
  const res = await api.post(AUTH_ENDPOINTS.GST_VERIFY_OTP, {
    phone,
    otp,
  });
  return res.data;
  // Returns: { token, subscriptionRequired: true/false }
};

// Step 2b: New vendor register — OTP bhejo
export const registerVendor = async (
  gstNumber: string,
  phone: string,
  firmName: string,
  tier: "Godown" | "Factory" | "Stone Seller",
  whatsapp?: string,
  email?: string,
  location?: string
) => {
  const res = await api.post(AUTH_ENDPOINTS.VENDOR_REGISTER, {
    gst_number: gstNumber,
    phone,
    firm_name: firmName,
    tier,
    whatsapp: whatsapp || undefined,
    email: email || undefined,
    location: location || undefined,
  });
  return res.data;
};

// Step 2c: New vendor register OTP verify
export const verifyVendorRegisterOtp = async (
  phone: string,
  otp: string,
  gstNumber: string,
  firmName: string,
  tier: "Godown" | "Factory" | "Stone Seller",
  whatsapp?: string,
  email?: string,
  location?: string
) => {
  const res = await api.post(AUTH_ENDPOINTS.VENDOR_REGISTER_VERIFY_OTP, {
    phone,
    otp,
    gst_number: gstNumber,
    firm_name: firmName,
    tier,
    whatsapp: whatsapp || undefined,
    email: email || undefined,
    location: location || undefined,
  });
  return res.data;
};

// ── Guest Auth ──────────────────────────────────────────

// Step 1: OTP bhejo
export const sendGuestOtp = async (phone: string) => {
  const res = await api.post(AUTH_ENDPOINTS.GUEST_LOGIN, { phone });
  return res.data;
  // Returns: { message, phone }
};

// Step 2: OTP verify
export const verifyGuestOtp = async (phone: string, otp: string) => {
  const res = await api.post(AUTH_ENDPOINTS.GUEST_VERIFY_OTP, {
    phone,
    otp,
  });
  return res.data;
  // Returns: { token, paymentRequired: true/false }
};
// Guest Profile Save
export const saveGuestProfile = async (
  data: {
    name: string;
    whatsapp?: string;
    email?: string;
    location?: string;
  },
  token: string  // ✅ manual token
) => {
  const res = await api.post(AUTH_ENDPOINTS.GUEST_SAVE_PROFILE, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.data;
};