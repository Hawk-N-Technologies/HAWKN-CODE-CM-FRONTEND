import { MOCK_USERS } from "../data/users";

/**
 * Auth service — currently backed by mock data (src/data/users.js).
 *
 * Swap the implementation of these two functions for real fetch()/axios
 * calls to the backend once it's available; nothing else in the app
 * should need to change, since components only ever talk to this module.
 *
 * SECURITY NOTE: when a real backend exists, prefer it issuing a
 * secure, HttpOnly, SameSite session cookie over returning a bearer
 * token the frontend has to store. Never log credentials or tokens.
 */
const MOCK_LATENCY_MS = 500;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function login({ email, password }) {
  await delay(MOCK_LATENCY_MS);

  const user = MOCK_USERS.find(
    (candidate) => candidate.email.toLowerCase() === email.toLowerCase()
  );

  if (!user || user.password !== password) {
    throw new Error("Invalid email or password.");
  }

  // Never keep the password around past the credential check.
  const safeUser = { ...user };
  delete safeUser.password;
  return safeUser;
}

export async function logout() {
  await delay(150);
  return true;
}