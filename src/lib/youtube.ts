const YOUTUBE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

function withProtocol(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function getYoutubeEmbedUrl(url?: string | null) {
  const videoId = getYoutubeVideoId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
}

export function getYoutubeVideoId(url?: string | null) {
  if (!url) return null;

  try {
    const parsed = new URL(withProtocol(url));
    const host = parsed.hostname.replace(/^www\./, "").replace(/^m\./, "");
    let videoId = "";

    if (host === "youtu.be") {
      videoId = parsed.pathname.split("/").filter(Boolean)[0] ?? "";
    } else if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      videoId = parsed.searchParams.get("v") ?? "";

      if (!videoId) {
        const [firstSegment, secondSegment] = parsed.pathname.split("/").filter(Boolean);
        if (["embed", "shorts", "live", "v"].includes(firstSegment)) {
          videoId = secondSegment ?? "";
        }
      }
    }

    return YOUTUBE_ID_PATTERN.test(videoId) ? videoId : null;
  } catch {
    const match = url.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?.*v=|embed\/|shorts\/|live\/|v\/))([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }
}

export function getYoutubeThumbnailUrl(url?: string | null) {
  const videoId = getYoutubeVideoId(url);
  return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null;
}

export function getExternalUrl(url: string) {
  return withProtocol(url);
}
