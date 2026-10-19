import mongoose from "mongoose";

const locationHistorySchema = new mongoose.Schema(
  {
    advisorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
    accuracy: { type: Number, min: 0 },
    recordedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false },
);

locationHistorySchema.index({ advisorId: 1, recordedAt: -1 });
export default mongoose.model("LocationHistory", locationHistorySchema);
