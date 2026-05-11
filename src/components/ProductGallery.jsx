import { useEffect, useState } from 'react'

const ProductGallery = ({ images = [], title }) => {
  const [active, setActive] = useState(images[0])

  useEffect(() => {
    setActive(images[0])
  }, [images])

  if (!images.length) {
    return <div className="gallery-main empty">No preview available.</div>
  }

  return (
    <div className="product-gallery">
      <div className="gallery-main">
        <img src={active} alt={title} />
      </div>
      <div className="gallery-thumbs">
        {images.map((image, index) => (
          <button
            type="button"
            key={`${image}-${index}`}
            className={image === active ? 'active' : ''}
            onClick={() => setActive(image)}
          >
            <img src={image} alt={`${title} preview ${index + 1}`} />
          </button>
        ))}
      </div>
    </div>
  )
}

export default ProductGallery
