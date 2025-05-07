import { PaymentUtils } from '../utils/payment.utils';
import prisma from '../models';



const payment = async (user: { email: string; name: string }, payload: { address: string; contact: string; amount: number }, client_ip: string) => {
  const session = await prisma.$transaction(async (tx) => {
    const existingUser = await tx.user.findUnique({
      where: { email: user.email },
    });

    if (!existingUser) {
      throw new Error("User not found");
    }

    // Step 1: Payment integration
    const paymentPayload = {
      amount: payload.amount,
      order_id: existingUser.id,
      currency: "BDT",
      customer_name: payload?.name,
      customer_address: payload.address,
      customer_city: payload.city,
      customer_email: user.email,
      customer_phone: "N/A",
      client_ip,
    };


    const payment = await PaymentUtils.makePaymentAsync(paymentPayload);

    // Step 2: Check payment status
    if (!payment?.transactionStatus || payment.transactionStatus !== 'Initiated') {
      throw new Error("Payment failed or incomplete");
    }

    // Step 3: Update subscription field
    const updatedUser = await prisma.user.update({
      where: { email: user.email },
      data: {
        subscription: true,
      },
    });

    return payment
  });

  return session;
};

export const PaymentService = {
  payment
}