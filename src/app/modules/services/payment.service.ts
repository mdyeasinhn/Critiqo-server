import Stripe from 'stripe';
import config from '../../config';

const createPaymentIntent = async (price: number): Promise<string> => {
    const stripe = new Stripe(config.stripe_secret as string);
    const priceInCent = price * 100;

    if (!price || priceInCent < 1) {
        throw new Error("Invalid price");
    }

    const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(priceInCent),
        currency: "usd",
        automatic_payment_methods: {
            enabled: true,
        },
    });

    if (paymentIntent.client_secret === null) {

        throw new Error("Failed to retrieve client_secret");
    }

    return paymentIntent.client_secret;
};

export const PaymentService = {
    createPaymentIntent
};