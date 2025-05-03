"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const stripe_1 = __importDefault(require("stripe"));
const config_1 = __importDefault(require("../../config"));
const createPaymentIntent = (price) => __awaiter(void 0, void 0, void 0, function* () {
    const stripe = new stripe_1.default(config_1.default.stripe_secret);
    const priceInCent = price * 100;
    if (!price || priceInCent < 1) {
        throw new Error("Invalid price");
    }
    const paymentIntent = yield stripe.paymentIntents.create({
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
});
exports.PaymentService = {
    createPaymentIntent
};
