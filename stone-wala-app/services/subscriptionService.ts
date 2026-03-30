import { SUBSCRIPTION_ENDPOINTS } from "@/constants/api";
import api from "./api";

export const getSubscriptionPlans = async () => {
  const res = await api.get(SUBSCRIPTION_ENDPOINTS.PLANS);
  return res.data;
};

export const initiateSubscription = async (plan_id: number) => {
  const res = await api.post(SUBSCRIPTION_ENDPOINTS.INITIATE, { plan_id });
  return res.data;
};

export const completeSubscription = async (payload: {
  plan_id: number;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}) => {
  const res = await api.post(SUBSCRIPTION_ENDPOINTS.PURCHASE, payload);
  return res.data;
};

export const getMyPlan = async () => {
  const res = await api.get(SUBSCRIPTION_ENDPOINTS.MY_PLAN);
  return res.data;
};
 export const getTransactionHistory = async () => {
  const res = await api.get("/subscriptions/history");
  return res.data;
};