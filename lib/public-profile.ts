import type { Types } from "mongoose";

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "profile";
}

export function publicUsername(label: string, id: Types.ObjectId | string): string {
  return `${slugify(label)}-${String(id).slice(-6).toLowerCase()}`;
}
