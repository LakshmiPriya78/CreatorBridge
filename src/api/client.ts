export const API_BASE = '/api';

class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function getToken(): string | null {
  return localStorage.getItem('creatorbridge_token');
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem('creatorbridge_token', token);
  } else {
    localStorage.removeItem('creatorbridge_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  let data: any = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorMsg = data?.error || `Request failed with status ${response.status}`;
    throw new ApiError(errorMsg, response.status, data);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (body: { email: string; password: string; role: 'creator' | 'agency' }) =>
    request<{ token: string; user: any; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string; expectedRole?: 'creator' | 'agency' }) =>
    request<{ token: string; user: any; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getMe: () => request<{ user: any; profile: any }>('/auth/me'),

  logout: () =>
    request<{ message: string }>('/auth/logout', {
      method: 'POST',
    }),

  forgotPassword: (email: string) =>
    request<{ message: string; resetToken?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (body: { resetToken: string; newPassword: string }) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  // Terms
  getTermsStatus: () =>
    request<{ hasAccepted: boolean; acceptedAt: string | null; termsVersion: string | null; currentVersion: string }>(
      '/terms/status'
    ),

  acceptTerms: (confirmed: boolean, termsVersion?: string) =>
    request<{ message: string; acceptedAt: string; termsVersion: string }>('/terms/accept', {
      method: 'POST',
      body: JSON.stringify({ confirmed, termsVersion }),
    }),

  // Creator
  getCreatorProfile: () => request<any>('/creator/profile'),
  updateCreatorProfile: (data: any) =>
    request<{ message: string }>('/creator/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getPortfolio: () => request<any[]>('/creator/portfolio'),
  addPortfolioItem: (data: any) =>
    request<{ id: string; message: string }>('/creator/portfolio', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePortfolioItem: (id: string, data: any) =>
    request<{ message: string }>(`/creator/portfolio/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletePortfolioItem: (id: string) =>
    request<{ message: string }>(`/creator/portfolio/${id}`, {
      method: 'DELETE',
    }),

  getPricing: () => request<any[]>('/creator/pricing'),
  addPricingPackage: (data: any) =>
    request<{ id: string; message: string }>('/creator/pricing', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePricingPackage: (id: string, data: any) =>
    request<{ message: string }>(`/creator/pricing/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deletePricingPackage: (id: string) =>
    request<{ message: string }>(`/creator/pricing/${id}`, {
      method: 'DELETE',
    }),

  getPaymentDetails: () => request<any>('/creator/payment-details'),
  updatePaymentDetails: (data: { account_holder_name: string; bank_account_number: string; ifsc_code: string }) =>
    request<{ message: string }>('/creator/payment-details', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  publishPortfolio: () =>
    request<{ message: string }>('/creator/publish', {
      method: 'POST',
    }),
  unpublishPortfolio: () =>
    request<{ message: string }>('/creator/unpublish', {
      method: 'POST',
    }),

  // Agency
  getAgencyProfile: () => request<any>('/agency/profile'),
  updateAgencyProfile: (data: any) =>
    request<{ message: string }>('/agency/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  verifyAgency: (data: { businessDocumentUrl?: string; notes?: string }) =>
    request<{ message: string }>('/agency/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getAgencyDashboardStats: () => request<any>('/agency/dashboard-stats'),

  // Discovery
  discoverCreators: (params: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<{ creators: any[]; total: number; page: number; totalPages: number }>(`/discovery/creators?${query}`);
  },
  getCreatorDetail: (creatorId: string) => request<any>(`/discovery/creators/${creatorId}`),

  // Invitations
  createInvitation: (data: any) =>
    request<{ message: string; invitationId: string }>('/invitations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  listInvitations: () => request<any[]>('/invitations'),
  getInvitation: (id: string) => request<{ invitation: any; negotiationHistory: any[] }>(`/invitations/${id}`),
  creatorRespondInvitation: (id: string, data: any) =>
    request<{ message: string }>(`/invitations/${id}/creator-response`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  agencyRespondInvitation: (id: string, data: any) =>
    request<{ message: string }>(`/invitations/${id}/agency-response`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  confirmProject: (invitationId: string) =>
    request<{ message: string; projectId: string }>(`/invitations/${invitationId}/confirm-project`, {
      method: 'POST',
    }),

  // Projects
  listProjects: () => request<any[]>('/projects'),
  getProject: (id: string) => request<{ project: any; deliverables: any[]; paymentRecord: any; review: any }>(`/projects/${id}`),
  startProject: (id: string) =>
    request<{ message: string }>(`/projects/${id}/start`, {
      method: 'POST',
    }),
  submitDeliverable: (projectId: string, data: { submissionNotes: string; fileUrls: string[] }) =>
    request<{ message: string; deliverableId: string; versionNumber: number }>(`/projects/${projectId}/submit-deliverable`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  requestRevision: (projectId: string, revisionNotes: string) =>
    request<{ message: string }>(`/projects/${projectId}/request-revision`, {
      method: 'POST',
      body: JSON.stringify({ revisionNotes }),
    }),
  approveDeliverable: (projectId: string) =>
    request<{ message: string; projectStatus: string }>(`/projects/${projectId}/approve`, {
      method: 'POST',
    }),

  // Payments
  getProjectBankDetails: (projectId: string) => request<any>(`/payments/project/${projectId}/bank-details`),
  initiatePayment: (projectId: string, data: { amountTransferredInr: number; transferDate: string; transactionReference: string; receiptUrl?: string; notes?: string }) =>
    request<{ message: string }>(`/payments/project/${projectId}/initiate`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  confirmPaymentReceipt: (projectId: string) =>
    request<{ message: string }>(`/payments/project/${projectId}/confirm-receipt`, {
      method: 'POST',
    }),
  disputePayment: (projectId: string, disputeReason: string) =>
    request<{ message: string }>(`/payments/project/${projectId}/dispute`, {
      method: 'POST',
      body: JSON.stringify({ disputeReason }),
    }),
  getAgencyPaymentHistory: () => request<{ records: any[]; metrics: any }>('/payments/agency/history'),
  getCreatorEarnings: () => request<{ records: any[]; metrics: any }>('/payments/creator/earnings'),

  // Reviews
  submitReview: (projectId: string, data: { rating: number; deliveryRating: number; communicationRating: number; feedback: string }) =>
    request<{ message: string; reviewId: string }>(`/reviews/project/${projectId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getCreatorReviews: (creatorId: string) => request<{ reviews: any[]; count: number; averageRating: number }>(`/reviews/creator/${creatorId}`),
  reportReview: (reviewId: string, reason: string) =>
    request<{ message: string }>(`/reviews/${reviewId}/report`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  // Notifications
  getNotifications: () => request<{ notifications: any[]; unreadCount: number }>('/notifications'),
  markNotificationRead: (id: string) =>
    request<{ message: string }>(`/notifications/${id}/read`, {
      method: 'PUT',
    }),
  markAllNotificationsRead: () =>
    request<{ message: string }>('/notifications/read-all', {
      method: 'POST',
    }),

  // File Upload
  uploadFile: async (file: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'File upload failed');
    }

    return (await res.json()) as { url: string; filename: string; originalName: string; size: number };
  },
};
