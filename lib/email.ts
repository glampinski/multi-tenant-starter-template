import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationRequest({
  identifier: email,
  url,
  provider,
}: {
  identifier: string;
  url: string;
  provider: any;
}): Promise<void> {
  console.log('🔍 sendVerificationRequest called with:', { email, url: url.substring(0, 50) + '...', provider: provider.from });
  
  try {
    // Validate inputs
    if (!email) {
      throw new Error('Email identifier is required');
    }
    
    if (!url) {
      throw new Error('Verification URL is required');
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error(`Invalid email format: ${email}`);
    }
    
    // Validate URL format
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new Error(`Invalid URL format: ${url}`);
    }
    
    console.log('🔧 Validation passed, sending email...');
    
    const { data, error } = await resend.emails.send({
      from: provider.from,
      to: email,
      subject: `Sign in to ${process.env.NEXT_PUBLIC_COMPANY_NAME || 'Multi-Tenant App'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">Sign in to your account</h2>
          <p style="color: #666; font-size: 16px;">
            Click the button below to sign in to your ${process.env.NEXT_PUBLIC_COMPANY_NAME || 'Multi-Tenant App'} account:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a 
              href="${url}" 
              style="
                background-color: #007bff; 
                color: white; 
                padding: 12px 24px; 
                text-decoration: none; 
                border-radius: 5px; 
                font-weight: bold;
                display: inline-block;
              "
            >
              Sign In
            </a>
          </div>
          <p style="color: #999; font-size: 14px;">
            If you didn't request this email, you can safely ignore it.
          </p>
          <p style="color: #999; font-size: 14px;">
            This link will expire in 24 hours.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log('✅ Magic link sent successfully:', data);
    // Don't return data, NextAuth expects void
  } catch (error) {
    console.error('💥 Failed to send verification email:', error);
    throw error;
  }
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  console.log('🔍 sendEmail called with:', { to, subject });
  
  try {
    // Validate inputs
    if (!to) {
      throw new Error('Recipient email is required');
    }
    
    if (!subject) {
      throw new Error('Email subject is required');
    }
    
    if (!html) {
      throw new Error('Email content is required');
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      throw new Error(`Invalid email format: ${to}`);
    }
    
    const data = await resend.emails.send({
      from: 'noreply@yourapp.com',
      to,
      subject,
      html,
    });
    
    console.log('✅ Email sent successfully:', data);
  } catch (error) {
    console.error('💥 Failed to send email:', error);
    throw error;
  }
}
