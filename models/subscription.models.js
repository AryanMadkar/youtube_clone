const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    Subscriber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const scubscriptionmodel = new mongoose.models(
  "Subscription",
  subscriptionSchema
);

module.exports = scubscriptionmodel;
