import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { authorize } from "@/lib/authorize";
import { connectDB } from "@/lib/mongodb";
import Category from "@/models/Category";
import Job from "@/models/Job";

export async function GET() {
  try {
    await connectDB();
    const [categories, counts] = await Promise.all([
      Category.find({ status: "active" }).sort({ name: 1 }).lean(),
      Job.aggregate([{ $match: { status: "active" } }, { $group: { _id: "$category", count: { $sum: 1 } } }]),
    ]);
    const countByName = new Map(counts.map((item) => [String(item._id).toLowerCase(), item.count as number]));
    return NextResponse.json({ success: true, categories: categories.map((item) => ({ id: String(item._id), name: item.name, slug: item.slug, count: countByName.get(item.name.toLowerCase()) || 0 })) });
  } catch (error) {
    console.error("Get categories error:", error);
    return NextResponse.json({ success: false, message: "Could not load categories." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = authorize(request, ["admin"]);
  if (!auth.authorized) return auth.response;
  const body = await request.json().catch(() => null);
  if (!body || typeof body.name !== "string" || body.name.trim().length < 2 || body.name.trim().length > 80) return NextResponse.json({ success: false, message: "Category name must be 2 to 80 characters." }, { status: 400 });
  const name = body.name.trim();
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  try {
    await connectDB();
    const category = await Category.create({ name, slug });
    return NextResponse.json({ success: true, category: { id: String(category._id), name: category.name, slug: category.slug, count: 0 } }, { status: 201 });
  } catch (error) {
    if (error instanceof mongoose.Error && error.name === "ValidationError") return NextResponse.json({ success: false, message: "Invalid category." }, { status: 400 });
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) return NextResponse.json({ success: false, message: "Category already exists." }, { status: 409 });
    console.error("Create category error:", error);
    return NextResponse.json({ success: false, message: "Could not create category." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = authorize(request, ["admin"]);
  if (!auth.authorized) return auth.response;
  const id = request.nextUrl.searchParams.get("id");
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return NextResponse.json({ success: false, message: "A valid category id is required." }, { status: 400 });
  try {
    await connectDB();
    const category = await Category.findByIdAndUpdate(id, { status: "inactive" }, { new: true });
    if (!category) return NextResponse.json({ success: false, message: "Category not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Remove category error:", error);
    return NextResponse.json({ success: false, message: "Could not remove category." }, { status: 500 });
  }
}
