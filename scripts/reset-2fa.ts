import { eq } from 'drizzle-orm'
import { getDb } from '../server/db'
import { user, twoFactor } from '../server/db/schema/auth'

async function reset2FA() {
  const email = process.argv[2] || 'daynibos@gmail.com'
  const db = getDb()

  const [targetUser] = await db.select().from(user).where(eq(user.email, email)).limit(1)
  if (!targetUser) {
    console.error(`User with email ${email} not found.`)
    process.exit(1)
  }

  await db.update(user).set({
    twoFactorEnabled: false,
  }).where(eq(user.id, targetUser.id))

  await db.delete(twoFactor).where(eq(twoFactor.userId, targetUser.id))

  console.log(`2FA has been successfully reset/disabled for: ${email}`)
  process.exit(0)
}

reset2FA().catch(err => {
  console.error('Failed to reset 2FA:', err)
  process.exit(1)
})
