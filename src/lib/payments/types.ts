export type PixCharge = {
  paymentRef: string;
  copyPaste: string;
};

export type PaymentProvider = {
  createPixCharge: (input: {
    orderId: string;
    amountCents: number;
    description: string;
  }) => Promise<PixCharge>;
};
