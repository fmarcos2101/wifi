import { mockPayments } from "@/lib/payments/mock";
import type { PaymentProvider } from "@/lib/payments/types";

export function getPaymentProvider(): PaymentProvider {
  return mockPayments;
}
