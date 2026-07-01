export type PostLiveStatus =
  | "UNKNOWN"
  | "UPCOMING"
  | "LIVE"
  | "WAS_LIVE"
  | "NOT_LIVE";

export function getEffectiveLiveStatus(
  liveStatus?: PostLiveStatus | null,
  isLive?: boolean,
): PostLiveStatus {
  if (liveStatus === "LIVE" || isLive) return "LIVE";
  if (liveStatus === "UPCOMING") return "UPCOMING";
  if (liveStatus === "WAS_LIVE") return "WAS_LIVE";
  if (liveStatus === "NOT_LIVE") return "NOT_LIVE";
  return "UNKNOWN";
}

export function getMediaLiveLabel(
  providerLabel: string,
  liveStatus?: PostLiveStatus | null,
  isLive?: boolean,
) {
  const effectiveStatus = getEffectiveLiveStatus(liveStatus, isLive);

  if (effectiveStatus === "LIVE") return `Live on ${providerLabel}`;
  if (effectiveStatus === "UPCOMING") return `${providerLabel} Upcoming`;
  if (effectiveStatus === "WAS_LIVE") return `Was Live`;

  return providerLabel;
}

export function getMediaLiveBadgeClass(
  liveStatus?: PostLiveStatus | null,
  isLive?: boolean,
  fallbackClass = "bg-black/60",
) {
  const effectiveStatus = getEffectiveLiveStatus(liveStatus, isLive);

  if (effectiveStatus === "LIVE") return "bg-red-600";
  if (effectiveStatus === "UPCOMING") return "bg-blue-600";
  if (effectiveStatus === "WAS_LIVE") return "bg-gray-700";

  return fallbackClass;
}
