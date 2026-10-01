import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const config = window.SUPABASE_CONFIG || {};
const form = document.getElementById('auth-form');
const passwordInput = document.getElementById('auth-password');
const signInButton = document.getElementById('sign-in-button');
const signOutButton = document.getElementById('sign-out-button');
const accountPanel = document.getElementById('account-panel');
const accountRole = document.getElementById('account-role');
const authMessage = document.getElementById('auth-message');
const themeToggle = document.getElementById('auth-theme-toggle');
const ownerUsername = 'tsv3';
const client = config.url && config.anonKey
  ? createClient(config.url, config.anonKey)
  : null;

function showMessage(message, isError = false) {
  authMessage.textContent = message;
  authMessage.classList.toggle('text-rose-400', isError);
  authMessage.classList.toggle('text-gray-400', !isError);
}

function setBusy(isBusy) {
  signInButton.disabled = isBusy;
  signOutButton.disabled = isBusy;
}

async function updateAccount(session) {
  if (!session?.user) {
    accountPanel.classList.add('hidden');
    form.classList.remove('hidden');
    return true;
  }

  accountPanel.classList.remove('hidden');
  form.classList.add('hidden');
  accountRole.textContent = 'Checking chess access…';

  const { data, error } = await client.rpc('is_community_chess_owner');
  if (error) {
    console.error('Could not check chess owner access:', error);
    accountRole.textContent = 'Chess access could not be checked. Run the SQL setup and try again.';
    showMessage(error.message || 'Chess access could not be checked.', true);
    return false;
  }

  accountRole.textContent = data
    ? 'Owner access is configured. You play White.'
    : 'This account does not have owner access.';
  return true;
}

async function restoreSession() {
  if (!client) {
    showMessage('Supabase is not configured for this site.', true);
    signInButton.disabled = true;
    return;
  }
  const { data, error } = await client.auth.getSession();
  if (error) {
    console.error('Could not restore the chess login session:', error);
    showMessage(error.message || 'Could not restore your sign-in session.', true);
    return;
  }
  await updateAccount(data.session);
}

async function signIn() {
  if (!client) {
    showMessage('Supabase is not configured for this site.', true);
    return;
  }
  if (!form.reportValidity()) return;

  setBusy(true);
  showMessage('Signing in…');
  try {
    const { data: owner, error: ownerError } = await client.functions.invoke('chess-owner-login', {
      body: { username: ownerUsername }
    });
    if (ownerError) {
      const response = ownerError.context;
      if (response instanceof Response) {
        const result = await response.json();
        throw new Error(result.error || ownerError.message);
      }
      throw ownerError;
    }
    if (owner?.username !== ownerUsername || typeof owner.email !== 'string') {
      throw new Error('The chess owner sign-in service returned an invalid response.');
    }

    const { error: signInError } = await client.auth.signInWithPassword({
      email: owner.email,
      password: passwordInput.value
    });
    if (signInError) throw signInError;

    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw sessionError;
    const accessChecked = await updateAccount(sessionData.session);
    if (accessChecked) showMessage('You are signed in as tsv3.');
  } catch (error) {
    console.error('Chess authentication failed:', error);
    showMessage(error.message || 'Sign in failed. Check your username and password.', true);
  } finally {
    setBusy(false);
  }
}

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.classList.toggle('light', !isDark);
  localStorage.setItem('portfolio-theme', theme);
  themeToggle.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  themeToggle.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
  themeToggle.querySelector('.material-symbols-outlined').textContent = isDark ? 'dark_mode' : 'light_mode';
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  signIn();
});

signOutButton.addEventListener('click', async () => {
  setBusy(true);
  try {
    const { error } = await client.auth.signOut();
    if (error) throw error;
    await updateAccount(null);
    passwordInput.value = '';
    showMessage('You are signed out.');
  } catch (error) {
    console.error('Could not sign out of chess:', error);
    showMessage(error.message || 'Could not sign out.', true);
  } finally {
    setBusy(false);
  }
});

themeToggle.addEventListener('click', () => {
  applyTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark');
});

applyTheme(localStorage.getItem('portfolio-theme') ||
  (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'));
restoreSession();
