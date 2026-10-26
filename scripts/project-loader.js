const projectIds = new Set(['drag-throw', 'm1', 'ragdoll', 'tink', 'inventory']);

function isProjectData(value, expectedId) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  if (value.id !== expectedId || typeof value.title !== 'string' || !Array.isArray(value.files)) return false;
  if (!/^[a-f0-9]{64}$/i.test(value.sha256)) return false;

  const names = new Set();
  for (const file of value.files) {
    if (!file || typeof file.name !== 'string' || typeof file.source !== 'string') return false;
    if (!['luau', 'markdown'].includes(file.language) || names.has(file.name)) return false;
    names.add(file.name);
  }

  return names.size > 0;
}

export function createProjectLoader(fetcher = globalThis.fetch?.bind(globalThis), { timeoutMs = 10000 } = {}) {
  if (typeof fetcher !== 'function') throw new TypeError('A fetch function is required');
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new RangeError('A positive request timeout is required');
  const cache = new Map();

  async function load(id) {
    if (!projectIds.has(id)) throw new TypeError(`Unknown project: ${id}`);

    let pending = cache.get(id);
    if (!pending) {
      const url = new URL(`../assets/code/${id}.json`, import.meta.url);
      const controller = typeof AbortController === 'function' ? new AbortController() : null;
      let timeoutId;
      const request = Promise.resolve().then(async () => {
        const response = await fetcher(url, { signal: controller?.signal });
        if (!response.ok) throw new Error(`Project request failed with status ${response.status}`);
        const data = await response.json();
        if (!isProjectData(data, id)) throw new Error(`Invalid project data for ${id}`);
        return data;
      });
      const timeout = new Promise((resolve, reject) => {
        timeoutId = setTimeout(() => {
          controller?.abort();
          reject(new Error(`Project request timed out after ${timeoutMs} ms`));
        }, timeoutMs);
      });
      pending = Promise.race([request, timeout]).finally(() => clearTimeout(timeoutId));
      cache.set(id, pending);
    }

    try {
      return await pending;
    } catch (error) {
      if (cache.get(id) === pending) cache.delete(id);
      throw error;
    }
  }

  return { load };
}
