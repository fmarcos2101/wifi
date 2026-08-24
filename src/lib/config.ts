export const hotelName = process.env.HOTEL_NAME?.trim() || "Wi-Fi";
export const paymentProvider = process.env.PAYMENT_PROVIDER || "mock";
export const networkProvider = process.env.NETWORK_PROVIDER || "mock";
export const adminPassword = process.env.ADMIN_PASSWORD || "admin";
export const adminSecret = process.env.ADMIN_SECRET || "dev-secret";
export const isMockPayments = paymentProvider === "mock";
