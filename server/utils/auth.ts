import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin, twoFactor, username } from 'better-auth/plugins'
import { getDb, hasDatabase } from '../db'
import * as schema from '../db/schema'
import { sendEmail, emailLayout } from './email'

let auth: ReturnType<typeof betterAuth> | null = null

export function isAuthConfigured(): boolean {
  return hasDatabase() && Boolean(process.env.BETTER_AUTH_SECRET)
}

export function getAuth() {
  if (!isAuthConfigured()) throw new Error('Auth is not configured')
  if (auth) return auth

  const providers: Record<string, { clientId: string; clientSecret: string }> = {}
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.google = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }
  }
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    providers.github = {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }
  }

  auth = betterAuth({
    database: drizzleAdapter(getDb(), { provider: 'pg', schema }),
    secret: process.env.BETTER_AUTH_SECRET,
    // ponytail: origin decides __Secure- cookie prefix; keep dev on http so the browser can store it
    baseURL: process.env.NODE_ENV === 'production'
      ? (process.env.BETTER_AUTH_URL || process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000')
      : `http://localhost:${process.env.PORT || 3000}`,
    advanced: {
      useSecureCookies: process.env.NODE_ENV === 'production',
      ...(process.env.NODE_ENV === 'production' && (process.env.BETTER_AUTH_URL?.includes('tachy.web.id') || process.env.NUXT_PUBLIC_SITE_URL?.includes('tachy.web.id'))
        ? {
            crossSubDomainCookies: {
              enabled: true,
              domain: '.tachy.web.id',
            },
          }
        : {}),
    },
    trustedOrigins: Array.from(new Set([
      'http://localhost:3000',
      'http://localhost:*',
      'https://tachy.web.id',
      'https://*.tachy.web.id',
      'https://tachy.vercel.app',
      'https://*.vercel.app',
      process.env.NUXT_PUBLIC_SITE_URL,
      process.env.BETTER_AUTH_URL,
    ].filter(Boolean) as string[])),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      minPasswordLength: 8,
      sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
        await sendEmail({
          to: user.email,
          subject: 'Reset your Tachy password',
          html: emailLayout('Reset your password', 'Use the button below to choose a new password. The link expires shortly.', { label: 'Reset password', url }),
        })
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
        await sendEmail({
          to: user.email,
          subject: 'Verify your Tachy email',
          html: emailLayout('Verify your email', 'Confirm your address to secure your account and keep your history.', { label: 'Verify email', url }),
        })
      },
    },
    socialProviders: providers,
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ['google', 'github'],
      },
    },
    user: {
      additionalFields: {
        isPublic: { type: 'boolean', required: false, defaultValue: true },
        timezone: { type: 'string', required: false, defaultValue: 'UTC' },
        leaderboardBanned: { type: 'boolean', required: false, defaultValue: false },
      },
    },
    plugins: [username(), admin(), twoFactor()],
  })

  return auth
}
