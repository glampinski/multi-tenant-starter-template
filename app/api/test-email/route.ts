import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    console.log('🧪 Testing Resend email functionality...');
    
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }
    
    console.log('📧 Testing email send to:', email);
    console.log('🔑 RESEND_API_KEY set:', !!process.env.RESEND_API_KEY);
    
    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Test Email from Multi-Tenant App',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Test Email Success! 🎉</h2>
          <p>This test email confirms that Resend is working correctly.</p>
          <p>Sent at: ${new Date().toISOString()}</p>
        </div>
      `,
    });
    
    console.log('✅ Test email sent successfully:', result);
    
    return NextResponse.json({ 
      success: true, 
      result,
      message: 'Test email sent successfully'
    });
  } catch (error) {
    console.error('❌ Test email error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage,
      stack: errorStack 
    }, { status: 500 });
  }
}
