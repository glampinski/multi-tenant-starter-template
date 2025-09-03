import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST: Create lead from public invitation request
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const {
      firstName,
      lastName,
      email,
      company,
      position,
      notes
    } = data

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json({ 
        error: 'First name, last name, and email are required' 
      }, { status: 400 })
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        error: 'Please enter a valid email address' 
      }, { status: 400 })
    }

    // Check if email already exists in customers
    const existingCustomer = await prisma.customer.findUnique({
      where: { email }
    })

    if (existingCustomer) {
      return NextResponse.json({ 
        error: 'A request with this email address has already been submitted' 
      }, { status: 400 })
    }

    // Check if user already has access (exists in UserProfile)
    const existingUser = await prisma.userProfile.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ 
        error: 'This email address already has platform access. Please try signing in instead.' 
      }, { status: 400 })
    }

    // Create lead in customer system
    const customer = await prisma.customer.create({
      data: {
        firstName,
        lastName,
        email,
        company: company || null,
        position: position || null,
        status: 'LEAD',
        source: 'invitation_request',
        priority: 'medium',
        notes: notes || null,
        tags: ['invitation_request'],
        teamId: 'main_team' // Default team
      }
    })

    console.log(`📧 New invitation request: ${firstName} ${lastName} (${email})`)

    return NextResponse.json({ 
      message: 'Invitation request submitted successfully',
      id: customer.id
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating invitation request:', error)
    return NextResponse.json({ 
      error: 'Failed to submit request. Please try again.' 
    }, { status: 500 })
  }
}
