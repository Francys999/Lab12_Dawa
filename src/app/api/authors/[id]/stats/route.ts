// src/app/api/authors/[id]/stats/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Verificar que el autor exista
    const author = await prisma.author.findUnique({
      where: { id },
    })

    if (!author) {
      return NextResponse.json(
        { error: 'Autor no encontrado' },
        { status: 404 }
      )
    }

    // Obtener todos los libros del autor
    const books = await prisma.book.findMany({
      where: { authorId: id },
    })

    const totalBooks = books.length

    if (totalBooks === 0) {
      // Caso sin libros: devolver estructura completa pero vacía
      return NextResponse.json({
        authorId: author.id,
        authorName: author.name,
        totalBooks: 0,
        firstBook: null,
        latestBook: null,
        averagePages: 0,
        genres: [],
        longestBook: null,
        shortestBook: null,
      })
    }

    // Libros con año definido (para first y latest)
    const withYear = books.filter((b) => b.publishedYear !== null)
    const sortedByYear = [...withYear].sort(
      (a, b) => (a.publishedYear || 0) - (b.publishedYear || 0)
    )

    const firstBook =
      sortedByYear.length > 0
        ? {
            title: sortedByYear[0].title,
            year: sortedByYear[0].publishedYear as number,
          }
        : null

    const latestBook =
      sortedByYear.length > 0
        ? {
            title: sortedByYear[sortedByYear.length - 1].title,
            year: sortedByYear[sortedByYear.length - 1]
              .publishedYear as number,
          }
        : null

    // Promedio de páginas (solo libros con pages válidas)
    const withPages = books.filter(
      (b) => typeof b.pages === 'number' && b.pages !== null
    )
    const averagePages =
      withPages.length > 0
        ? Math.round(
            withPages.reduce(
              (sum, b) => sum + (b.pages || 0),
              0
            ) / withPages.length
          )
        : 0

    // Lista de géneros únicos
    const genres = Array.from(
      new Set(
        books
          .map((b) => b.genre)
          .filter(
            (g): g is string => !!g && g.trim() !== ''
          )
      )
    )

    // Libro con más páginas
    const longestBookRaw =
      withPages.length > 0
        ? withPages.reduce((max, b) =>
            (b.pages || 0) > (max.pages || 0) ? b : max
          )
        : null

    const longestBook = longestBookRaw
      ? {
          title: longestBookRaw.title,
          pages: longestBookRaw.pages as number,
        }
      : null

    // Libro con menos páginas (>0)
    const positivePages = withPages.filter(
      (b) => (b.pages || 0) > 0
    )

    const shortestBookRaw =
      positivePages.length > 0
        ? positivePages.reduce((min, b) =>
            (b.pages || 0) < (min.pages || 0) ? b : min
          )
        : null

    const shortestBook = shortestBookRaw
      ? {
          title: shortestBookRaw.title,
          pages: shortestBookRaw.pages as number,
        }
      : null

    // Respuesta EXACTA como ejemplo del profe
    return NextResponse.json({
      authorId: author.id,
      authorName: author.name,
      totalBooks,
      firstBook,
      latestBook,
      averagePages,
      genres,
      longestBook,
      shortestBook,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      {
        error:
          'Error al obtener estadísticas del autor',
      },
      { status: 500 }
    )
  }
}