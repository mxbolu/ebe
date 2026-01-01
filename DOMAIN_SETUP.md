# Domain Configuration - iwewa.com

## Domain Status: ✅ LIVE

Your application is now accessible at:
- **Primary URL**: https://iwewa.com
- **WWW Redirect**: https://www.iwewa.com → https://iwewa.com
- **Previous URL**: https://ebe-ruby.vercel.app (still active)

## DNS Configuration

### Current DNS Records (GoDaddy)

| Type | Name | Value | TTL | Purpose |
|------|------|-------|-----|---------|
| **A** | @ | `76.76.21.21` | 600 | Points apex domain to Vercel |
| **CNAME** | www | `cname.vercel-dns.com` | 600 | Points www subdomain to Vercel |

### Verification Status
- ✅ Domain verified in Vercel
- ✅ DNS records propagated
- ✅ HTTPS/SSL certificate active
- ✅ www redirects to apex domain (308 permanent redirect)

## Vercel Configuration

### Domain Settings
- **Project**: ebe
- **Project ID**: prj_DUF6svf1vnyG37zWGW2pgHwkAuup
- **Primary Domain**: iwewa.com
- **Redirect Domain**: www.iwewa.com → iwewa.com (HTTP 308)
- **SSL/TLS**: Automatic (Let's Encrypt)

### Deployment URLs
1. **Production**: https://iwewa.com
2. **Vercel Default**: https://ebe-ruby.vercel.app
3. **Git Branch Previews**: https://ebe-git-[branch]-mxbolus-projects.vercel.app

## Email Configuration

Since you're using a custom domain, ensure your email sender address is properly configured:

### Current SMTP Settings
- **From Name**: ebe
- **From Email**: boluwaji@iwewa.com
- **SMTP Provider**: Brevo

### Brevo Sender Verification
Make sure `boluwaji@iwewa.com` is verified in your Brevo account:
1. Go to https://app.brevo.com/settings/senders
2. Verify that boluwaji@iwewa.com is in the verified senders list
3. If not, add and verify it using the email verification process

## DNS Propagation

- **Initial Setup**: 2026-01-01 18:55 UTC
- **Propagation Time**: ~5-10 minutes (completed)
- **Full Global Propagation**: Up to 48 hours

### Check Propagation Status
Use these tools to verify DNS propagation globally:
- https://dnschecker.org/#A/iwewa.com
- https://www.whatsmydns.net/#A/iwewa.com

## SSL/TLS Certificate

Vercel automatically provisions and renews SSL certificates:
- **Provider**: Let's Encrypt
- **Auto-Renewal**: Yes
- **Renewal Period**: Every 90 days
- **Status**: Active

## Troubleshooting

### Domain Not Loading
1. Check DNS records in GoDaddy DNS management
2. Verify A record points to `76.76.21.21`
3. Verify CNAME for www points to `cname.vercel-dns.com`
4. Wait up to 48 hours for full DNS propagation
5. Clear browser cache and try incognito mode

### SSL Certificate Issues
1. SSL is automatically provisioned by Vercel
2. If you see certificate warnings, wait 10-15 minutes
3. Check https://vercel.com/mxbolus-projects/ebe/settings/domains

### Email Sending Issues
1. Verify sender email in Brevo dashboard
2. Check SMTP credentials in Vercel environment variables
3. Ensure `EMAIL_FROM_ADDRESS` matches verified sender in Brevo

## Making Changes

### Adding a Subdomain
To add a subdomain (e.g., api.iwewa.com):

1. **In GoDaddy**:
   ```
   Type: CNAME
   Name: api
   Value: cname.vercel-dns.com
   TTL: 600
   ```

2. **In Vercel** (via API):
   ```bash
   curl -X POST "https://api.vercel.com/v10/projects/prj_DUF6svf1vnyG37zWGW2pgHwkAuup/domains" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name": "api.iwewa.com"}'
   ```

### Removing the Domain
If you need to remove the domain:

1. **In Vercel Dashboard**:
   - Go to Project Settings → Domains
   - Click on iwewa.com → Remove

2. **In GoDaddy**:
   - Go to DNS Management
   - Delete the A and CNAME records pointing to Vercel

## Monitoring

### Domain Health Checks
- **Uptime Monitoring**: Consider using UptimeRobot or Pingdom
- **SSL Monitoring**: https://www.ssllabs.com/ssltest/analyze.html?d=iwewa.com
- **DNS Monitoring**: Monitor DNS record changes in GoDaddy

### Vercel Analytics
- Access analytics at: https://vercel.com/mxbolus-projects/ebe/analytics
- Monitor traffic, performance, and errors

## Important Notes

1. **DNS Changes**: Any future DNS changes may take up to 48 hours to propagate globally
2. **SSL Certificate**: Automatically renewed by Vercel - no action needed
3. **Previous Domain**: The old ebe-ruby.vercel.app URL will continue to work
4. **Email Sender**: Must use verified sender addresses in production
5. **Cookies**: JWT cookies are set with domain=iwewa.com in production

## Support

- **Vercel Support**: https://vercel.com/support
- **GoDaddy Support**: https://www.godaddy.com/help
- **DNS Issues**: Check https://dnschecker.org
- **SSL Issues**: Check https://www.ssllabs.com/ssltest/

---

**Setup Completed**: 2026-01-01
**Domain**: iwewa.com
**Status**: ✅ Active and Verified
