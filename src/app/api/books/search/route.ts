// src/app/api/books/search/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

const ALLOWED_SORT_FIELDS = ['title', 'publishedYear', 'createdAt'] as const
type SortField = (typeof ALLOWED_SORT_FIELDS)[number]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const search = searchParams.get('search') || ''
    const genre = searchParams.get('genre') || ''
    const authorName = searchParams.get('authorName') || ''

    const page = Math.max(parseInt(searchParams.get('page') || '1', 10), 1)

    let limit = parseInt(searchParams.get('limit') || '10', 10)
    if (isNaN(limit) || limit <= 0) limit = 10
    if (limit > 50) limit = 50

    const sortByParam = (searchParams.get('sortBy') || 'createdAt') as SortField
    const sortBy: SortField = ALLOWED_SORT_FIELDS.includes(sortByParam)
      ? sortByParam
      : 'createdAt'

    const orderParam = (searchParams.get('order') || 'desc').toLowerCase()
    const order: 'asc' | 'desc' =
      orderParam === 'asc' || orderParam === 'desc' ? orderParam : 'desc'

    const where = {
      AND: [
        search
          ? {
              title: {
                contains: search,
                mode: 'insensitive',
              },
            }
          : {},
        genre ? { genre } : {},
        authorName
          ? {
              author: {
                name: {
                  contains: authorName,
                  mode: 'insensitive',
                },
              },
            }
          : {},
      ],
    }

    const total = await prisma.book.count({ where })

    const books = await prisma.book.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        [sortBy]: order,
      },
      skip: (page - 1) * limit,
      take: limit,
    })

    const totalPages = total > 0 ? Math.ceil(total / limit) : 0

    return NextResponse.json({
      data: books,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1 && totalPages > 0,
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Error en la búsqueda de libros' },
      { status: 500 }
    )
  }
}
