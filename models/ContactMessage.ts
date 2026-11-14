import mongoose, { Model, Schema } from "mongoose";

export interface IContactMessage {
  name: string;
  email: string;
  topic: string;
  message: string;
  status: "new" | "read" | "closed";
}

const ContactMessageSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    topic: { type: String, required: true, trim: true, maxlength: 80 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    status: { type: String, enum: ["new", "read", "closed"], default: "new" },
  },
  { timestamps: true },
);

const ContactMessage: Model<IContactMessage> =
  mongoose.models.ContactMessage ||
  mongoose.model<IContactMessage>("ContactMessage", ContactMessageSchema);
export default ContactMessage;