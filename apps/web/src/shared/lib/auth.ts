import { createAuth } from '@lib/auth/server'
import { prisma } from '@lib/my-car-tracker-db'
import { env } from '@my-car-tracker/env/web'

import { n8nApiClient } from '@/infrastructure/services/external/n8n-client'

export const auth = createAuth({
  appName: 'My Car Tracker',
  // Cookie próprio (`my-car-tracker.session_token`): não colide com a sessão de outro sistema no mesmo host
  cookiePrefix: 'my-car-tracker',
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: env.BETTER_AUTH_TRUSTED_ORIGINS,
  prisma,
  async sendResetPassword(data) {
    await n8nApiClient.post('/webhook/my-car-tracker/send-reset-password', {
      data
    })
  }
})

export default auth

export const {
  accountInfo,
  callbackOAuth,
  changeEmail,
  changePassword,
  deleteUser,
  deleteUserCallback,
  error,
  getAccessToken,
  getSession,
  linkSocialAccount,
  listSessions,
  listUserAccounts,
  ok,
  refreshToken,
  requestPasswordReset,
  requestPasswordResetCallback,
  resetPassword,
  revokeOtherSessions,
  revokeSession,
  revokeSessions,
  sendVerificationEmail,
  setPassword,
  signInEmail,
  signInSocial,
  signOut,
  signUpEmail,
  unlinkAccount,
  updateUser,
  verifyEmail,
  verifyPassword,
  updateSession
} = auth.api
