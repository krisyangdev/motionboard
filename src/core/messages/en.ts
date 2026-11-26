// UI strings of the template (shell, page templates, sign-in/account/app pages, emails, hub pages), one file per language.
// `src/core/messages/<code>.ts` must exist for every code in `languages` in site.config.ts: copy this file and translate it.
// Plain data and type-only imports, so Node can load it too (src/core/pages.ts reads `hubs`). Site strings live in src/site/messages.ts.
// Admin pages are English only and have no strings here.
const en = {
  // Shell
  skipLink: 'Skip to content',
  nav: 'Main',
  theme: { toggle: 'Toggle dark mode' },
  language: 'Language',
  signIn: 'Sign in',
  notFound: { title: 'Page not found', body: 'This page does not exist or has moved.', back: 'Back to home' },
  footer: { privacy: 'Privacy', terms: 'Terms', contact: 'Contact' },

  // Page templates
  page: {
    breadcrumb: 'Breadcrumb',
    home: 'Home',
    tools: 'Tools',
    guides: 'Guides',
    updated: 'Updated',
    published: 'Published',
    howTo: 'How to use',
    faq: 'Frequently asked questions',
    moreTools: 'More tools',
  },

  // Hub pages: title and description go in <head>, the lede under the heading.
  hubs: {
    tools: {
      title: 'Free online tools',
      description: 'Free browser tools that run on your device: no sign-up, nothing to install, nothing uploaded.',
      lede: 'Free browser tools that run on your device. No sign-up, nothing to install.',
    },
    guides: {
      title: 'Guides',
      description: 'Step-by-step guides and practical notes, written for people who want the task done.',
      lede: 'Step-by-step guides and practical notes.',
    },
  },

  // Sign-in, account and app pages
  app: {
    seo: {
      login: { title: 'Sign in', description: 'Sign in to your account.' },
      signup: { title: 'Create account', description: 'Create an account.' },
      forgot: { title: 'Reset password', description: 'Get a link to reset your password.' },
      reset: { title: 'Choose a new password', description: 'Choose a new password for your account.' },
      account: { title: 'Account', description: 'Your credits, orders and history.' },
      app: { title: 'Generate an image', description: 'Generate an image with your credits.' },
    },
    common: { email: 'Email', password: 'Password', name: 'Name', back: 'Back to sign in', retry: 'Try again', error: 'Something went wrong. Try again.' },
    // Better Auth error codes. Anything else shows `common.error`.
    authErrors: {
      INVALID_EMAIL_OR_PASSWORD: 'Wrong email or password.',
      INVALID_EMAIL: 'Enter a valid email address.',
      EMAIL_NOT_VERIFIED: 'Verify your email before signing in.',
      USER_ALREADY_EXISTS: 'An account with this email already exists.',
      PASSWORD_TOO_SHORT: 'Use at least 8 characters.',
      INVALID_TOKEN: 'This link is invalid or has expired.',
      rateLimited: 'Too many attempts. Wait a moment and try again.',
    } as Record<string, string>,
    login: {
      title: 'Sign in',
      submit: 'Sign in',
      google: 'Continue with Google',
      or: 'or',
      forgot: 'Forgot password?',
      noAccount: 'No account yet?',
      signup: 'Create one',
      resend: 'Resend verification email',
      resent: 'Verification email sent. Check your inbox.',
    },
    signup: {
      title: 'Create your account',
      submit: 'Create account',
      haveAccount: 'Already have an account?',
      login: 'Sign in',
      doneTitle: 'Check your inbox',
      done: (email: string) => `We sent a verification link to ${email}. Open it to finish creating your account.`,
      resend: 'Resend email',
      resent: 'Email sent again.',
    },
    forgot: {
      title: 'Reset your password',
      submit: 'Send reset link',
      doneTitle: 'Check your inbox',
      done: (email: string) => `If an account exists for ${email}, we sent a link to reset the password.`,
    },
    reset: {
      title: 'Choose a new password',
      newPassword: 'New password',
      submit: 'Update password',
      done: 'Password updated.',
      login: 'Sign in',
      invalid: 'This reset link is invalid or has expired.',
      request: 'Request a new link',
    },
    account: {
      title: 'Account',
      signOut: 'Sign out',
      credits: 'Credits',
      available: 'Available',
      held: 'In use',
      openApp: 'Open the app',
      buy: 'Buy credits',
      buyButton: 'Buy',
      packCredits: (n: number) => `${n} credits`,
      manage: 'Manage billing',
      checkoutSuccess: 'Payment received. Your credits are added in a few seconds.',
      checkoutFailed: 'The payment did not complete. No credits were added.',
      orders: 'Orders',
      noOrders: 'No orders yet.',
      ordersCols: { date: 'Date', pack: 'Pack', amount: 'Amount', status: 'Status' },
      orderStatus: { created: 'Created', checkout_started: 'Pending', paid: 'Paid', failed: 'Failed', refunded: 'Refunded' } as Record<string, string>,
      history: 'Credit history',
      noHistory: 'No credit activity yet.',
      historyCols: { date: 'Date', type: 'Type', change: 'Change', balance: 'Balance' },
      txTypes: {
        signup: 'Sign-up bonus',
        payment: 'Purchase',
        payment_order: 'Purchase',
        purchase: 'Purchase',
        grant: 'Credits added',
        hold: 'Reserved',
        reserve: 'Reserved',
        commit: 'Used',
        spend: 'Used',
        refund: 'Refunded',
        adjust: 'Adjustment',
        adjustment: 'Adjustment',
      } as Record<string, string>,
    },
    app: {
      title: 'Generate an image',
      prompt: 'Prompt',
      placeholder: 'A lighthouse at dawn, watercolour',
      generate: 'Generate',
      cost: (n: number) => `${n} credits per image`,
      balance: (n: number) => `Balance: ${n} credits`,
      buy: 'Buy credits',
      running: 'Generating…',
      resultAlt: 'Generated image',
      failedTitle: 'Generation failed',
      refunded: 'Your credits were refunded.',
      insufficient: 'Not enough credits.',
      rateLimited: 'Too many requests. Wait a moment and try again.',
      turnstileFailed: 'Verification failed. Try again.',
      recent: 'Recent images',
      none: 'Nothing generated yet.',
      status: { queued: 'Queued', running: 'Running', succeeded: 'Done', failed: 'Failed' } as Record<string, string>,
      account: 'Account',
    },
  },

  // Transactional emails. `site` is the site name.
  email: {
    verify: {
      subject: (site: string) => `Confirm your email for ${site}`,
      heading: 'Confirm your email',
      body: (site: string) => [`Thanks for signing up for ${site}. Confirm your email address to finish creating your account.`],
      action: 'Confirm email',
      footer: 'If you did not sign up, you can ignore this email.',
    },
    reset: {
      subject: (site: string) => `Reset your ${site} password`,
      heading: 'Reset your password',
      body: (_site: string) => ['We received a request to reset your password. The link works once and expires in one hour.'],
      action: 'Choose a new password',
      footer: 'If you did not ask for this, you can ignore this email. Your password stays the same.',
    },
    receipt: {
      subject: (site: string, plan: string) => `Your ${site} receipt: ${plan}`,
      heading: 'Payment received',
      body: (p: { plan: string; amount: string; credits: number; contact: string }) => [
        `${p.plan}: ${p.amount}`,
        `${p.credits} credits were added to your account.`,
        `Questions? Reply to this email or write to ${p.contact}.`,
      ],
    },
  },
}

export type CoreMessages = typeof en
export default en
