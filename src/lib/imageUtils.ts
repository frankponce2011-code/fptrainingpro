export function getEjercicioImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (!url.includes('drive.google.com')) return url;
  // Extract file ID from /file/d/ID/view or open?id=ID or ?id=ID
  const match = url.match(/(?:\/file\/d\/|[?&]id=)([a-zA-Z0-9_-]{20,})/);
  if (match) {
    return `https://lh3.googleusercontent.com/u/0/d/${match[1]}`;
  }
  return url;
}
