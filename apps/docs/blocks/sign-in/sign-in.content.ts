/**
 * Content for the sign-in block. Replace this object to translate or rebrand it; the component never hard-codes
 * copy. The brand panel (wide containers only) uses the product name and `brand`.
 */

export interface SignInContent {
  /** BCP 47 locale. */
  locale: string;
  product: { name: string };
  signIn: {
    title: string;
    subtitle: string;
    email: { label: string; placeholder: string; errors: { required: string; invalid: string } };
    password: {
      label: string;
      /** Accessible names of the show/hide toggle. */
      show: string;
      hide: string;
      forgot: string;
      errors: { required: string };
    };
    remember: string;
    submit: string;
    /** Text of the divider between password and passkey sign-in. */
    or: string;
    passkey: string;
    signUp: { prompt: string; action: string };
    legal: { terms: string; privacy: string; help: string };
    /** Brand panel copy. Wrap a word in `*…*` to set it in the heading face's italic ("Your money, *clearly*."). */
    brand: { headline: string; body: string };
    /** Toast after a successful (demo) sign-in. */
    success: { title: string };
  };
}

export const signInContent: SignInContent = {
  locale: 'en-US',
  product: { name: 'Acme' },
  signIn: {
    title: 'Sign in to Acme',
    subtitle: 'Welcome back. Enter your details to continue.',
    email: {
      label: 'Email',
      placeholder: 'you@example.com',
      errors: { required: 'Enter your email address', invalid: 'Enter an email address like name@example.com' },
    },
    password: {
      label: 'Password',
      show: 'Show password',
      hide: 'Hide password',
      forgot: 'Forgot password?',
      errors: { required: 'Enter your password' },
    },
    remember: 'Keep me signed in on this device',
    submit: 'Sign in',
    or: 'or',
    passkey: 'Continue with passkey',
    signUp: { prompt: 'New to Acme?', action: 'Create an account' },
    legal: { terms: 'Terms', privacy: 'Privacy', help: 'Help center' },
    brand: {
      headline: 'Your money, *clearly*.',
      body: 'Payments, savings goals and card controls in one place, with security built in.',
    },
    success: { title: 'You’re signed in' },
  },
};
