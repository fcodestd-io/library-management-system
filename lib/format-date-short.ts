export function formatDateShort(dateString: string | Date): string {
  if (!dateString) return "-";
  const date = new Date(dateString);

  // Format ke "4 Oct 26"
  const day = date.getDate();
  const month = date.toLocaleDateString("en-US", { month: "short" }); // Oct
  const year = date.getFullYear().toString().slice(-2); // 26

  return `${day} ${month} ${year}`;
}
