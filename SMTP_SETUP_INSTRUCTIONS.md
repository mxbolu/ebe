# SMTP Configuration for Vercel

## Brevo SMTP Credentials (Already Set Up!)

Your Brevo account is ready. Below are the environment variables that need to be added to Vercel.

## Option 1: Add via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/mxbolus-projects/ebe/settings/environment-variables
2. Add each of these variables for **Production** environment:

| Variable Name | Value |
|--------------|-------|
| `SMTP_HOST` | `smtp-relay.brevo.com` |
| `SMTP_PORT` | `587` |
| `SMTP_SECURE` | `false` |
| `SMTP_USER` | `9f1f7f001@smtp-brevo.com` |
| `SMTP_PASS` | `6Pva8BMKnOcqUfkR` |
| `EMAIL_FROM_NAME` | `ebe` |
| `EMAIL_FROM_ADDRESS` | `boluwaji@iwewa.com` |

3. After adding all variables, redeploy your app

## Option 2: Use Vercel CLI

```bash
# Login to Vercel
npx vercel login

# Add each environment variable
echo "smtp-relay.brevo.com" | npx vercel env add SMTP_HOST production
echo "587" | npx vercel env add SMTP_PORT production
echo "false" | npx vercel env add SMTP_SECURE production
echo "9f1f7f001@smtp-brevo.com" | npx vercel env add SMTP_USER production
echo "6Pva8BMKnOcqUfkR" | npx vercel env add SMTP_PASS production
echo "ebe" | npx vercel env add EMAIL_FROM_NAME production
echo "boluwaji@iwewa.com" | npx vercel env add EMAIL_FROM_ADDRESS production

# Redeploy
npx vercel --prod
```

## Test Email Sending

After deployment, test the email functionality:

1. **Sign up a new user** at https://ebe-ruby.vercel.app/signup
2. Check the email inbox for the verification code
3. Test **forgot password** flow at https://ebe-ruby.vercel.app/forgot-password

## Brevo Dashboard

Monitor your emails at:
- Dashboard: https://app.brevo.com/
- Email stats: https://app.brevo.com/statistics/email
- SMTP settings: https://app.brevo.com/settings/keys/smtp

## Troubleshooting

If emails don't arrive:
1. Check Brevo dashboard for sending logs
2. Check spam folder
3. Verify all environment variables are set in Vercel
4. Check Vercel deployment logs for errors

## Email Limits

- **Free tier**: 300 emails/day
- Current usage visible in Brevo dashboard
- Upgrade if needed at https://app.brevo.com/settings/plan
