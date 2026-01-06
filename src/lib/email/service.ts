import nodemailer from 'nodemailer'
import otpGenerator from 'otp-generator'

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    console.log('📧 [EMAIL SERVICE] Attempting to send email...')
    console.log('Environment:', process.env.NODE_ENV)
    console.log('To:', options.to)
    console.log('Subject:', options.subject)
    console.log('SMTP Config Check:')
    console.log('  - SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET')
    console.log('  - SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET')
    console.log('  - SMTP_USER:', process.env.SMTP_USER ? '✓ SET' : '✗ NOT SET')
    console.log('  - SMTP_PASS:', process.env.SMTP_PASS ? '✓ SET' : '✗ NOT SET')
    console.log('  - EMAIL_FROM:', process.env.EMAIL_FROM_ADDRESS || 'NOT SET')

    // Skip email sending if SMTP is not configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log('⚠️ SMTP not configured. Skipping email send.')
      console.log('Email content would have been:')
      console.log('To:', options.to)
      console.log('Subject:', options.subject)
      console.log('Content:', options.text || options.html)
      return true // Return success to avoid blocking user flows
    }

    console.log('✅ SMTP configured, attempting to send...')

    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'ebe'}" <${process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    })

    console.log('✅ Email sent successfully!')
    console.log('Message ID:', info.messageId)
    console.log('Response:', info.response)
    return true
  } catch (error) {
    console.error('❌ [EMAIL SERVICE] Error sending email:', error)
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return false
  }
}

export function generateOTP(length: number = 6): string {
  return otpGenerator.generate(length, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
    digits: true,
  })
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  otp: string
): Promise<boolean> {
  const subject = 'Verify Your Email - ebe'
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp-box { background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to ebe!</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>Thank you for signing up! Please verify your email address using the code below:</p>

          <div class="otp-box">
            <p style="margin: 0; color: #666; font-size: 14px;">Your verification code</p>
            <div class="otp-code">${otp}</div>
          </div>

          <p>This code will expire in 15 minutes.</p>
          <p>If you didn't create an account, you can safely ignore this email.</p>

          <p>Happy reading!<br>The ebe team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
    Welcome to ebe!

    Hi ${name},

    Thank you for signing up! Please verify your email address using the code below:

    Verification Code: ${otp}

    This code will expire in 15 minutes.

    If you didn't create an account, you can safely ignore this email.

    Happy reading!
    The ebe team
  `

  return sendEmail({ to: email, subject, html, text })
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  otp: string
): Promise<boolean> {
  const subject = 'Reset Your Password - ebe'
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp-box { background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>We received a request to reset your password. Use the code below to proceed:</p>

          <div class="otp-box">
            <p style="margin: 0; color: #666; font-size: 14px;">Your password reset code</p>
            <div class="otp-code">${otp}</div>
          </div>

          <p>This code will expire in 15 minutes.</p>

          <div class="warning">
            <strong>⚠️ Security Notice:</strong> If you didn't request a password reset, please ignore this email and ensure your account is secure.
          </div>

          <p>Stay safe,<br>The ebe team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
    Password Reset Request

    Hi ${name},

    We received a request to reset your password. Use the code below to proceed:

    Password Reset Code: ${otp}

    This code will expire in 15 minutes.

    ⚠️ Security Notice: If you didn't request a password reset, please ignore this email and ensure your account is secure.

    Stay safe,
    The ebe team
  `

  return sendEmail({ to: email, subject, html, text })
}

export async function sendMeetingReminderEmail(
  email: string,
  name: string,
  meetingTitle: string,
  bookClubName: string,
  scheduledAt: Date,
  duration: number,
  bookClubId: string,
  meetingId: string,
  minutesBefore: number
): Promise<boolean> {
  const timeStr = scheduledAt.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const meetingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'}/clubs/${bookClubId}`

  const subject = `Reminder: "${meetingTitle}" starts in ${minutesBefore} minutes`
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .meeting-card { background: white; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .meeting-details { margin: 10px 0; }
        .detail-row { display: flex; margin: 8px 0; }
        .detail-label { font-weight: bold; min-width: 120px; color: #666; }
        .detail-value { color: #333; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📅 Meeting Reminder</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p><strong>Your meeting starts in ${minutesBefore} minutes!</strong></p>

          <div class="meeting-card">
            <h2 style="margin-top: 0; color: #667eea;">${meetingTitle}</h2>
            <div class="meeting-details">
              <div class="detail-row">
                <span class="detail-label">📚 Book Club:</span>
                <span class="detail-value">${bookClubName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">🕐 When:</span>
                <span class="detail-value">${timeStr}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">⏱️ Duration:</span>
                <span class="detail-value">${duration} minutes</span>
              </div>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${meetingUrl}" class="cta-button">🎥 Join Meeting</a>
          </div>

          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            <strong>Tip:</strong> Make sure your camera and microphone are working before you join.
          </p>

          <p>See you there!<br>The ebe team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
    Meeting Reminder

    Hi ${name},

    Your meeting starts in ${minutesBefore} minutes!

    Meeting: ${meetingTitle}
    Book Club: ${bookClubName}
    When: ${timeStr}
    Duration: ${duration} minutes

    Join the meeting: ${meetingUrl}

    Tip: Make sure your camera and microphone are working before you join.

    See you there!
    The ebe team
  `

  return sendEmail({ to: email, subject, html, text })
}

export async function sendMeetingScheduledEmail(
  email: string,
  name: string,
  meetingTitle: string,
  bookClubName: string,
  scheduledAt: Date,
  duration: number,
  bookClubId: string,
  meetingId: string
): Promise<boolean> {
  const timeStr = scheduledAt.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const meetingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://yourdomain.com'}/clubs/${bookClubId}`

  const subject = `New Meeting Scheduled: "${meetingTitle}"`
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .meeting-card { background: white; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .meeting-details { margin: 10px 0; }
        .detail-row { display: flex; margin: 8px 0; }
        .detail-label { font-weight: bold; min-width: 120px; color: #666; }
        .detail-value { color: #333; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📅 New Meeting Scheduled</h1>
        </div>
        <div class="content">
          <p>Hi ${name},</p>
          <p>A new meeting has been scheduled in <strong>${bookClubName}</strong>!</p>

          <div class="meeting-card">
            <h2 style="margin-top: 0; color: #667eea;">${meetingTitle}</h2>
            <div class="meeting-details">
              <div class="detail-row">
                <span class="detail-label">📚 Book Club:</span>
                <span class="detail-value">${bookClubName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">🕐 When:</span>
                <span class="detail-value">${timeStr}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">⏱️ Duration:</span>
                <span class="detail-value">${duration} minutes</span>
              </div>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${meetingUrl}" class="cta-button">View Meeting Details</a>
          </div>

          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            You'll receive a reminder 15 minutes before the meeting starts.
          </p>

          <p>Looking forward to seeing you there!<br>The ebe team</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
    New Meeting Scheduled

    Hi ${name},

    A new meeting has been scheduled in ${bookClubName}!

    Meeting: ${meetingTitle}
    When: ${timeStr}
    Duration: ${duration} minutes

    View details: ${meetingUrl}

    You'll receive a reminder 15 minutes before the meeting starts.

    Looking forward to seeing you there!
    The ebe team
  `

  return sendEmail({ to: email, subject, html, text })
}
