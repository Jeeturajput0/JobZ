import { NextRequest } from "next/server";
import { requirePermission } from "@/lib/session";
import { ok, fail, handleError, readJson } from "@/lib/api";
import { DEFAULT_PLATFORM_SETTINGS } from "@/lib/constants";
import { connectDB } from "@/lib/mongodb";
import PlatformSetting from "@/models/PlatformSetting";

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["platform.settings.view", "platform.settings.manage"]);
    if (!auth.authorized) return auth.response;
    await connectDB();
    const stored = await PlatformSetting.find({}).lean();
    const settings: Record<string, unknown> = { ...DEFAULT_PLATFORM_SETTINGS };
    for (const item of stored) settings[item.key] = item.value;
    return ok({ settings });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requirePermission(request, ["platform.settings.manage"]);
    if (!auth.authorized) return auth.response;
    const body = await readJson(request);
    let updates: Record<string, unknown>;
    if (typeof body.settings === "string") {
      try {
        const parsed = JSON.parse(body.settings);
        updates = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
      } catch {
        return fail("Settings must be a valid JSON object.", 400);
      }
    } else {
      updates = body.settings && typeof body.settings === "object" && !Array.isArray(body.settings)
        ? body.settings as Record<string, unknown>
        : body;
    }
    const allowed = new Set(Object.keys(DEFAULT_PLATFORM_SETTINGS));
    const ops = Object.entries(updates).filter(([key]) => allowed.has(key));
    if (!ops.length) return ok({ message: "No recognised settings to update." });

    await Promise.all(
      ops.map(([key, value]) =>
        PlatformSetting.findOneAndUpdate(
          { key },
          { $set: { value, updatedBy: auth.session.userId } },
          { upsert: true, new: true },
        ),
      ),
    );
    return ok({ message: "Settings updated.", updated: ops.map(([key]) => key) });
  } catch (error) {
    return handleError(error);
  }
}
