const SearchBar = ({ value, onChange, placeholder }) => (
  <label className="search-bar">
    <span>Search</span>
    <input
      type="search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
    />
  </label>
)

export default SearchBar
