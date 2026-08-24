// Formats a UTC/ISO timestamp from the backend into Indian Standard Time
// (Asia/Kolkata, UTC+5:30), regardless of the viewer's own timezone.

export function formatISTDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

export function formatISTDateTime(dateString) {
  return new Date(dateString).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }) + ' IST'
}
