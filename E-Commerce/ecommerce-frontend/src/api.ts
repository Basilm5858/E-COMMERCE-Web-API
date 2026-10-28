import axios from 'axios';

const baseURL = (import.meta.env.VITE_API_BASE_URL || 'https://localhost:7064/api').replace(/\/$/, '');

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ecom_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { detail?: string; title?: string; message?: string } | string | undefined;
    if (typeof data === 'string' && data.trim()) return data;
    if (data && typeof data === 'object') return data.detail || data.message || data.title || error.message;
    if (error.code === 'ECONNABORTED') return 'الطلب أخد وقت أطول من المتوقع. جرّب مرة تانية.';
    if (!error.response) return 'مش قادر أوصل للـ API. اتأكد إن مشروع الـ Web API شغال وإن VITE_API_BASE_URL صحيح.';
    if (error.response.status === 401) return 'انتهت الجلسة أو بيانات الدخول غير صحيحة. سجّل الدخول مرة تانية.';
    if (error.response.status === 403) return 'حسابك مش عنده الصلاحية المطلوبة للعملية دي.';
    return `حصل خطأ من السيرفر (${error.response.status}).`;
  }
  return error instanceof Error ? error.message : 'حصل خطأ غير متوقع.';
}

export function readJwtUser(token: string | null): { id?: string; name?: string; email?: string; role?: string } | null {
  if (!token) return null;
  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return null;
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(decodeURIComponent(
      Array.from(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')))
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    )) as Record<string, unknown>;
    return {
      id: String(payload['nameid'] ?? payload['sub'] ?? payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ?? payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/nameidentifier'] ?? ''),
      name: String(payload['unique_name'] ?? payload['name'] ?? payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ?? payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/name'] ?? ''),
      email: String(payload['email'] ?? payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ?? payload['http://schemas.microsoft.com/ws/2005/05/identity/claims/emailaddress'] ?? ''),
      role: String(payload['role'] ?? payload['roles'] ?? payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ?? ''),
    };
  } catch {
    return null;
  }
}
