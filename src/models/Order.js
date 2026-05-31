const mongoose = require('mongoose');

// Order items are EMBEDDED because they represent a historical snapshot of the
// purchase. If productId were simply referenced, a future price change or product
// deletion would corrupt the order record. Embedding freezes the price and name
// at the time of purchase — essential for receipts, disputes, and audit trails.
const orderItemSchema = new mongoose.Schema({
  // productId is kept as a reference for convenience (e.g. linking to product page)
  // but price and name are embedded so the record is immutable after placement.
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  name:     { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price:    { type: Number, required: true, min: 0 },
});

// ShippingAddress is EMBEDDED (copied from the user's address at checkout) so
// the order retains the exact delivery location even if the user later edits or
// removes that address from their profile.
const shippingAddressSchema = new mongoose.Schema({
  street:  { type: String, required: true },
  city:    { type: String, required: true },
  country: { type: String, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    // userId REFERENCES User — orders are queried by user frequently ("my orders")
    // and the user document is large; referencing keeps order documents lean.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    items:           [orderItemSchema],
    totalAmount:     { type: Number, required: true, min: 0 },

    status: {
      type: String,
      enum: ['Placed', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
      default: 'Placed',
    },

    shippingAddress: { type: shippingAddressSchema, required: true },
    paymentMethod:   { type: String, enum: ['card', 'paypal', 'cod'], required: true },
    isPaid:          { type: Boolean, default: false },
    paidAt:          { type: Date },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);
