import { connectDB } from "@/lib/mongodb";
import PlatformSetting from "@/models/PlatformSetting";
import { MATCH_WEIGHTS_DEFAULT, DEFAULT_PLATFORM_SETTINGS } from "@/lib/constants";
import { DEFAULT_COMPLETION_WEIGHTS } from "@/lib/profile-completion";

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  try {
    await connectDB();
    const setting = await PlatformSetting.findOne({ key }).select("value").lean();
    return setting && setting.value !== undefined ? (setting.value as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function getMatchWeights(): Promise<Record<string, number>> {
  return getSetting("matching.weights", MATCH_WEIGHTS_DEFAULT as Record<string, number>);
}

export async function getCompletionWeights(): Promise<Record<string, number>> {
  return getSetting("profileCompletion.weights", DEFAULT_COMPLETION_WEIGHTS);
}

export async function getAtsVersion(): Promise<string> {
  return getSetting("ats.version", "ats-v1");
}

export { DEFAULT_PLATFORM_SETTINGS };
