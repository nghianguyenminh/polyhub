const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export { API_BASE_URL };

/**
 * Gọi Next.js API route nội bộ (cùng origin, port 3000).
 * Dùng cho like, comment, share khi không chạy Java backend.
 */
export async function fetchLocal(path: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const response = await fetch(path, { ...options, headers });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || err.message || `Error ${response.status}`);
  }
  return response.json().catch(() => ({}));
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
}

export function setAuthToken(token: string | null) {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }
}

interface FetchOptions extends RequestInit {
  token?: string | null;
  /** Nếu true, không redirect về /login khi nhận 401 — dùng cho các action POST */
  noRedirectOn401?: boolean;
}

export async function fetchAPI(path: string, options: FetchOptions = {}) {
  const token = options.token !== undefined ? options.token : getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        if (!options.noRedirectOn401) {
          setAuthToken(null);
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
        throw new Error(errorData.error || errorData.message || 'Vui lòng đăng nhập để thực hiện chức năng này.');
      }

      if (response.status === 403) {
        throw new Error(errorData.error || errorData.message || 'Bạn không có quyền thực hiện chức năng này.');
      }

      throw new Error(errorData.error || errorData.message || `API error: ${response.status}`);
    }

    return await response.json().catch(() => ({}));
  } catch (error: any) {
    throw new Error(error.message || 'Không thể kết nối đến máy chủ Backend.');
  }
}