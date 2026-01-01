# ✅ Deployment Checklist

## Progress

- [x] ✅ Code pushed to GitHub: https://github.com/mxbolu/ebe
- [x] ✅ Neon database created
- [ ] ⏳ Deploy to Vercel (IN PROGRESS)
- [ ] Configure environment variables
- [ ] Run database migrations
- [ ] Import books to production

---

## Your Neon Database Connection String

```
postgresql://neondb_owner:npg_uimA5cqkx6Bh@ep-proud-hat-ahfh1gs3-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

**⚠️ IMPORTANT**: Copy this string - you'll need it in Vercel!

---

## Step-by-Step: Deploy to Vercel

### 1. Go to Vercel
Open in your browser: **https://vercel.com**

### 2. Sign In
- Click **"Sign In"**
- Choose **"Continue with GitHub"**
- Authorize Vercel to access your GitHub

### 3. Import Your Project
- Click **"Add New..."** (top right)
- Select **"Project"**
- You'll see your GitHub repositories
- Find **"ebe"** in the list
- Click **"Import"**

### 4. Configure Project Settings

Vercel will auto-detect Next.js. Verify these settings:

- ✅ **Framework Preset**: Next.js
- ✅ **Root Directory**: `./`
- ✅ **Build Command**: `npm run build`
- ✅ **Output Directory**: `.next`
- ✅ **Install Command**: `npm install`

**These should all be correct automatically!**

### 5. Add Environment Variable (CRITICAL!)

**⚠️ DO THIS BEFORE CLICKING DEPLOY:**

1. Scroll down to **"Environment Variables"** section
2. Click to expand it
3. Add a new variable:
   - **Name**: `DATABASE_URL`
   - **Value**: (Paste your Neon connection string from above)
   - **Environments**: ✅ Check all three:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
4. Click **"Add"**

You should see: `DATABASE_URL` with a masked value

### 6. Deploy!

Now click the big **"Deploy"** button!

Vercel will:
1. Clone your repo
2. Install dependencies (~1 min)
3. Run `prisma generate` (via postbuild)
4. Build Next.js (~1-2 min)
5. Deploy to production

**Total time: 3-5 minutes**

Watch the build logs - you should see:
- ✅ Installing dependencies
- ✅ Prisma Client generated
- ✅ Next.js compiled
- ✅ Deployment complete

### 7. Get Your URL

Once deployed, Vercel gives you a URL like:
```
https://ebe-[random-string].vercel.app
```

**Copy this URL!**

---

## After Deployment: Run Migrations

Once your Vercel deployment succeeds, come back to this terminal and run:

### Install Vercel CLI (if not already installed)
```bash
npm i -g vercel
```

### Login to Vercel
```bash
vercel login
```

### Link Your Local Project to Vercel
```bash
cd /Users/boluwaji/Desktop/ebe
vercel link
```

Follow prompts:
- Set up and link? **Yes**
- Scope: Select your account
- Link to existing project? **Yes**
- Project name: **ebe**

### Pull Production Environment Variables
```bash
vercel env pull .env.production
```

### Run Database Migrations
```bash
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2- | tr -d '"') npx prisma migrate deploy
```

This creates all the tables in your production database.

### Test Your Production API
```bash
curl "https://your-vercel-url.vercel.app/api/books/search?query=test&limit=1"
```

Should return JSON (might be empty since no books yet).

---

## Import Books to Production (Optional but Recommended)

### Import 100K Books from Open Library (~30 minutes)
```bash
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2- | tr -d '"') npm run import:books:fast -- --limit=100000
```

### Or start smaller (10K books, ~5 minutes)
```bash
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2- | tr -d '"') npm run import:books:fast -- --limit=10000
```

---

## Troubleshooting

### Error: "Cannot connect to database"
- Make sure you added `DATABASE_URL` in Vercel environment variables
- Verify the connection string is correct (no extra spaces)
- Redeploy: Vercel dashboard > Deployments > Redeploy

### Error: "Prisma Client not generated"
- Should be handled by `postbuild` script
- If not, go to Vercel project settings > Build & Development Settings
- Build Command: `npx prisma generate && npm run build`

### Deployment Successful but API Returns 500
- Check Vercel logs: Vercel dashboard > Deployments > [latest] > Function Logs
- Most likely: DATABASE_URL not set correctly

---

## What Happens Next

After successful deployment:

1. **Every git push** automatically deploys to Vercel
2. **Your app is live** at the Vercel URL
3. **Free tier includes**:
   - Unlimited bandwidth
   - Automatic HTTPS
   - Global CDN
   - Automatic previews for pull requests

---

## Your Resources

- **GitHub Repo**: https://github.com/mxbolu/ebe
- **Neon Dashboard**: https://console.neon.tech
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Vercel URL**: (You'll get this after deployment)

---

## Summary

✅ Code on GitHub
✅ Database ready (Neon)
⏳ Ready to deploy to Vercel

**Next Action**: Go to https://vercel.com and follow steps above!
