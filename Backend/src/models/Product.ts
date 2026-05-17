import { Schema, model } from 'mongoose';

const productSchema = new Schema(
  {
    seller_id:   { type: String, required: true },
    seller_name: { type: String, required: true },
    title:       { type: String, required: true },
    description: { type: String, required: true },
    price:       { type: Number, required: true },
    stock:       { type: Number, required: true },
    category:    { type: String, required: true },
    images:      { type: [String], default: [] },
    attributes:  { type: Schema.Types.Mixed, default: {} },
    is_active:   { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

productSchema.index({ seller_id: 1 });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ title: 'text', description: 'text' });

export const Product = model('Product', productSchema);
