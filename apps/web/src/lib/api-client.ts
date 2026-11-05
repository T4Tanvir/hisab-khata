import type { ApiError } from '@hisab/shared';

class ApiClient {
  private prefix = '/api';

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.prefix}${path.startsWith('/') ? path : `/${path}`}`;
    const headers = new Headers(options.headers || {});

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // sends Better Auth session cookies
    });

    if (!res.ok) {
      let errorData: ApiError | null = null;
      try {
        errorData = await res.json();
      } catch {
        // Failed to parse JSON error
      }

      const message = errorData?.error?.message || `Request failed with status ${res.status}`;
      const err = new Error(message);
      (err as any).status = res.status;
      (err as any).data = errorData;
      throw err;
    }

    if (res.status === 204) {
      return {} as T;
    }

    return res.json();
  }

  get<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  post<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient();

