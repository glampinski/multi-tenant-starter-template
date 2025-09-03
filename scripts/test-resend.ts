import { Resend } from 'resend';

const resend = new Resend('re_DAnqfWnx_GbLCJZukJTzYanxbYDskDeUD');

async function testResend() {
  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'glampinski@gmail.com', // Use your verified email
      subject: 'Test Email from Multi-Tenant App',
      html: '<p>Congrats! Resend is working correctly for your <strong>multi-tenant app</strong>!</p>'
    });

    if (error) {
      console.error('❌ Resend error:', error);
    } else {
      console.log('✅ Email sent successfully:', data);
    }
  } catch (error) {
    console.error('💥 Failed to send email:', error);
  }
}

testResend();
