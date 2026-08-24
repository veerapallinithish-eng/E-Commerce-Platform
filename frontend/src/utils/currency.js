// All prices are stored in Indian Rupees (INR). This formats a number
// using Indian digit grouping (e.g. 1,23,456.00) and the ₹ symbol.
const formatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

export function formatINR(amount) {
  const value = Number(amount)
  if (Number.isNaN(value)) return formatter.format(0)
  return formatter.format(value)
}
