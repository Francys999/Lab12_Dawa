import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search') || ''
    const genre = searchParams.get('genre') || ''
    const authorName = searchParams.get('authorName') || ''

    const page = parseInt(searchParams.get('page') || '1', 10)
    const limitRaw = parseInt(searchParams.get('limit') || '10', 10)
    const sortByParam = searchParams.get('sortBy') || 'createdAt'
    const orderParam = searchParams.get('order') || 'desc'

    // Validar página y límite
    const currentPage = page > 0 ? page : 1
    const limit =
      limitRaw > 0
        ? limitRaw > 50
          ? 50
          : limitRaw
        : 10

    // Campos permitidos para ordenar
    const allowedSortFields = [
      'title',
      'publishedYear',
      'createdAt',
    ] as const
    type SortField = (typeof allowedSortFields)[number]

    const sortBy: SortField = allowedSortFields.includes(
      sortByParam as SortField
    )
      ? (sortByParam as SortField)
      : 'createdAt'

    const order: 'asc' | 'desc' =
      orderParam === 'asc' ? 'asc' : 'desc'

    const skip = (currentPage - 1) * limit

    // Construir filtros dinámicos (usamos any para evitar choque estricto de tipos en build)
    const AND: any[] = []

    if (search) {
      AND.push({
        title: {
          contains: search,
          mode: 'insensitive' as const,
        },
      })
    }

    if (genre) {
      AND.push({
        genre: genre,
      })
    }

    if (authorName) {
      AND.push({
        author: {
          name: {
            contains: authorName,
            mode: 'insensitive' as const,
          },
        },
      })
    }

    const where: any = {}
    if (AND.length > 0) {
      where.AND = AND
    }

    // Consultas: total + datos paginados
    const [total, books] = await Promise.all([
      prisma.book.count({ where }),
      prisma.book.findMany({
        where,
        include: {
          author: true,
        },
        orderBy: {
          [sortBy]: order,
        },
        skip,
        take: limit,
      }),
    ])

    const totalPages =
      total === 0
        ? 1
        : Math.ceil(total / limit)

    return NextResponse.json({
      data: books,
      pagination: {
        page: currentPage,
        limit,
        total,
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
      },
    })
  } catch (error) {
    console.error('Error en /api/books/search', error)
    return NextResponse.json(
      {
        error:
          'Error al buscar libros',
      },
      { status: 500 }
    )
  }
}