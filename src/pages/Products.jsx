import { useEffect, useMemo, useState } from 'react'
import { categories } from '../data/products'
import { fetchProducts } from '../lib/products'
import ProductCard from '../components/ProductCard'
import CategoryPill from '../components/CategoryPill'
import SearchBar from '../components/SearchBar'
import EmptyState from '../components/EmptyState'

const Products = () => {
  const [products, setProducts] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
      .then((data) => {
        setProducts(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory =
        category === 'All' || product.category === category
      const searchValue = search.toLowerCase()
      const matchesSearch =
        product.title.toLowerCase().includes(searchValue) ||
        (product.description || '').toLowerCase().includes(searchValue) ||
        product.tags.join(' ').toLowerCase().includes(searchValue)
      return matchesCategory && matchesSearch
    })
  }, [products, search, category])

  const filters = ['All', ...categories]

  return (
    <div className="section">
      <div className="container section-heading">
        <div>
          <h2>All products</h2>
          <p>Browse premium assets built for creators and planners.</p>
        </div>
      </div>
      <div className="container product-filters">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search planners, templates, trackers"
        />
        <div className="pill-row">
          {filters.map((item) => (
            <CategoryPill
              key={item}
              label={item}
              active={category === item}
              onClick={() => setCategory(item)}
            />
          ))}
        </div>
      </div>
      <div className="container">
        {loading ? (
          <div className="loader-wrapper">
            <div className="loader" />
          </div>
        ) : filtered.length ? (
          <div className="grid grid-2">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No matches found"
            description="Try a different keyword or category filter."
          />
        )}
      </div>
    </div>
  )
}

export default Products
