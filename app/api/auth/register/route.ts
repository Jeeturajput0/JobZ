
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import {connectDB} from "@/lib/mongodb";
import User from "@/models/User";
import { publicUsername } from "@/lib/public-profile";
import { getSetting } from "@/lib/settings";

export async function POST(request: NextRequest) {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // Respect the super-admin registration toggle.
    const registrationEnabled = await getSetting<boolean>("platform.registrationEnabled", true);
    if (!registrationEnabled) {
      return NextResponse.json(
        { success: false, message: "Registration is currently disabled." },
        { status: 403 },
      );
    }

    // 2. Get data from request body
    const body = await request.json();

    const { fullName, email, password, phone, role: requestedRole } = body;

    // 3. Validate required fields
    if (!fullName || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Full name, email and password are required.",
        },
        { status: 400 }
      );
    }

    // 4. Validate input types and basic formats
    if (
      typeof fullName !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      (phone !== undefined && typeof phone !== "string") ||
      (requestedRole !== undefined && typeof requestedRole !== "string")
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid input data." },
        { status: 400 }
      );
    }

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const role = requestedRole ?? "jobSeeker";

    // Administrator accounts must be provisioned out of band. Public signup
    // must never be able to grant platform-wide privileges.
    if (role === "admin") {
      return NextResponse.json(
        { success: false, message: "Administrator accounts cannot be created through public registration." },
        { status: 403 },
      );
    }

    if (role !== "jobSeeker" && role !== "employer") {
      return NextResponse.json(
        { success: false, message: "Invalid account role." },
        { status: 400 }
      );
    }

    if (cleanName.length < 2 || cleanName.length > 80) {
      return NextResponse.json(
        { success: false, message: "Name must be 2 to 80 characters." },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (password.length < 8 || password.length > 72) {
      return NextResponse.json(
        { success: false, message: "Password must be 8 to 72 characters." },
        { status: 400 }
      );
    }

    // 5. Check if email already exists
    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Email is already registered." },
        { status: 409 }
      );
    }

    // 6. Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 7. Create new user
    const user = await User.create({
      fullName: cleanName,
      email: cleanEmail,
      password: hashedPassword,
      phone: phone?.trim() || "",
      role,
    });
    user.username = publicUsername(cleanName, user._id);
    await user.save();

    // 8. Return safe response (never return password)
    return NextResponse.json(
      {
        success: true,
        message: "Registration successful!",
        user: {
          id: user._id,
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Registration error:", error);

    // Handle duplicate email race condition
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        { success: false, message: "Email is already registered." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Something went wrong during registration." },
      { status: 500 }
    );
  }
}
