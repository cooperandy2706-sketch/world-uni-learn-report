import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GraduationCap, MapPin, Search } from 'lucide-react'
import { filterPublicSchools, type PublicSchool } from '../../hooks/usePublicSchools'

const SUGGESTION_LIMIT = 6

type SchoolSearchInputProps = {
  schools: PublicSchool[]
  value: string
  onChange: (value: string) => void
  typeFilter?: string | null
  variant?: 'hero' | 'directory'
  placeholder?: string
  onSubmit?: () => void
  autoFocus?: boolean
}

export function SchoolSearchInput({
  schools,
  value,
  onChange,
  typeFilter = null,
  variant = 'directory',
  placeholder = 'Search by name or location…',
  onSubmit,
  autoFocus,
}: SchoolSearchInputProps) {
  const navigate = useNavigate()
  const listId = useId()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)

  const suggestions = useMemo(
    () =>
      value.trim()
        ? filterPublicSchools(schools, value, typeFilter).slice(0, SUGGESTION_LIMIT)
        : [],
    [schools, value, typeFilter],
  )

  useEffect(() => {
    setActiveIdx(-1)
  }, [value, suggestions.length])

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const goToSchool = (school: PublicSchool) => {
    setOpen(false)
    onChange(school.name)
    if (school.slug) {
      navigate(`/@${school.slug}`)
    } else {
      navigate(`/schools?q=${encodeURIComponent(school.name)}`)
    }
    onSubmit?.()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (activeIdx >= 0 && suggestions[activeIdx]) {
      goToSchool(suggestions[activeIdx])
      return
    }
    const q = value.trim()
    if (q) navigate(`/schools?q=${encodeURIComponent(q)}`)
    else navigate('/schools')
    setOpen(false)
    onSubmit?.()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && value.trim()) setOpen(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActiveIdx(-1)
    }
  }

  const showList = open && value.trim().length > 0

  return (
    <div
      ref={wrapRef}
      className={`school-search school-search--${variant}`}
      role="combobox"
      aria-expanded={showList}
      aria-controls={listId}
      aria-haspopup="listbox"
    >
      <form className="school-search-form" onSubmit={handleSubmit} role="search">
        <div className="school-search-field">
          <Search size={18} className="school-search-icon" aria-hidden />
          <input
            type="search"
            className="school-search-input"
            placeholder={placeholder}
            value={value}
            autoFocus={autoFocus}
            aria-label="Search schools"
            aria-autocomplete="list"
            aria-controls={showList ? listId : undefined}
            enterKeyHint="search"
            onChange={(e) => {
              onChange(e.target.value)
              setOpen(true)
            }}
            onFocus={() => value.trim() && setOpen(true)}
            onKeyDown={onKeyDown}
          />
        </div>
        {variant === 'hero' && (
          <button type="submit" className="school-search-submit">
            Search
          </button>
        )}
      </form>

      {showList && (
        <ul id={listId} className="school-search-suggestions" role="listbox">
          {suggestions.length === 0 ? (
            <li className="school-search-empty" role="option" aria-selected={false}>
              No matching schools — press Enter to search the directory
            </li>
          ) : (
            suggestions.map((school, i) => (
              <li key={school.id} role="option" aria-selected={activeIdx === i}>
                <button
                  type="button"
                  className={`school-search-option${activeIdx === i ? ' is-active' : ''}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => goToSchool(school)}
                >
                  <span className="school-search-option-logo">
                    {school.logo_url ? (
                      <img src={school.logo_url} alt="" />
                    ) : (
                      <GraduationCap size={18} />
                    )}
                  </span>
                  <span className="school-search-option-text">
                    <span className="school-search-option-name">{school.name}</span>
                    {school.address && (
                      <span className="school-search-option-meta">
                        <MapPin size={12} />
                        {school.address.split(',')[0]}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))
          )}
          {suggestions.length > 0 && (
            <li className="school-search-footer">
              <Link
                to={`/schools?q=${encodeURIComponent(value.trim())}`}
                className="school-search-view-all"
                onClick={() => {
                  setOpen(false)
                  onSubmit?.()
                }}
              >
                View all results for &ldquo;{value.trim()}&rdquo;
              </Link>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
