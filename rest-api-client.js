/**
 * ================================================
 * BCA Study Hub - REST API Layer
 * Complete REST API endpoints for all systems
 * ================================================
 */

// ======================================
// API Base Configuration
// ======================================

const API_CONFIG = {
  baseURL: process.env.API_BASE_URL || 'https://api.bcastudy.hub',
  version: 'v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Version': '1.0.0',
  },
};

// ======================================
// Response Handler Class
// ======================================

class APIResponse {
  constructor(data, status = 200, message = 'Success') {
    this.success = status >= 200 && status < 300;
    this.status = status;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  static success(data, message = 'Success', status = 200) {
    return new APIResponse(data, status, message);
  }

  static error(message, status = 400, data = null) {
    const response = new APIResponse(data, status, message);
    response.success = false;
    return response;
  }

  static notFound(message = 'Resource not found') {
    return APIResponse.error(message, 404);
  }

  static unauthorized(message = 'Unauthorized access') {
    return APIResponse.error(message, 401);
  }

  static badRequest(message = 'Invalid request parameters') {
    return APIResponse.error(message, 400);
  }

  static internalError(message = 'Internal server error') {
    return APIResponse.error(message, 500);
  }

  toJSON() {
    return {
      success: this.success,
      status: this.status,
      message: this.message,
      data: this.data,
      timestamp: this.timestamp,
    };
  }
}

// ======================================
// API Client Class
// ======================================

class APIClient {
  constructor(baseURL = API_CONFIG.baseURL) {
    this.baseURL = baseURL;
    this.headers = API_CONFIG.headers;
    this.timeout = API_CONFIG.timeout;
  }

  async request(method, endpoint, data = null, customHeaders = {}) {
    const url = `${this.baseURL}/api/${API_CONFIG.version}${endpoint}`;
    const headers = { ...this.headers, ...customHeaders };

    const config = {
      method,
      headers,
      signal: AbortSignal.timeout(this.timeout),
    };

    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      return await this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  async handleResponse(response) {
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      return APIResponse.error(
        data?.message || 'API Error',
        response.status,
        data
      );
    }

    return APIResponse.success(data, 'Success', response.status);
  }

  handleError(error) {
    if (error.name === 'AbortError') {
      return APIResponse.error('Request timeout', 408);
    }
    if (error instanceof TypeError) {
      return APIResponse.error('Network error', 503);
    }
    return APIResponse.internalError(error.message);
  }

  get(endpoint, headers) {
    return this.request('GET', endpoint, null, headers);
  }

  post(endpoint, data, headers) {
    return this.request('POST', endpoint, data, headers);
  }

  put(endpoint, data, headers) {
    return this.request('PUT', endpoint, data, headers);
  }

  patch(endpoint, data, headers) {
    return this.request('PATCH', endpoint, data, headers);
  }

  delete(endpoint, headers) {
    return this.request('DELETE', endpoint, null, headers);
  }
}

// ======================================
// User Endpoints
// ======================================

const UserEndpoints = {
  /**
   * POST /auth/login
   * User login
   */
  login: async (client, email, password) => {
    return await client.post('/auth/login', {
      email,
      password,
    });
  },

  /**
   * POST /auth/register
   * User registration
   */
  register: async (client, userData) => {
    return await client.post('/auth/register', userData);
  },

  /**
   * POST /auth/logout
   * User logout
   */
  logout: async (client) => {
    return await client.post('/auth/logout', {});
  },

  /**
   * GET /auth/profile
   * Get user profile
   */
  getProfile: async (client) => {
    return await client.get('/auth/profile');
  },

  /**
   * PUT /auth/profile
   * Update user profile
   */
  updateProfile: async (client, profileData) => {
    return await client.put('/auth/profile', profileData);
  },

  /**
   * POST /auth/verify-email
   * Verify email
   */
  verifyEmail: async (client, token) => {
    return await client.post('/auth/verify-email', { token });
  },

  /**
   * POST /auth/refresh-token
   * Refresh authentication token
   */
  refreshToken: async (client) => {
    return await client.post('/auth/refresh-token', {});
  },
};

// ======================================
// Content Endpoints
// ======================================

const ContentEndpoints = {
  /**
   * GET /content/subjects
   * Get all subjects
   */
  getSubjects: async (client) => {
    return await client.get('/content/subjects');
  },

  /**
   * GET /content/subjects/:subjectId/chapters
   * Get chapters for a subject
   */
  getChapters: async (client, subjectId) => {
    return await client.get(`/content/subjects/${subjectId}/chapters`);
  },

  /**
   * GET /content/chapters/:chapterId/lessons
   * Get lessons for a chapter
   */
  getLessons: async (client, chapterId) => {
    return await client.get(`/content/chapters/${chapterId}/lessons`);
  },

  /**
   * GET /content/lessons/:lessonId
   * Get specific lesson
   */
  getLesson: async (client, lessonId) => {
    return await client.get(`/content/lessons/${lessonId}`);
  },

  /**
   * GET /content/search
   * Search content
   */
  searchContent: async (client, query, filters = {}) => {
    const params = new URLSearchParams({ query, ...filters });
    return await client.get(`/content/search?${params.toString()}`);
  },

  /**
   * POST /content/bookmarks
   * Save content as bookmark
   */
  saveBookmark: async (client, contentId, title) => {
    return await client.post('/content/bookmarks', {
      contentId,
      title,
      savedAt: new Date().toISOString(),
    });
  },

  /**
   * GET /content/bookmarks
   * Get user bookmarks
   */
  getBookmarks: async (client) => {
    return await client.get('/content/bookmarks');
  },
};

// ======================================
// Admin Endpoints
// ======================================

const AdminEndpoints = {
  /**
   * GET /admin/users
   * Get all users (admin only)
   */
  getUsers: async (client, filters = {}) => {
    const params = new URLSearchParams(filters);
    return await client.get(`/admin/users?${params.toString()}`);
  },

  /**
   * GET /admin/analytics
   * Get system analytics (admin only)
   */
  getAnalytics: async (client, dateRange = {}) => {
    const params = new URLSearchParams(dateRange);
    return await client.get(`/admin/analytics?${params.toString()}`);
  },

  /**
   * POST /admin/reports/generate
   * Generate system report (admin only)
   */
  generateReport: async (client, reportType, filters = {}) => {
    return await client.post('/admin/reports/generate', {
      type: reportType,
      filters,
      generatedAt: new Date().toISOString(),
    });
  },

  /**
   * GET /admin/logs
   * Get system logs (admin only)
   */
  getLogs: async (client, filters = {}) => {
    const params = new URLSearchParams(filters);
    return await client.get(`/admin/logs?${params.toString()}`);
  },
};

// ======================================
// Initialize Global API Client
// ======================================

const apiClient = new APIClient();

// ======================================
// Export for use in other modules
// ======================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    APIResponse,
    APIClient,
    UserEndpoints,
    ContentEndpoints,
    AdminEndpoints,
    apiClient,
  };
}
