import { anonClient, json, method } from "./_shared.js";

const fallbackContents = [
  { key: "logo", value: "/assets/logo.png", is_active: true },
  { key: "favicon", value: "/assets/favicon.png", is_active: true },
  { key: "spin_background", value: "/assets/spin-background.jpg", is_active: true },
  { key: "claw_background", value: "/assets/claw-background.jpg", is_active: true },
  { key: "wheel_image", value: "/assets/wheel.png", is_active: true }
];

export default async function handler(req, res) {
  if (!method(req, res, ["GET"])) return;
  try {
    const supabase = anonClient();
    const [contents, settings] = await Promise.all([
      supabase.from("contents").select("key,label,value,asset_type,is_active").eq("is_active", true),
      supabase.from("site_settings").select("key,value,is_active").eq("is_active", true)
    ]);
    return json(res, 200, {
      contents: contents.error ? fallbackContents : contents.data,
      settings: settings.error ? [] : settings.data
    });
  } catch {
    return json(res, 200, { contents: fallbackContents, settings: [] });
  }
}
