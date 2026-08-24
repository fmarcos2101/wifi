import type { PaymentProvider } from "@/lib/payments/types";

export const mockPayments: PaymentProvider = {
  async createPixCharge({ orderId, amountCents }) {
    const paymentRef = `pix_${orderId}`;
    const copyPaste = [
      "00020126580014BR.GOV.BCB.PIX",
      `0136${paymentRef}`,
      "520400005303986",
      `54${String(amountCents).padStart(2, "0")}`,
      "5802BR5908WIFI HOTEL6009SAO PAULO",
      orderId.slice(0, 8).toUpperCase(),
    ].join("");

    return { paymentRef, copyPaste };
  },
};
