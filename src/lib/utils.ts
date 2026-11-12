export { cn } from "cn"

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const second = parts.length > 1 ? parts[1][0] : "";
  return (first + second).toUpperCase();
}

export function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";

  const minutes = Math.floor(diff / 60);
  if (minutes < 60) return `${minutes} minutes ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} days ago`;

  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Dianggap "diedit" bila waktu ubah lebih baru dari waktu buat. Perbandingan ini
// tetap benar apa pun nilai bawaan kolom updated_at di tabel db.
export function isEdited(createdAt: string, updatedAt: string | null): boolean {
  if (!updatedAt) return false;
  return new Date(updatedAt).getTime() > new Date(createdAt).getTime();
}