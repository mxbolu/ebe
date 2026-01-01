#!/usr/bin/env node
/**
 * Pre-deployment Checklist Script
 * Verifies your app is ready for production deployment
 */

const fs = require('fs')
const path = require('path')

console.log('🚀 Checking deployment readiness...\\n')

const checks = []
let allPassed = true

// Check 1: package.json has required scripts
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
const requiredScripts = ['dev', 'build', 'start']

checks.push({
  name: 'Package.json scripts',
  check: () => requiredScripts.every(script => packageJson.scripts[script]),
  message: requiredScripts.every(script => packageJson.scripts[script])
    ? '✅ All required scripts present'
    : `❌ Missing scripts: ${requiredScripts.filter(s => !packageJson.scripts[s]).join(', ')}`
})

// Check 2: Prisma schema exists
checks.push({
  name: 'Prisma schema',
  check: () => fs.existsSync('prisma/schema.prisma'),
  message: fs.existsSync('prisma/schema.prisma')
    ? '✅ Prisma schema found'
    : '❌ Prisma schema missing'
})

// Check 3: .gitignore exists
checks.push({
  name: '.gitignore',
  check: () => fs.existsSync('.gitignore'),
  message: fs.existsSync('.gitignore')
    ? '✅ .gitignore found'
    : '❌ .gitignore missing'
})

// Check 4: .env files are not committed
const gitignoreContent = fs.readFileSync('.gitignore', 'utf8')
checks.push({
  name: 'Environment files protected',
  check: () => gitignoreContent.includes('.env'),
  message: gitignoreContent.includes('.env')
    ? '✅ .env files are gitignored'
    : '❌ WARNING: .env files may be committed!'
})

// Check 5: Next.js app directory exists
checks.push({
  name: 'Next.js app directory',
  check: () => fs.existsSync('src/app'),
  message: fs.existsSync('src/app')
    ? '✅ App directory found'
    : '❌ App directory missing'
})

// Check 6: API routes exist
checks.push({
  name: 'Search API route',
  check: () => fs.existsSync('src/app/api/books/search/route.ts'),
  message: fs.existsSync('src/app/api/books/search/route.ts')
    ? '✅ Search API route found'
    : '❌ Search API route missing'
})

// Check 7: Dependencies installed
checks.push({
  name: 'Dependencies',
  check: () => fs.existsSync('node_modules'),
  message: fs.existsSync('node_modules')
    ? '✅ Dependencies installed'
    : '❌ Run npm install first'
})

// Check 8: Verify no local database URLs in code
const prismaFile = fs.readFileSync('src/lib/prisma.ts', 'utf8')
checks.push({
  name: 'Prisma client configuration',
  check: () => prismaFile.includes('process.env.DATABASE_URL'),
  message: prismaFile.includes('process.env.DATABASE_URL')
    ? '✅ Uses environment variable for database'
    : '❌ Hardcoded database URL detected'
})

// Run all checks
console.log('📋 Running checks...\\n')
checks.forEach(check => {
  const passed = check.check()
  console.log(check.message)
  if (!passed) allPassed = false
})

console.log('\\n' + '='.repeat(50))

if (allPassed) {
  console.log('\\n✅ All checks passed! Ready for deployment.\\n')
  console.log('📖 Next steps:')
  console.log('   1. Push code to GitHub')
  console.log('   2. Set up production database (Neon, Supabase, etc.)')
  console.log('   3. Deploy to Vercel, Railway, or your preferred platform')
  console.log('   4. Set DATABASE_URL environment variable')
  console.log('   5. Run: npx prisma migrate deploy')
  console.log('   6. Import books: npm run import:books:fast\\n')
  console.log('📚 See DEPLOYMENT_GUIDE.md for detailed instructions\\n')
  process.exit(0)
} else {
  console.log('\\n❌ Some checks failed. Fix the issues above before deploying.\\n')
  process.exit(1)
}
