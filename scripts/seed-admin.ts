import { getAuth } from '../server/utils/auth'
import { getDb } from '../server/db'
import { user } from '../server/db/schema/auth'
import { eq } from 'drizzle-orm'

async function seed() {
  const email = process.argv[2] || 'daynibos@gmail.com'
  const password = process.argv[3] || '@Day2026'
  const username = 'daynibos'
  const name = 'Super Admin'

  console.log(`Seeding admin account for ${email}...`)
  const auth = getAuth()
  const db = getDb()

  // 1. Check if user already exists
  const [existing] = await db.select().from(user).where(eq(user.email, email)).limit(1)

  let userId: string

  if (existing) {
    console.log(`User ${email} already exists (ID: ${existing.id}). Updating role...`)
    userId = existing.id
    await db.update(user).set({
      role: 'admin',
      emailVerified: true,
      username: existing.username || username,
    }).where(eq(user.id, existing.id))
  } else {
    // 2. Create via Better Auth API
    console.log(`Creating user through Better Auth...`)
    const res = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
        username,
      },
    })

    if (!res || !res.user) {
      throw new Error('Failed to create user via Better Auth')
    }

    userId = res.user.id
    console.log(`Created user ${res.user.email} (ID: ${userId})`)

    // 3. Promote to admin and verify email
    await db.update(user).set({
      role: 'admin',
      emailVerified: true,
    }).where(eq(user.id, userId))
  }

  const [finalUser] = await db.select().from(user).where(eq(user.id, userId)).limit(1)
  console.log('-------------------------------------------')
  console.log('Superadmin Seeded Successfully!')
  console.log(`Email       : ${finalUser.email}`)
  console.log(`Username    : ${finalUser.username}`)
  console.log(`Role        : ${finalUser.role}`)
  console.log(`Verified    : ${finalUser.emailVerified}`)
  console.log(`Login URL   : http://localhost:3000/tachyPanel`)
  console.log(`Panel URL   : http://localhost:3000/tachos/dashboard`)
  console.log('-------------------------------------------')

  process.exit(0)
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
