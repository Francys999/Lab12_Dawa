// src/app/authors/[id]/AuthorDetailClient.tsx
'use client'

import { useEffect, useState } from 'react'

type Author = {
  id: string
  name: string
  email: string
  bio?: string | null
  nationality?: string | null
  birthYear?: number | null
}

type Stats = {
  authorId: string
  authorName: string
  totalBooks: number
  firstBook: { title: string; year: number } | null
  latestBook: { title: string; year: number } | null
  averagePages: number
  genres: string[]
  longestBook: { title: string; pages: number } | null
  shortestBook: { title: string; pages: number } | null
}

type Book = {
  id: string
  title: string
  genre?: string | null
  pages?: number | null
  publishedYear?: number | null
}

type Tab = 'info' | 'books' | 'edit'

export default function AuthorDetailClient({
  authorId,
  initialTab,
}: {
  authorId: string
  initialTab?: string
}) {
  const [author, setAuthor] = useState<Author | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const normalizedInitialTab: Tab =
    initialTab === 'books' || initialTab === 'edit'
      ? (initialTab as Tab)
      : 'info'

  const [tab, setTab] = useState<Tab>(normalizedInitialTab)

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    bio: '',
    nationality: '',
    birthYear: '',
  })

  const [bookForm, setBookForm] = useState({
    title: '',
    genre: '',
    pages: '',
    publishedYear: '',
  })

  const loadAll = async () => {
    setLoading(true)
    setErr('')
    try {
      const [aRes, sRes, bRes] = await Promise.all([
        fetch(`/api/authors/${authorId}`),
        fetch(`/api/authors/${authorId}/stats`),
        fetch(`/api/authors/${authorId}/books`),
      ])

      const aData = await aRes.json()
      const sData = await sRes.json()
      const bData = await bRes.json()

      if (aRes.ok) {
        setAuthor(aData)
        setEditForm({
          name: aData.name || '',
          email: aData.email || '',
          bio: aData.bio || '',
          nationality: aData.nationality || '',
          birthYear: aData.birthYear ? String(aData.birthYear) : '',
        })
      } else {
        setErr(aData.error || 'Error al cargar autor')
      }

      if (sRes.ok) setStats(sData)
      if (bRes.ok) setBooks(bData.books || [])
    } catch {
      setErr('Error al cargar información del autor')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authorId) loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorId])

  useEffect(() => {
    // Si cambia el initialTab (por navegación), actualizamos tab
    if (initialTab) {
      if (initialTab === 'books' || initialTab === 'edit') {
        setTab(initialTab)
      } else {
        setTab('info')
      }
    }
  }, [initialTab])

  const handleUpdateAuthor = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    setErr('')
    try {
      const res = await fetch(`/api/authors/${authorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          birthYear: editForm.birthYear
            ? Number(editForm.birthYear)
            : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErr(data.error || 'Error al actualizar autor')
        return
      }
      setMsg('Autor actualizado')
      loadAll()
    } catch {
      setErr('Error al actualizar autor')
    }
  }

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    setErr('')
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: bookForm.title,
          genre: bookForm.genre || undefined,
          pages: bookForm.pages
            ? Number(bookForm.pages)
            : undefined,
          publishedYear: bookForm.publishedYear
            ? Number(bookForm.publishedYear)
            : undefined,
          authorId,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErr(data.error || 'Error al crear libro')
        return
      }
      setMsg('Libro creado para este autor')
      setBookForm({
        title: '',
        genre: '',
        pages: '',
        publishedYear: '',
      })
      loadAll()
    } catch {
      setErr('Error al crear libro')
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
        <p>Cargando...</p>
      </main>
    )
  }

  if (!author) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
        <a href="/" className="text-xs text-slate-400">
          ← Volver al dashboard
        </a>
        <p className="mt-4">Autor no encontrado.</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-4">
      <a href="/" className="text-xs text-slate-400">
        ← Volver al dashboard
      </a>

      <h1 className="text-2xl font-bold">Autor: {author.name}</h1>

      {err && <p className="text-red-400 text-sm">{err}</p>}
      {msg && <p className="text-emerald-400 text-sm">{msg}</p>}

      {/* Tabs */}
      <div className="flex gap-2 text-xs mb-2">
        <button
          onClick={() => setTab('info')}
          className={`px-3 py-1 rounded ${
            tab === 'info'
              ? 'bg-sky-600'
              : 'bg-slate-800'
          }`}
        >
          Detalle
        </button>
        <button
          onClick={() => setTab('books')}
          className={`px-3 py-1 rounded ${
            tab === 'books'
              ? 'bg-emerald-600'
              : 'bg-slate-800'
          }`}
        >
          Libros
        </button>
        <button
          onClick={() => setTab('edit')}
          className={`px-3 py-1 rounded ${
            tab === 'edit'
              ? 'bg-indigo-600'
              : 'bg-slate-800'
          }`}
        >
          Editar
        </button>
      </div>

      {/* Contenido según tab */}
      {tab === 'info' && (
        <>
          {stats && (
            <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
              <h2 className="font-semibold">
                Estadísticas del autor
              </h2>
              <p className="text-sm">
                Total libros:{' '}
                {stats.totalBooks}
              </p>
              <p className="text-sm">
                Primer libro:{' '}
                {stats.firstBook
                  ? `${stats.firstBook.title} (${stats.firstBook.year})`
                  : 'N/A'}
              </p>
              <p className="text-sm">
                Último libro:{' '}
                {stats.latestBook
                  ? `${stats.latestBook.title} (${stats.latestBook.year})`
                  : 'N/A'}
              </p>
              <p className="text-sm">
                Promedio páginas:{' '}
                {stats.averagePages}
              </p>
              <p className="text-sm">
                Géneros:{' '}
                {stats.genres.length
                  ? stats.genres.join(
                      ', '
                    )
                  : 'N/A'}
              </p>
              <p className="text-sm">
                Libro más largo:{' '}
                {stats.longestBook
                  ? `${stats.longestBook.title} (${stats.longestBook.pages} páginas)`
                  : 'N/A'}
              </p>
              <p className="text-sm">
                Libro más corto:{' '}
                {stats.shortestBook
                  ? `${stats.shortestBook.title} (${stats.shortestBook.pages} páginas)`
                  : 'N/A'}
              </p>
            </section>
          )}
        </>
      )}

      {tab === 'books' && (
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <h2 className="font-semibold">
            Libros del autor
          </h2>

          {books.length === 0 ? (
            <p className="text-xs text-slate-400">
              Este autor aún no tiene libros.
            </p>
          ) : (
            <ul className="space-y-2">
              {books.map((b) => (
                <li
                  key={b.id}
                  className="bg-slate-950/60 border border-slate-800 rounded px-3 py-2 text-sm"
                >
                  {b.title} ·{' '}
                  {b.genre ||
                    'Sin género'}{' '}
                  ·{' '}
                  {b.publishedYear ||
                    'Año ?'}{' '}
                  ·{' '}
                  {b.pages
                    ? `${b.pages} páginas`
                    : 'Páginas ?'}
                </li>
              ))}
            </ul>
          )}

          <h3 className="font-semibold text-sm mt-3">
            Agregar nuevo libro a este autor
          </h3>
          <form
            onSubmit={handleCreateBook}
            className="grid gap-2 md:grid-cols-4"
          >
            <input
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs"
              placeholder="Título"
              value={bookForm.title}
              onChange={(e) =>
                setBookForm({
                  ...bookForm,
                  title: e.target.value,
                })
              }
              required
            />
            <input
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs"
              placeholder="Género"
              value={bookForm.genre}
              onChange={(e) =>
                setBookForm({
                  ...bookForm,
                  genre: e.target.value,
                })
              }
            />
            <input
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs"
              placeholder="Páginas"
              value={bookForm.pages}
              onChange={(e) =>
                setBookForm({
                  ...bookForm,
                  pages: e.target.value,
                })
              }
            />
            <input
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs"
              placeholder="Año publicación"
              value={
                bookForm
                  .publishedYear
              }
              onChange={(e) =>
                setBookForm({
                  ...bookForm,
                  publishedYear:
                    e.target.value,
                })
              }
            />
            <button
              type="submit"
              className="md:col-span-4 bg-emerald-600 hover:bg-emerald-500 px-3 py-2 rounded text-xs font-semibold mt-1"
            >
              Crear libro
            </button>
          </form>
        </section>
      )}

      {tab === 'edit' && (
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <h2 className="font-semibold">
            Editar autor
          </h2>
          <form
            onSubmit={handleUpdateAuthor}
            className="grid gap-3 md:grid-cols-3"
          >
            <input
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm"
              value={editForm.name}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  name: e.target.value,
                })
              }
              placeholder="Nombre"
              required
            />
            <input
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm"
              value={editForm.email}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  email:
                    e.target.value,
                })
              }
              placeholder="Email"
              required
            />
            <input
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm"
              value={editForm.nationality}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  nationality:
                    e.target.value,
                })
              }
              placeholder="Nacionalidad"
            />
            <input
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm"
              value={editForm.birthYear}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  birthYear:
                    e.target.value,
                })
              }
              placeholder="Año de nacimiento"
            />
            <textarea
              className="md:col-span-3 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm"
              value={editForm.bio}
              onChange={(e) =>
                setEditForm({
                  ...editForm,
                  bio: e.target.value,
                })
              }
              placeholder="Biografía"
            />
            <button
              type="submit"
              className="md:col-span-3 bg-indigo-600 hover:bg-indigo-500 px-3 py-2 rounded text-sm font-semibold"
            >
              Guardar cambios
            </button>
          </form>
        </section>
      )}
    </main>
  )
}