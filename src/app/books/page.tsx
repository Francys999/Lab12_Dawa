// src/app/books/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'

type Author = { id: string; name: string }
type Book = {
  id: string
  title: string
  genre?: string | null
  publishedYear?: number | null
  pages?: number | null
  author?: { id: string; name: string }
}

export default function BooksPage() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [search, setSearch] = useState('')
  const [genre, setGenre] = useState('')
  const [authorFilter, setAuthorFilter] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [sortBy, setSortBy] =
    useState<'title' | 'publishedYear' | 'createdAt'>(
      'createdAt'
    )
  const [order, setOrder] =
    useState<'asc' | 'desc'>('desc')
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [form, setForm] = useState({
    title: '',
    genre: '',
    pages: '',
    publishedYear: '',
    authorId: '',
  })

  const loadAuthors = async () => {
    try {
      const res = await fetch('/api/authors')
      const data = await res.json()
      setAuthors(data || [])
    } catch {
      // ignore
    }
  }

  const loadBooks = async (
    customPage?: number
  ) => {
    setLoading(true)
    setErr('')
    try {
      const params = new URLSearchParams({
        page: String(customPage ?? page),
        limit: String(limit),
        sortBy,
        order,
      })

      if (search) params.set('search', search)
      if (genre) params.set('genre', genre)
      if (authorFilter) {
        const author = authors.find(
          (a) => a.id === authorFilter
        )
        if (author) {
          params.set(
            'authorName',
            author.name
          )
        }
      }

      const res = await fetch(
        `/api/books/search?${params.toString()}`
      )
      const data = await res.json()
      if (!res.ok) {
        setErr(data.error || 'Error al cargar libros')
      } else {
        setBooks(data.data || [])
        setTotal(data.pagination?.total || 0)
        setTotalPages(
          data.pagination?.totalPages || 1
        )
      }
    } catch {
      setErr('Error al cargar libros')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAuthors()
  }, [])

  useEffect(() => {
    loadBooks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortBy, order])

  const genres = useMemo(
    () =>
      Array.from(
        new Set(
          books
            .map((b) => b.genre)
            .filter(
              (g): g is string =>
                !!g && g.trim() !== ''
            )
        )
      ),
    [books]
  )

  const handleApplyFilters = async () => {
    setPage(1)
    await loadBooks(1)
  }

  const handleCreate = async (
    e: React.FormEvent
  ) => {
    e.preventDefault()
    setMsg('')
    setErr('')
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify({
          title: form.title,
          genre:
            form.genre || undefined,
          pages: form.pages
            ? Number(form.pages)
            : undefined,
          publishedYear:
            form.publishedYear
              ? Number(
                  form.publishedYear
                )
              : undefined,
          authorId: form.authorId,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErr(data.error || 'Error al crear libro')
        return
      }
      setMsg('Libro creado')
      setForm({
        title: '',
        genre: '',
        pages: '',
        publishedYear: '',
        authorId: '',
      })
      loadBooks()
    } catch {
      setErr('Error al crear libro')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este libro?')) return
    setMsg('')
    setErr('')
    try {
      const res = await fetch(
        `/api/books/${id}`,
        { method: 'DELETE' }
      )
      const data = await res.json()
      if (!res.ok) {
        setErr(
          data.error ||
            'Error al eliminar libro'
        )
        return
      }
      setMsg('Libro eliminado')
      loadBooks()
    } catch {
      setErr('Error al eliminar libro')
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      <h1 className="text-3xl font-bold">
        Libros
      </h1>

      {/* Formulario crear libro */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h2 className="text-lg font-semibold">
          Crear libro
        </h2>
        <form
          onSubmit={handleCreate}
          className="grid gap-3 md:grid-cols-5"
        >
          <input
            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm"
            placeholder="Título"
            value={form.title}
            onChange={(e) =>
              setForm({
                ...form,
                title: e.target.value,
              })
            }
            required
          />
          <input
            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm"
            placeholder="Género"
            value={form.genre}
            onChange={(e) =>
              setForm({
                ...form,
                genre: e.target.value,
              })
            }
          />
          <input
            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm"
            placeholder="Páginas"
            value={form.pages}
            onChange={(e) =>
              setForm({
                ...form,
                pages: e.target.value,
              })
            }
          />
          <input
            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm"
            placeholder="Año publicación"
            value={form.publishedYear}
            onChange={(e) =>
              setForm({
                ...form,
                publishedYear:
                  e.target.value,
              })
            }
          />
          <select
            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm"
            value={form.authorId}
            onChange={(e) =>
              setForm({
                ...form,
                authorId:
                  e.target.value,
              })
            }
            required
          >
            <option value="">
              Seleccionar autor
            </option>
            {authors.map((a) => (
              <option
                key={a.id}
                value={a.id}
              >
                {a.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="md:col-span-5 bg-indigo-600 hover:bg-indigo-500 px-3 py-2 rounded text-sm font-semibold"
          >
            Guardar libro
          </button>
        </form>
        {err && (
          <p className="text-red-400 text-sm">
            {err}
          </p>
        )}
        {msg && (
          <p className="text-emerald-400 text-sm">
            {msg}
          </p>
        )}
      </section>

      {/* Filtros */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h2 className="text-lg font-semibold">
          Búsqueda y filtros
        </h2>
        <div className="grid gap-3 md:grid-cols-5">
          <input
            placeholder="Buscar por título..."
            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />
          <select
            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm"
            value={authorFilter}
            onChange={(e) =>
              setAuthorFilter(
                e.target.value
              )
            }
          >
            <option value="">
              Todos los autores
            </option>
            {authors.map((a) => (
              <option
                key={a.id}
                value={a.id}
              >
                {a.name}
              </option>
            ))}
          </select>
          <select
            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm"
            value={genre}
            onChange={(e) =>
              setGenre(
                e.target.value
              )
            }
          >
            <option value="">
              Todos los géneros
            </option>
            {genres.map((g) => (
              <option
                key={g}
                value={g}
              >
                {g}
              </option>
            ))}
          </select>
          <select
            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm"
            value={sortBy}
            onChange={(e) =>
              setSortBy(
                e.target.value as any
              )
            }
          >
            <option value="createdAt">
              Fecha creación
            </option>
            <option value="title">
              Título
            </option>
            <option value="publishedYear">
              Año publicación
            </option>
          </select>
          <select
            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm"
            value={order}
            onChange={(e) =>
              setOrder(
                e.target.value as any
              )
            }
          >
            <option value="desc">
              Descendente
            </option>
            <option value="asc">
              Ascendente
            </option>
          </select>
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs">
          <button
            onClick={handleApplyFilters}
            className="bg-sky-600 hover:bg-sky-500 px-3 py-1 rounded"
          >
            Aplicar filtros
          </button>
          <span className="text-slate-400">
            Total resultados: {total}
          </span>
        </div>
      </section>

      {/* Lista + paginación */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h2 className="text-lg font-semibold">
          Resultados
        </h2>
        {loading ? (
          <p>Cargando...</p>
        ) : books.length === 0 ? (
          <p className="text-slate-400 text-sm">
            No se encontraron libros.
          </p>
        ) : (
          <ul className="space-y-2">
            {books.map((b) => (
              <li
                key={b.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 bg-slate-950/60 border border-slate-800 rounded px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-semibold">
                    {b.title}
                  </p>
                  <p className="text-xs text-slate-400">
                    {b.genre || 'Sin género'} ·{' '}
                    {b.publishedYear ||
                      'Año ?'}{' '}
                    ·{' '}
                    {b.author
                      ? b.author.name
                      : 'Sin autor'}
                  </p>
                </div>
                <div className="flex gap-2 text-xs">
                  <button
                    onClick={() =>
                      alert(
                        'Aquí podrías implementar edición.'
                      )
                    }
                    className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() =>
                      handleDelete(b.id)
                    }
                    className="px-2 py-1 rounded bg-red-600 hover:bg-red-500"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Paginación */}
        <div className="flex items-center gap-3 mt-3 text-xs">
          <button
            disabled={page <= 1}
            onClick={() => {
              const newPage = page - 1
              setPage(newPage)
              loadBooks(newPage)
            }}
            className="px-2 py-1 border border-slate-600 rounded disabled:opacity-40"
          >
            Anterior
          </button>
          <span>
            Página {page} de {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => {
              const newPage = page + 1
              setPage(newPage)
              loadBooks(newPage)
            }}
            className="px-2 py-1 border border-slate-600 rounded disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </section>
    </main>
  )
}