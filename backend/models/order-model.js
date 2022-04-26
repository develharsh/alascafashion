const mongoose = require("mongoose");
const { phoneNumber } = require("../utils/validator");
const orderSchema = new mongoose.Schema(
  {
    orderedBy: {
      type: mongoose.Types.ObjectId,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      state: { type: String, required: true },
      city: { type: String, required: true },
      pincode: { type: String, required: true },
      streetAddr: { type: String, required: true },
      landmark: { type: String, required: true },
    },
    product: {
      type: mongoose.Types.ObjectId,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);
orderSchema.path("phone").validate(function (phone) {
  return phoneNumber(phone);
}, "Phone must be a 10 digit number");
orderSchema.path("quantity").validate(function (quantity) {
  return quantity >= 1 && quantity <= 10;
}, "Sorry, Quantity range allowed is: 1-10");

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
