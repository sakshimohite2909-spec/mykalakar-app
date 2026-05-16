const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

function withProtocol(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("/")) return `https://www.youtube.com${trimmed}`;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function getYoutubeEmbedUrl(url?: string | null) {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

function cleanVideoId(value?: string | null) {
  const candidate = String(value || "").trim();
  if (!candidate) return null;
  const exact = candidate.match(YOUTUBE_ID_PATTERN);
  if (exact) return candidate;
  const embedded = candidate.match(/(?:^|[^a-zA-Z0-9_-])([a-zA-Z0-9_-]{11})(?:[^a-zA-Z0-9_-]|$)/);
  return embedded && YOUTUBE_ID_PATTERN.test(embedded[1]) ? embedded[1] : null;
}

export function getYouTubeVideoId(url?: string | null) {
  const raw = String(url || "").trim();
  if (!raw) return null;

  const directId = cleanVideoId(raw);
  if (directId && raw === directId) return directId;

  try {
    const parsed = new URL(withProtocol(raw));
    const host = parsed.hostname.replace(/^www\./, "").replace(/^m\./, "");
    const segments = parsed.pathname.split("/").filter(Boolean);

    if (host === "youtu.be") {
      return cleanVideoId(segments[0]);
    }

    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      const redirectedPath = parsed.searchParams.get("u");
      if (redirectedPath) {
        const redirectedId = getYouTubeVideoId(decodeURIComponent(redirectedPath));
        if (redirectedId) return redirectedId;
      }

      const queryId = cleanVideoId(parsed.searchParams.get("v") || parsed.searchParams.get("video_id"));
      if (queryId) return queryId;

      const firstSegment = segments[0];
      const secondSegment = segments[1];
      if (["embed", "shorts", "live", "v"].includes(firstSegment)) {
        return cleanVideoId(secondSegment);
      }

      const watchPathId = firstSegment === "watch" ? cleanVideoId(secondSegment) : null;
      if (watchPathId) return watchPathId;
    }

    return null;
  } catch {
    const match = raw.match(
      /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?.*?[?&]v=|watch\?.*?v=|embed\/|shorts\/|live\/|v\/)|[?&]v=)([a-zA-Z0-9_-]{11})/,
    );
    return match ? match[1] : null;
  }
}

export const getYoutubeVideoId = getYouTubeVideoId;

export function getYoutubeThumbnailUrl(url?: string | null) {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://i.ytimg.com/vi_webp/${videoId}/hqdefault.webp` : null;
}

export function getExternalUrl(url: string) {
  return withProtocol(url);
}
