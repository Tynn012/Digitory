import clsx from 'clsx'

const CategoryPill = ({ label, active, onClick }) => (
  <button
    type="button"
    className={clsx('pill', active && 'active')}
    onClick={onClick}
  >
    {label}
  </button>
)

export default CategoryPill
