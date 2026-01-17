/**
 * Date utilities
 */

/**
 * Get current date in YYYY-MM-DD format
 */
export function getCurrentDateString(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get current month and year
 */
export function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth(), year: now.getFullYear() };
}

/**
 * Format date for display (e.g., "17 Jan")
 */
export function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

/**
 * Format full date (e.g., "Sabtu, 17 Januari 2026")
 */
export function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Get today's full date string
 */
export function getTodayFullDate(): string {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Calculate days remaining from today to deadline
 */
export function getDaysRemaining(deadline: string | null): number | null {
  if (!deadline) return null;
  const today = new Date();
  const deadlineDate = new Date(deadline);
  const diff = deadlineDate.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Check if date is in current month
 */
export function isCurrentMonth(dateString: string): boolean {
  const date = new Date(dateString);
  const now = new Date();
  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}
