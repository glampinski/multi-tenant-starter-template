# Authentication Guide

## How Authentication Works in This Application

This application uses **passwordless authentication** via email (magic links), not traditional passwords.

### Current Setup

- **Authentication Provider**: NextAuth with Email Provider
- **No Passwords**: Users authenticate via email links only
- **Magic Links**: When you enter your email, you receive a clickable link to sign in
- **Super Admin**: Created via bootstrap script, no password required

## Logging Out

### From Admin Panel
- Click the **"Logout"** button in the top-right corner of the admin panel
- You'll be redirected to the signin page

### From Other Pages
- Use the logout functionality in the respective page components
- Or manually go to `/auth/signin` and start a new session

## Logging Back In

### Steps to Log In:
1. **Go to Sign In Page**: Navigate to `/auth/signin` or click "Login" from any page
2. **Enter Your Email**: Use the same email you used during setup
   - For Super Admin: Use the email from your `SUPER_ADMIN_EMAIL` environment variable
3. **Check Your Email**: You'll receive an email with a "Sign in" link
4. **Click the Link**: This will authenticate you and redirect you to the dashboard

### For Super Admin:
- **Email**: The email you set in `SUPER_ADMIN_EMAIL` environment variable
- **No Password**: You'll receive a magic link in your email
- **Default Redirect**: You'll be redirected to `/dashboard/main_team` after signing in

## Important Notes

### Email Configuration
Make sure your email settings are properly configured in `.env.local`:
```env
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=your-email@example.com
SUPER_ADMIN_EMAIL=admin@example.com
```

### If You Can't Access Email
If you lose access to your email account:

1. **Update Environment Variable**: Change `SUPER_ADMIN_EMAIL` in `.env.local`
2. **Update Database**: Run the super admin creation script again:
   ```bash
   npm run create-super-admin
   ```
3. **Or Manual Database Update**: Directly update the email in your database

### Testing Email Locally
- Make sure Resend API key is valid
- Check spam/junk folder for magic link emails
- Verify `EMAIL_FROM` is a verified domain in Resend

## Troubleshooting

### Can't Receive Emails?
1. Check your Resend dashboard for delivery status
2. Verify the email address is correct
3. Check spam/junk folders
4. Ensure your domain is verified in Resend

### Session Issues?
1. Clear browser cookies for your domain
2. Try incognito/private browsing mode
3. Check browser console for errors

### Development Mode
- Magic links work in development
- Make sure `NEXTAUTH_URL` matches your local URL (usually `http://localhost:3000`)

## Security Benefits

### Why Passwordless?
- **No Password Attacks**: Eliminates password-based attacks
- **Reduced Support**: No password reset requests
- **Better UX**: Users don't need to remember passwords
- **Email Security**: Relies on email account security (usually strong)

### Magic Link Security
- Links expire after use
- Time-limited validity
- Tied to specific email addresses
- Can't be guessed or brute-forced
