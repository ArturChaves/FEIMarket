import { Schema, model } from 'mongoose';

const reviewSchema = new Schema(
  {
    product_id: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    user_id:    { type: String, required: true },
    rating:     { type: Number, required: true, min: 1, max: 5 },
    comment:    { type: String, required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

reviewSchema.index({ product_id: 1 });
reviewSchema.index({ user_id: 1 });

export const Review = model('Review', reviewSchema);
