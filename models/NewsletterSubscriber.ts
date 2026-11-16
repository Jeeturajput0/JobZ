import mongoose, { Model, Schema } from "mongoose";

export interface INewsletterSubscriber {
  email: string;
}

const NewsletterSubscriberSchema = new Schema<INewsletterSubscriber>(
  { email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254, unique: true } },
  { timestamps: true },
);

const NewsletterSubscriber: Model<INewsletterSubscriber> =
  mongoose.models.NewsletterSubscriber ||
  mongoose.model<INewsletterSubscriber>("NewsletterSubscriber", NewsletterSubscriberSchema);

export default NewsletterSubscriber;
