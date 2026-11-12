const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
const TOKEN_KEY = "token";

export const UNAUTHORIZED_EVENT = "auth:unauthorized";

export const tokenStorage = {
  get(): string | null {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY);
  },
};

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string>;

  constructor(message: string, status: number, errors?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

type ApiOptions = Omit<RequestInit, "body"> & { body?: unknown };

export async function api<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;
  const token = tokenStorage.get();

  const finalHeaders = new Headers(headers);
  finalHeaders.set("Accept", "application/json");
  if (token) finalHeaders.set("Authorization", `Bearer ${token}`);

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body; // jangan set Content-Type, browser mengisi boundary sendiri
  } else if (body !== undefined) {
    finalHeaders.set("Content-Type", "application/json");
    payload = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/api${path}`, {
      ...rest,
      headers: finalHeaders,
      body: payload,
    });
  } catch {
    throw new ApiError("Unable to connect to server", 0);
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // 401 saat membawa token = sesi tidak valid/kedaluwarsa -> keluarkan user.
    // /auth/login dikecualikan karena password salah juga membalas 401.
    if (res.status === 401 && token && !path.startsWith("/auth/login")) {
      tokenStorage.clear();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(data?.message ?? "Error occured", res.status, data?.errors);
  }

  return data as T;
}

// Path relatif dari backend ("/uploads/...") -> URL lengkap
export function fileUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  return path.startsWith("http") ? path : `${BASE_URL}${path}`;
}