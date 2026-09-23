import { MOCK_CLIENTS } from "../data/clients";

/**
 * Client service — mock, in-memory "backend" (module-level array),
 * same pattern as authService.js. Holding state here (not in each
 * page's local useState) is what lets Client list / Create / Details
 * pages share the same data across navigation. Swap these five
 * functions for real API calls later; pages won't need to change.
 */
let clients = [...MOCK_CLIENTS];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getClients() {
  await delay(400);
  return [...clients];
}

export async function getClientById(id) {
  await delay(300);
  const client = clients.find((c) => c.id === id);
  if (!client) throw new Error("Client not found.");
  return client;
}

export async function createClient(data) {
  await delay(400);
  const newClient = {
    id: crypto.randomUUID(),
    createdDate: new Date().toISOString().slice(0, 10),
    ...data,
  };
  clients = [newClient, ...clients];
  return newClient;
}

export async function updateClient(id, data) {
  await delay(400);
  clients = clients.map((c) => (c.id === id ? { ...c, ...data } : c));
  const updated = clients.find((c) => c.id === id);
  if (!updated) throw new Error("Client not found.");
  return updated;
}

export async function deleteClient(id) {
  await delay(300);
  clients = clients.filter((c) => c.id !== id);
  return true;
}