import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET: Fetch customers
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const salesPersonId = searchParams.get('salesPersonId') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status) {
      where.status = status
    }

    if (salesPersonId) {
      where.salesPersonId = salesPersonId
    }

    // Check user permissions - sales people can only see their customers
    const userProfile = await prisma.userProfile.findUnique({
      where: { id: session.user.id }
    })

    if (userProfile?.role === 'SALES_PERSON') {
      where.salesPersonId = session.user.id
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          salesPerson: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.customer.count({ where })
    ])

    return NextResponse.json({
      customers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: Create new customer
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()
    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      position,
      status = 'LEAD',
      source,
      priority = 'medium',
      estimatedValue,
      notes,
      tags = [],
      salesPersonId
    } = data

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json({ 
        error: 'First name, last name, and email are required' 
      }, { status: 400 })
    }

    // Check if email already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { email }
    })

    if (existingCustomer) {
      return NextResponse.json({ 
        error: 'Customer with this email already exists' 
      }, { status: 400 })
    }

    // Get user's team for workspace isolation
    const userProfile = await prisma.userProfile.findUnique({
      where: { id: session.user.id }
    })

    const customer = await prisma.customer.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        company,
        position,
        status,
        source,
        priority,
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : null,
        notes,
        tags,
        salesPersonId: salesPersonId || session.user.id,
        teamId: userProfile?.teamId || null
      },
      include: {
        salesPerson: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      customer,
      message: 'Customer created successfully'
    })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: Update customer
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await req.json()
    const { id, ...updateData } = data

    if (!id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 })
    }

    // Check if customer exists and user has permission
    const existingCustomer = await prisma.customer.findUnique({
      where: { id }
    })

    if (!existingCustomer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Check permissions - sales people can only update their customers
    const userProfile = await prisma.userProfile.findUnique({
      where: { id: session.user.id }
    })

    if (userProfile?.role === 'SALES_PERSON' && existingCustomer.salesPersonId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Clean update data
    if (updateData.estimatedValue) {
      updateData.estimatedValue = parseFloat(updateData.estimatedValue)
    }
    if (updateData.actualValue) {
      updateData.actualValue = parseFloat(updateData.actualValue)
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: updateData,
      include: {
        salesPerson: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ 
      success: true, 
      customer,
      message: 'Customer updated successfully'
    })
  } catch (error) {
    console.error('Error updating customer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
