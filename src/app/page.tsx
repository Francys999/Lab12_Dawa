// src/app/page.tsx
'use client'

import { useEffect, useState } from 'react'

type Author = {
  id: string
  name: string
  email: string
}

export default function HomePage() {
  const [authors, setAuthors] = useState<Author[]>([])
  const [totalBooks, setTotalBooks] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '' })
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const loadAuthors = async () => {
    setLoading(true)
    setErr('')
    try {
      const res = await fetch('/api/authors')
      const data = await res.json()
      setAuthors(Array.isArray(data) ? data : [])
    } catch {
      setErr('Error al cargar autores')
    } finally {
      setLoading(false)
    }
  }

  const loadBooksCount = async () => {
    try {
      const res = await fetch('/api/books')
      const data = await res.json()
      if (Array.isArray(data)) {
        setTotalBooks(data.length)
      }
    } catch {
      // ignorar errores de conteo
    }
  }

  useEffect(() => {
    loadAuthors()
    loadBooksCount()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg('')
    setErr('')
    try {
      const res = await fetch('/api/authors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setErr(data.error || 'Error al crear autor')
        return
      }
      setMsg('Autor creado correctamente')
      setForm({ name: '', email: '' })
      loadAuthors()
    } catch {
      setErr('Error al crear autor')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este autor?')) return
    setMsg('')
    setErr('')
    try {
      const res = await fetch(`/api/authors/${id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) {
        setErr(data.error || 'Error al eliminar autor')
        return
      }
      setMsg('Autor eliminado')
      loadAuthors()
      loadBooksCount()
    } catch {
      setErr('Error al eliminar autor')
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard Biblioteca</h1>

      {/* Botón para ir a la página de búsqueda de libros */}
      <div className="flex gap-3">
        <a
          href="/books"
          className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold"
        >
          Ir a búsqueda de libros
        </a>
      </div>

      {/* Estadísticas generales */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <p className="text-xs text-slate-400">Total autores</p>
          <p className="text-2xl font-semibold">{authors.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <p className="text-xs text-slate-400">Total libros</p>
          <p className="text-2xl font-semibold">{totalBooks}</p>
        </div>
      </section>

      {/* Crear autor */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <h2 className="text-xl font-semibold">Crear autor</h2>
        <form
          onSubmit={handleCreate}
          className="flex flex-col md:flex-row gap-3"
        >
          <input
            className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm"
            placeholder="Nombre"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded text-sm font-semibold"
          >
            Guardar
          </button>
        </form>
        {err && <p className="text-red-400 text-sm">{err}</p>}
        {msg && <p className="text-emerald-400 text-sm">{msg}</p>}
      </section>

      {/* Lista de autores con botones separados */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Autores</h2>
          <button
            onClick={() => {
              loadAuthors()
              loadBooksCount()
            }}
            className="text-xs border border-slate-600 px-2 py-1 rounded"
          >
            Refrescar
          </button>
        </div>

        {loading ? (
          <p>Cargando...</p>
        ) : authors.length === 0 ? (
          <p className="text-slate-400 text-sm">No hay autores aún.</p>
        ) : (
          <ul className="space-y-2">
            {authors.map((a) => (
              <li
                key={a.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 bg-slate-950/60 border border-slate-800 rounded px-3 py-2"
              >
                <div>
                  <p className="font-semibold">{a.name}</p>
                  <p className="text-xs text-slate-400">{a.email}</p>
                </div>
                <div className="flex gap-2 text-xs">
                  {/* Ver detalle (info + estadísticas) */}
                  <a
                    href={`/authors/${a.id}?tab=info`}
                    className="px-2 py-1 rounded bg-sky-600 hover:bg-sky-500"
                  >
                    Ver detalle
                  </a>

                  {/* Ver libros del autor */}
                  <a
                    href={`/authors/${a.id}?tab=books`}
                    className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500"
                  >
                    Ver libros
                  </a>

                  {/* Editar autor */}
                  <a
                    href={`/authors/${a.id}?tab=edit`}
                    className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600"
                  >
                    Editar
                  </a>

                  {/* Eliminar autor */}
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="px-2 py-1 rounded bg-red-600 hover:bg-red-500"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
