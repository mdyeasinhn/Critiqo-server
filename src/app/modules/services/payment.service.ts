import { PaymentUtils } from '../utils/payment.utils';
import prisma from '../models';
import { PaymentStatus } from '@prisma/client';

const payment = async (
  user: { email: string; name: string },
  payload: { name: string;  amount: number },
  client_ip: string
) => {
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
      customer_name: payload.name,
      customer_address: "N/A",
      customer_city: "N/A", 
      customer_email: user.email,
      customer_phone: "N/A",
      client_ip,
    };

    const paymentResponse = await PaymentUtils.makePaymentAsync(paymentPayload);
    console.log("res-->",paymentResponse)

    // Step 2: Check payment status
    if (!paymentResponse?.transactionStatus || paymentResponse.transactionStatus !== 'Initiated') {
      throw new Error("Payment failed or incomplete");
    }
    // Step 3: Store payment record in DB
    await prisma.payment.create({
      data: {
        email : user.email,
        amount: payload.amount,
        status: PaymentStatus.COMPLETEED, // or COMPLETED if confirmed
        transactionId: paymentResponse.sp_order_id|| null,
        userId: existingUser.id,
      },
    });

    // Step 4: Update subscription field
    await prisma.user.update({
      where: { email: user.email },
      data: {
        subscription: true,
      },
    });

    return paymentResponse;
  });

  return session;
};

const paymentHistory = async (email: string) => {
  const result = await prisma.payment.findMany({ 
    where :{
      email
    }
   })
  return result
};

export const PaymentService = {
  payment,
  paymentHistory
};
