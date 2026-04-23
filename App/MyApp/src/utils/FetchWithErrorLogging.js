export default class FetchWithErrorLogging {
  static async get(url, options = {}) {
    const controller = new AbortController();
    const timeoutMs = options.timeoutMs ?? 15000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, { ...options, method: 'GET', signal: controller.signal });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        const error = new Error(`Request failed with status ${res.status}`);
        console.error('HTTP ERROR', { url, status: res.status, body: text });
        throw error;
      }
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return await res.json();
      }
      return await res.text();
    } catch (err) {
      if (err.name === 'AbortError') {
        console.error('REQUEST TIMEOUT', { url, timeoutMs });
        throw new Error('Request timed out');
      }
      console.error('NETWORK/UNKNOWN ERROR', { url, message: err.message });
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  static async testErrorScenario(scenario) {
    switch (scenario) {
      case 'network':
        // Try hitting an invalid domain to simulate network error
        return this.get('https://invalid.domain.for.testing.example');
      case 'notFound':
        return this.get('https://httpstat.us/404');
      case 'invalid':
        // 400 Bad Request
        return this.get('https://httpstat.us/400');
      case 'timeout':
        return this.get('https://httpstat.us/200?sleep=20000', { timeoutMs: 1000 });
      default:
        return { ok: true };
    }
  }
}
