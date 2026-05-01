import type { ReleaseAsset } from "./github";

export type OS = "windows" | "mac" | "linux" | "android" | "unknown";
export type Platform = "windows" | "mac" | "linux" | "android";

export const PLATFORM_LABEL: Record<Platform, string> = {
  windows: "Windows",
  mac: "macOS",
  linux: "Linux",
  android: "Android",
};

const EXT_MAP: Array<{ test: RegExp; platform: Platform; weight: number }> = [
  { test: /\.exe$/i, platform: "windows", weight: 10 },
  { test: /\.msi$/i, platform: "windows", weight: 9 },
  { test: /windows|win(32|64|-)?/i, platform: "windows", weight: 5 },
  { test: /\.dmg$/i, platform: "mac", weight: 10 },
  { test: /\.pkg$/i, platform: "mac", weight: 9 },
  { test: /(macos|darwin|osx|mac-)/i, platform: "mac", weight: 5 },
  { test: /\.AppImage$/i, platform: "linux", weight: 10 },
  { test: /\.deb$/i, platform: "linux", weight: 9 },
  { test: /\.rpm$/i, platform: "linux", weight: 9 },
  { test: /\.snap$/i, platform: "linux", weight: 8 },
  { test: /\.flatpak$/i, platform: "linux", weight: 8 },
  { test: /(linux|ubuntu|fedora)/i, platform: "linux", weight: 5 },
  { test: /\.apk$/i, platform: "android", weight: 10 },
  { test: /android/i, platform: "android", weight: 5 },
];

export function detectOS(): OS {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent.toLowerCase();
  const platform = (navigator.platform || "").toLowerCase();
  if (/android/.test(ua)) return "android";
  if (/win/.test(platform) || /windows/.test(ua)) return "windows";
  if (/mac/.test(platform) || /mac os/.test(ua) || /iphone|ipad/.test(ua)) return "mac";
  if (/linux/.test(platform) || /linux/.test(ua)) return "linux";
  return "unknown";
}

export function assetPlatforms(name: string): Platform[] {
  const matched = new Set<Platform>();
  for (const m of EXT_MAP) if (m.test.test(name)) matched.add(m.platform);
  return Array.from(matched);
}

export function repoSupportsPlatforms(assets: ReleaseAsset[]): Set<Platform> {
  const set = new Set<Platform>();
  assets.forEach((a) => assetPlatforms(a.name).forEach((p) => set.add(p)));
  return set;
}

export function pickBestAsset(
  assets: ReleaseAsset[],
  os: OS,
): { best: ReleaseAsset | null; byPlatform: Record<Platform, ReleaseAsset[]> } {
  const byPlatform: Record<Platform, ReleaseAsset[]> = {
    windows: [],
    mac: [],
    linux: [],
    android: [],
  };
  const scored: Array<{ asset: ReleaseAsset; score: number; platform: Platform | null }> = [];

  for (const asset of assets) {
    let bestScore = 0;
    let bestPlatform: Platform | null = null;
    for (const m of EXT_MAP) {
      if (m.test.test(asset.name)) {
        if (m.weight > bestScore) {
          bestScore = m.weight;
          bestPlatform = m.platform;
        }
      }
    }
    if (bestPlatform) byPlatform[bestPlatform].push(asset);
    // Arch boost
    let archBoost = 0;
    if (os === "mac" && /(arm64|aarch64|apple|silicon)/i.test(asset.name)) archBoost += 2;
    if (os === "mac" && /universal/i.test(asset.name)) archBoost += 3;
    if (os !== "android" && /(x64|x86_64|amd64)/i.test(asset.name)) archBoost += 1;
    scored.push({
      asset,
      score: bestPlatform === os ? bestScore + archBoost + 20 : bestScore + archBoost,
      platform: bestPlatform,
    });
  }
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0]?.score && scored[0].platform === os ? scored[0].asset : null;
  return { best, byPlatform };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
