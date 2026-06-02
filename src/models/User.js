const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Addresses are EMBEDDED (not referenced) because they are private to the user,
// always fetched together with the user document, and never queried independently.
// Embedding avoids an extra collection lookup on every checkout or profile load.
const addressSchema = new mongoose.Schema({
  street:  { type: String, required: true },
  city:    { type: String, required: true },
  country: { type: String, required: true },
});

// PaymentPreferences are EMBEDDED for the same reason as addresses — they are
// tightly coupled to the user and only ever read/written in the user context.
const paymentPreferencesSchema = new mongoose.Schema({
  defaultMethod: { type: String, enum: ['card', 'paypal', 'cod'], default: 'cod' },
  savedCards:    [{ last4: String, brand: String, expiry: String }],
});

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role:     { type: String, enum: ['customer', 'seller', 'admin'], default: 'customer' },

    addresses:          [addressSchema],
    paymentPreferences: { type: paymentPreferencesSchema, default: () => ({}) },

    // Wishlist uses REFERENCES (ObjectIds) to Products because products are large
    // documents and the wishlist only needs to display summary info. Storing full
    // product copies would waste space and go stale when prices or stock change.
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  },
  { timestamps: true }
);

// Hash password before saving if it has been modified
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Never expose the password hash in API responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
