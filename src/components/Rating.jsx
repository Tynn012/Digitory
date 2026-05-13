import React from 'react'

const Star = ({ type = 'full' }) => {
  if (type === 'half') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="half">
            <stop offset="50%" stopColor="#F6C945" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="url(#half)" />
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2v15.27z" fill="#F6C945" opacity="0.6" />
      </svg>
    )
  }

  if (type === 'empty') {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24z" fill="#E6E6E6" />
      </svg>
    )
  }

  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" fill="#F6C945" />
    </svg>
  )
}

const Rating = ({ value = 4.9, small = false }) => {
  const full = Math.floor(value)
  const hasHalf = value - full >= 0.5
  const stars = []
  for (let i = 0; i < 5; i++) {
    if (i < full) stars.push('full')
    else if (i === full && hasHalf) stars.push('half')
    else stars.push('empty')
  }

  return (
    <div className={`rating ${small ? 'small' : ''}`}>
      <div className="stars" aria-hidden>
        {stars.map((t, i) => (
          <span key={i} className="star">
            <Star type={t} />
          </span>
        ))}
      </div>
      <div className="rating-value">{Number(value).toFixed(1)}</div>
    </div>
  )
}

export default Rating
