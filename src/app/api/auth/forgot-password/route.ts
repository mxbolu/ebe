import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import prisma from '@/lib/prisma'
import { generateOTP, sendPasswordResetEmail } from '@/lib/email/service'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validationResult = forgotPasswordSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    const { email } = validationResult.data

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Don't reveal if user exists or not for security
    if (!user) {
      return NextResponse.json(
        { message: 'If an account exists with this email, a password reset code has been sent.' },
        { status: 200 }
      )
    }

    // Generate reset OTP
    const otp = generateOTP()
    const otpExpiry = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Update user with reset OTP
    await prisma.user.update({
      where: { email },
      data: {
        resetOTP: otp,
        resetOTPExpiry: otpExpiry,
      },
    })

    // Send password reset email
    await sendPasswordResetEmail(email, user.name || user.username, otp)

    return NextResponse.json(
      { message: 'If an account exists with this email, a password reset code has been sent.' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    )
  }
}
