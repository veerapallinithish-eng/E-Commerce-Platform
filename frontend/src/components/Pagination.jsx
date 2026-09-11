export default function Pagination({ currentPage, totalPages, onPageChange, disabled = false }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 28, flexWrap: 'wrap' }}>
      <button
        type="button"
        className="btn btn-outline"
        disabled={disabled || currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </button>

      {Array.from({ length: totalPages }, (_, index) => index + 1).map(page => (
        <button
          type="button"
          key={page}
          className={page === currentPage ? 'btn btn-primary' : 'btn btn-outline'}
          disabled={disabled}
          aria-current={page === currentPage ? 'page' : undefined}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}

      <button
        type="button"
        className="btn btn-outline"
        disabled={disabled || currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </button>

      <span className="text-muted" style={{ marginLeft: 8 }}>Page {currentPage} of {totalPages}</span>
    </div>
  )
}