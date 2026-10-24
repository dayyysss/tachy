import { eq } from 'drizzle-orm'
import { getDb } from '../server/db'
import { user } from '../server/db/schema/auth'

const email = process.argv[2]
if (!email) {
  console.error('Usage: bun scripts/make-admin.ts <email>')
  process.exit(1)
}

const db = getDb()
const [row] = await db.update(user).set({ role: 'admin' }).where(eq(user.email, email)).returning({ id: user.id, email: user.email, role: user.role })

if (!row) {
  console.error(`No user found for ${email}`)
  process.exit(1)
}

console.log(`Promoted ${row.email} (${row.id}) to ${row.role}`)
process.exit(0)
