/**
 * API Client for WeDesignz WebApp
 * Handles all API calls to the Django backend
 * 
 * API endpoint must be configured via NEXT_PUBLIC_API_BASE_URL environment variable in .env.local
 * 
 * Examples:
 * - Development: NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
 * - Production: NEXT_PUBLIC_API_BASE_URL=https://devapi.wedesignz.com
 */

import {
  formatError,
  getUserFriendlyMessage,
  logError,
  ErrorType,
  ErrorDetails,
} from './utils/errorHandler';

// API base URL - must be set in .env.local
// During build time, use a placeholder to avoid build errors
// At runtime, this will be validated when API calls are made
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

// Helper function to get API base URL with validation
function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_BASE_URL;
  // During build time (SSR/prerendering), return empty string to avoid errors
  // At runtime in browser, validate and throw error if not set
  if (!url) {
    if (typeof window !== 'undefined') {
      // Only throw error in browser (runtime), not during build/SSR
      throw new Error(
        'NEXT_PUBLIC_API_BASE_URL is not set. Please configure it in .env.local file.\n' +
        'Example: NEXT_PUBLIC_API_BASE_URL=http://localhost:8000'
      );
    }
    // During build/SSR, return empty string (will be handled gracefully in apiRequest)
    return '';
  }
  return url;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  errorDetails?: ErrorDetails;
  fieldErrors?: Record<string, string[]>;
  validationErrors?: string[];
}

/**
 * Handle 401 Unauthorized - attempt token refresh or redirect to login
 */
async function handleUnauthorized() {
  // Clear invalid token
  if (typeof window !== 'undefined') {
    localStorage.removeItem('wedesign_access_token');
    localStorage.removeItem('wedesign_refresh_token');
    
    // Only redirect if not already on login/auth page
    if (!window.location.pathname.includes('/auth/login') && 
        !window.location.pathname.includes('/auth/signup') &&
        !window.location.pathname.includes('/auth/register')) {
      // Store current location for redirect after login
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      window.location.href = '/auth/login';
    }
  }
}

/**
 * Base API request function with enhanced error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('wedesign_access_token') 
      : null;

    // Check if body is FormData
    const isFormData = options.body instanceof FormData;
    
    const headers: Record<string, string> = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const baseUrl = getApiBaseUrl();
    if (!baseUrl) {
      return {
        error: 'API base URL is not configured. Please set NEXT_PUBLIC_API_BASE_URL environment variable.',
        errorDetails: {
          type: ErrorType.NETWORK,
          message: 'API base URL is not configured',
          statusCode: 500,
        },
      };
    }

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let response: Response;
    try {
      response = await fetch(`${baseUrl}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Handle timeout
      if (fetchError.name === 'AbortError') {
        const timeoutError = {
          type: ErrorType.NETWORK,
          message: 'Request timeout. The server took too long to respond.',
          statusCode: 408,
        };
        logError(timeoutError, `API Request Timeout: ${endpoint}`);
        return {
          error: 'Request timeout. Please check if the server is running and try again.',
          errorDetails: timeoutError,
        };
      }
      
      // Handle network errors (server not reachable, CORS, etc.)
      const networkError = formatError(fetchError, undefined);
      const userMessage = getUserFriendlyMessage(networkError);
      
      // Provide more helpful error message
      let helpfulMessage = userMessage;
      if (fetchError.message?.includes('Failed to fetch') || 
          fetchError.message?.includes('NetworkError') ||
          fetchError.name === 'TypeError') {
        helpfulMessage = `Unable to connect to the server at ${baseUrl}. Please ensure the API server is running and the API base URL is correct.`;
      }
      
      logError(networkError, `API Request Failed: ${endpoint}`);
      
      return {
        error: helpfulMessage,
        errorDetails: networkError,
      };
    }

    if (!response.ok) {
      let errorData: any = {};
      
      // Try to parse error response
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          errorData = await response.json();
        } else {
          const text = await response.text();
          errorData = { detail: text || response.statusText };
        }
      } catch (parseError) {
        errorData = { detail: response.statusText || 'An error occurred' };
      }

      // Format error using error handler
      const errorDetails = formatError(errorData, response.status);
      const userMessage = getUserFriendlyMessage(errorDetails);
      
      // Don't log 404 errors for GET endpoints that are expected to return 404 when no data exists
      const isExpected404 = response.status === 404 && 
        (options.method === 'GET' || !options.method) &&
        (endpoint.includes('/get-designer-onboarding-step') || 
         endpoint.includes('/get-designer-onboarding-step1') ||
         endpoint.includes('/get-designer-onboarding-step2') ||
         endpoint.includes('/get-designer-onboarding-step3'));
      
      // Log error for debugging (skip expected 404s)
      if (!isExpected404) {
        logError(errorDetails, `API Request: ${endpoint}`);
      }
      
      // Handle 401 Unauthorized
      if (response.status === 401) {
        await handleUnauthorized();
      }

      return {
        error: userMessage,
        errorDetails,
        fieldErrors: errorDetails.fieldErrors,
      };
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return { data: {} as T };
    }

    // Parse successful response
    const contentType = response.headers.get('content-type');
    let data: T;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // For non-JSON responses, return the response object
      data = response as unknown as T;
    }

    return { data };
  } catch (error: any) {
    // Network errors or other fetch failures
    const errorDetails = formatError(error, undefined);
    const userMessage = getUserFriendlyMessage(errorDetails);
    
    logError(errorDetails, `API Request: ${endpoint}`);

    return {
      error: userMessage,
      errorDetails,
    };
  }
}

/**
 * Catalog API endpoints
 */
export const catalogAPI = {
  /**
   * Get home feed with products and bundles
   */
  async getHomeFeed(page: number = 1): Promise<ApiResponse<{
    products: any[];
    bundles: any[];
    page: number;
    has_next: boolean;
  }>> {
    return apiRequest(`/api/catalog/home-feed/?page=${page}`);
  },

  /**
   * Search products with filters
   */
  async searchProducts(params: {
    q?: string;
    category?: number;
    tag?: number;
    pricing?: 'free' | 'paid';
    page?: number;
  }): Promise<ApiResponse<{
    results: any[];
    total_pages: number;
    current_page: number;
    total_count: number;
  }>> {
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.append('q', params.q);
    if (params.category) queryParams.append('category', params.category.toString());
    if (params.tag) queryParams.append('tag', params.tag.toString());
    if (params.pricing) queryParams.append('pricing', params.pricing);
    if (params.page) queryParams.append('page', params.page.toString());

    return apiRequest(`/api/catalog/search/?${queryParams.toString()}`);
  },

  /**
   * Get product details by ID
   */
  async getProductDetail(productId: number): Promise<ApiResponse<{
    product: any;
  }>> {
    return apiRequest(`/api/catalog/products/${productId}/`);
  },

  /**
   * Get all categories
   */
  async getCategories(): Promise<ApiResponse<{
    categories: any[];
  }>> {
    return apiRequest('/api/catalog/categories/');
  },

  /**
   * Get subcategories for a specific category
   */
  async getCategorySubcategories(categoryId: number): Promise<ApiResponse<{
    subcategories: any[];
  }>> {
    return apiRequest(`/api/catalog/categories/${categoryId}/subcategories/`);
  },

  async getTags(): Promise<ApiResponse<{
    tags: any[];
  }>> {
    return apiRequest('/api/catalog/tags/');
  },

  /**
   * Create a new tag
   */
  async createTag(name: string): Promise<ApiResponse<{
    tag: any;
  }>> {
    return apiRequest('/api/catalog/tags/', {
      method: 'POST',
      body: JSON.stringify({ name: name.trim() }),
    });
  },

  /**
   * Create a new category
   */
  async createCategory(name: string, description?: string): Promise<ApiResponse<{
    category: any;
  }>> {
    return apiRequest('/api/catalog/categories/', {
      method: 'POST',
      body: JSON.stringify({ 
        name: name.trim(),
        description: description?.trim() || '',
      }),
    });
  },

  /**
   * Create a new subcategory
   */
  async createSubcategory(categoryId: number, name: string, description?: string): Promise<ApiResponse<{
    subcategory: any;
  }>> {
    return apiRequest(`/api/catalog/categories/${categoryId}/subcategories/`, {
      method: 'POST',
      body: JSON.stringify({ 
        name: name.trim(),
        description: description?.trim() || '',
      }),
    });
  },

  /**
   * Get trending designs
   */
  async getTrending(): Promise<ApiResponse<{
    trending_designs: any[];
  }>> {
    return apiRequest('/api/catalog/trending/');
  },

  /**
   * Get recently added designs
   */
  async getRecent(): Promise<ApiResponse<{
    recently_added: any[];
  }>> {
    return apiRequest('/api/catalog/recent/');
  },

  /**
   * Get popular categories
   */
  async getPopularCategories(): Promise<ApiResponse<{
    popular_categories: any[];
  }>> {
    return apiRequest('/api/catalog/popular-categories/');
  },
};

/**
 * Auth API endpoints (placeholder - should already exist)
 */
export const apiClient = {
  // Auth methods (these should already exist in your codebase)
  login: async (emailOrUsername: string, password: string): Promise<ApiResponse<{
    user: any;
    tokens: {
      access: string;
      refresh: string;
    };
    [key: string]: any;
  }>> => {
    return apiRequest<{
      user: any;
      tokens: {
        access: string;
        refresh: string;
      };
      [key: string]: any;
    }>('/api/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username: emailOrUsername, password }),
    });
  },
  
  signup: async (data: any): Promise<ApiResponse<{
    user: any;
    tokens: {
      access: string;
      refresh: string;
    };
    [key: string]: any;
  }>> => {
    return apiRequest<{
      user: any;
      tokens: {
        access: string;
        refresh: string;
      };
      [key: string]: any;
    }>('/api/auth/signup/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getUserProfile: async (): Promise<ApiResponse<any>> => {
    return apiRequest<any>('/api/auth/profile/');
  },

  updateProfile: async (data: {
    first_name?: string;
    last_name?: string;
    username?: string;
    mobile_number?: string;
    bio?: string;
    date_of_birth?: string;
  }): Promise<ApiResponse<{
    message?: string;
    user?: any;
    [key: string]: any;
  }>> => {
    return apiRequest<{
      message?: string;
      user?: any;
      [key: string]: any;
    }>('/api/auth/update-profile/', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  refreshToken: async (refreshToken: string): Promise<ApiResponse<{
    access: string;
    refresh: string;
    [key: string]: any;
  }>> => {
    return apiRequest<{
      access: string;
      refresh: string;
      [key: string]: any;
    }>('/api/auth/refresh-token/', {
      method: 'POST',
      body: JSON.stringify({ refresh: refreshToken }),
    });
  },

  logout: async (refreshToken: string) => {
    return apiRequest('/api/auth/logout/', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  },

  requestPasswordReset: async (email: string) => {
    return apiRequest('/api/auth/request-password-reset/', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  confirmPasswordReset: async (data: any) => {
    return apiRequest('/api/auth/confirm-password-reset/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  resendOTP: async (data: any) => {
    return apiRequest('/api/auth/resend-otp/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  verifyEmail: async (email: string, otp: string): Promise<ApiResponse<{
    user?: any;
    [key: string]: any;
  }>> => {
    return apiRequest<{
      user?: any;
      [key: string]: any;
    }>('/api/auth/verify-email/', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  verifyMobileNumber: async (mobile: string, otp: string) => {
    return apiRequest('/api/auth/verify-mobile-number/', {
      method: 'POST',
      body: JSON.stringify({ mobile_number: mobile, otp }),
    });
  },

  addMobileNumber: async (mobile: string) => {
    return apiRequest('/api/auth/add-mobile-number/', {
      method: 'POST',
      body: JSON.stringify({ mobile_number: mobile }),
    });
  },

  // Catalog methods
  ...catalogAPI,

  // Cart methods
  getCart: async (): Promise<ApiResponse<{
    cart_items?: Array<any>;
    [key: string]: any;
  }>> => {
    return apiRequest<{
      cart_items?: Array<any>;
      [key: string]: any;
    }>('/api/orders/cart/');
  },

  addToCart: async (data: { product_id: number; cart_type?: 'cart' | 'wishlist' }) => {
    return apiRequest('/api/orders/cart/add/', {
      method: 'POST',
      body: JSON.stringify({
        product_id: data.product_id,
        cart_type: data.cart_type || 'cart',
      }),
    });
  },

  removeFromCart: async (cartItemId: number) => {
    return apiRequest(`/api/orders/cart/remove/${cartItemId}/`, {
      method: 'DELETE',
    });
  },

  getCartSummary: async (): Promise<ApiResponse<{
    total_amount: number;
    has_active_subscription: boolean;
    will_be_free: boolean;
    subscription_plan?: string;
  }>> => {
    return apiRequest<{
      total_amount: number;
      has_active_subscription: boolean;
      will_be_free: boolean;
      subscription_plan?: string;
    }>('/api/orders/cart/summary/');
  },

  moveToWishlist: async (cartItemId: number) => {
    return apiRequest(`/api/orders/cart/move-to-wishlist/${cartItemId}/`, {
      method: 'POST',
    });
  },

  moveToCart: async (cartItemId: number) => {
    return apiRequest(`/api/orders/cart/move-to-cart/${cartItemId}/`, {
      method: 'POST',
    });
  },

  getWishlist: async (): Promise<ApiResponse<{
    wishlist_items?: Array<any>;
    [key: string]: any;
  }>> => {
    return apiRequest<{
      wishlist_items?: Array<any>;
      [key: string]: any;
    }>('/api/orders/wishlist/');
  },

  // Order methods
  getOrders: async (): Promise<ApiResponse<{
    orders: Array<{
      id: number;
      cart_ids: string;
      total_amount: string;
      status: string;
      created_at: string;
      updated_at: string;
      cart_items?: Array<any>;
      transactions?: Array<any>;
      [key: string]: any;
    }>;
    total_orders?: number;
  }>> => {
    return apiRequest<{
      orders: Array<{
        id: number;
        cart_ids: string;
        total_amount: string;
        status: string;
        created_at: string;
        updated_at: string;
        cart_items?: Array<any>;
        transactions?: Array<any>;
        [key: string]: any;
      }>;
      total_orders?: number;
    }>('/api/orders/orders/');
  },

  getOrderDetail: async (orderId: number): Promise<ApiResponse<any>> => {
    return apiRequest<any>(`/api/orders/orders/${orderId}/`);
  },

  purchaseCart: async (data: {
    payment_method: 'razorpay' | 'wallet';
    address_id: number;
    coupon_code?: string;
  }) => {
    return apiRequest('/api/orders/purchase/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Custom Request methods
  submitCustomRequest: async (data: {
    title: string;
    description: string;
    budget?: number;
  }): Promise<ApiResponse<{
    message: string;
    custom_request: {
      id: number;
      title: string;
      description: string;
      status: string;
      budget: number | null;
      created_at: string;
      updated_at: string;
      media?: Array<any>;
    };
    payment_required: boolean;
    amount: number;
    payment_message: string;
  }>> => {
    return apiRequest<{
      message: string;
      custom_request: {
        id: number;
        title: string;
        description: string;
        status: string;
        budget: number | null;
        created_at: string;
        updated_at: string;
        media?: Array<any>;
      };
      payment_required: boolean;
      amount: number;
      payment_message: string;
    }>('/api/custom-requests/submit/', {
      method: 'POST',
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        budget: data.budget || 200,
      }),
    });
  },

  getCustomRequestHistory: async (): Promise<ApiResponse<{
    custom_requests?: Array<any>;
    [key: string]: any;
  }>> => {
    return apiRequest<{
      custom_requests?: Array<any>;
      [key: string]: any;
    }>('/api/custom-requests/history/');
  },

  getCustomRequestDetail: async (requestId: number): Promise<ApiResponse<{
    custom_request?: any;
    [key: string]: any;
  }>> => {
    return apiRequest<{
      custom_request?: any;
      [key: string]: any;
    }>(`/api/custom-requests/${requestId}/`);
  },

  // Razorpay Payment methods
  createPaymentOrder: async (data: {
    amount: number;
    currency?: string;
    order_id?: string;
    description?: string;
  }): Promise<ApiResponse<{
    razorpay_order_id: string;
    payment_id: number;
  }>> => {
    return apiRequest<{
      razorpay_order_id: string;
      payment_id: number;
    }>('/api/razorpay/create-order/', {
      method: 'POST',
      body: JSON.stringify({
        amount: data.amount,
        currency: data.currency || 'INR',
        order_id: data.order_id,
        description: data.description,
      }),
    });
  },

  capturePayment: async (data: {
    payment_id: number;
    razorpay_payment_id: string;
    amount: number;
  }) => {
    return apiRequest('/api/razorpay/capture-payment/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getPaymentStatus: async (paymentId: number) => {
    return apiRequest(`/api/razorpay/payment/${paymentId}/status/`);
  },

  // Download methods
  getDownloads: async (): Promise<ApiResponse<{
    downloads: Array<{
      id: number;
      cart_ids: string;
      total_amount: string;
      status: string;
      created_at: string;
      updated_at: string;
      [key: string]: any;
    }>;
    total_downloads: number;
  }>> => {
    return apiRequest<{
      downloads: Array<{
        id: number;
        cart_ids: string;
        total_amount: string;
        status: string;
        created_at: string;
        updated_at: string;
        [key: string]: any;
      }>;
      total_downloads: number;
    }>('/api/orders/downloads/');
  },

  // PDF Download methods
  checkPDFEligibility: async (): Promise<ApiResponse<{
    is_eligible: boolean;
    free_downloads_used?: number;
    [key: string]: any;
  }>> => {
    return apiRequest<{
      is_eligible: boolean;
      free_downloads_used?: number;
      [key: string]: any;
    }>('/api/catalog/pdf/check-eligibility/');
  },

  createPDFRequest: async (data: {
    download_type: 'free' | 'paid';
    total_pages: number;
    selection_type?: 'specific' | 'search_results';
    selected_products?: number[];
    search_filters?: any;
  }): Promise<ApiResponse<{
    download_id?: number;
    id?: number;
    pdf_download?: { id?: number; [key: string]: any };
    [key: string]: any;
  }>> => {
    return apiRequest<{
      download_id?: number;
      id?: number;
      pdf_download?: { id?: number; [key: string]: any };
      [key: string]: any;
    }>('/api/catalog/pdf/create-request/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getPDFDownloads: async (params?: { page?: number; page_size?: number }): Promise<ApiResponse<{
    downloads: Array<{
      id: number;
      download_id?: number;
      download_type: 'free' | 'paid';
      status: string;
      total_pages: number;
      total_amount: string | number;
      payment_status?: string;
      created_at: string;
      updated_at?: string;
      products_count?: number;
      [key: string]: any;
    }>;
    total_downloads?: number;
  }>> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.page_size) query.append('page_size', String(params.page_size));
    const queryString = query.toString();
    return apiRequest<{
      downloads: Array<{
        id: number;
        download_id?: number;
        download_type: 'free' | 'paid';
        status: string;
        total_pages: number;
        total_amount: string | number;
        payment_status?: string;
        created_at: string;
        updated_at?: string;
        products_count?: number;
        [key: string]: any;
      }>;
      total_downloads?: number;
    }>(`/api/catalog/pdf/downloads/${queryString ? `?${queryString}` : ''}`);
  },

  getPDFStatus: async (downloadId: number): Promise<ApiResponse<{
    status?: string;
    [key: string]: any;
  }>> => {
    return apiRequest<{
      status?: string;
      [key: string]: any;
    }>(`/api/catalog/pdf/status/${downloadId}/`);
  },

  downloadPDF: async (downloadId: number) => {
    // This will return a blob, so we need special handling
    const baseUrl = getApiBaseUrl();
    if (!baseUrl) {
      return {
        error: 'API base URL is not configured. Please set NEXT_PUBLIC_API_BASE_URL environment variable.',
        errorDetails: {
          type: ErrorType.NETWORK,
          message: 'API base URL is not configured',
          statusCode: 500,
        },
      };
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('wedesign_access_token') : null;
    
    try {
      const response = await fetch(`${baseUrl}/api/catalog/pdf/download/${downloadId}/`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        let errorData: any = {};
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
          } else {
            errorData = { detail: response.statusText || 'Download failed' };
          }
        } catch (parseError) {
          errorData = { detail: response.statusText || 'Download failed' };
        }

        const errorDetails = formatError(errorData, response.status);
        const userMessage = getUserFriendlyMessage(errorDetails);
        logError(errorDetails, 'Download PDF');

        if (response.status === 401) {
          await handleUnauthorized();
        }

        return { error: userMessage, errorDetails };
      }

      // Check if response is JSON (error) or blob (file)
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        const errorDetails = formatError(data, response.status);
        return { error: getUserFriendlyMessage(errorDetails), errorDetails, data };
      }

      // Return blob for file download
      const blob = await response.blob();
      return { data: blob };
    } catch (error: any) {
      const errorDetails = formatError(error, undefined);
      const userMessage = getUserFriendlyMessage(errorDetails);
      logError(errorDetails, 'Download PDF');

      return {
        error: userMessage,
        errorDetails,
      };
    }
  },

  getPDFPricingInfo: async () => {
    return apiRequest('/api/catalog/pdf/pricing/');
  },

  // Address methods
  getAddresses: async (): Promise<ApiResponse<{
    addresses?: Array<any>;
    [key: string]: any;
  }>> => {
    return apiRequest<{
      addresses?: Array<any>;
      [key: string]: any;
    }>('/api/profiles/addresses/');
  },

  createAddress: async (data: {
    address_line_1: string;
    address_line_2?: string;
    landmark?: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
    address_type?: 'home' | 'work' | 'other';
    is_postal?: boolean;
    is_permanent?: boolean;
  }) => {
    return apiRequest('/api/profiles/addresses/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getAddressDetail: async (addressId: number) => {
    return apiRequest(`/api/profiles/addresses/${addressId}/`);
  },

  updateAddress: async (addressId: number, data: {
    address_line_1?: string;
    address_line_2?: string;
    landmark?: string;
    city?: string;
    state?: string;
    country?: string;
    postal_code?: string;
    address_type?: 'home' | 'work' | 'other';
    is_postal?: boolean;
    is_permanent?: boolean;
  }) => {
    return apiRequest(`/api/profiles/addresses/${addressId}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteAddress: async (addressId: number) => {
    return apiRequest(`/api/profiles/addresses/${addressId}/`, {
      method: 'DELETE',
    });
  },

  // Email management methods
  listEmailAddresses: async (): Promise<ApiResponse<{
    emails: Array<{
      id: number;
      email: string;
      is_verified: boolean;
      is_primary: boolean;
      created_at: string;
    }>;
  }>> => {
    return apiRequest<{
      emails: Array<{
        id: number;
        email: string;
        is_verified: boolean;
        is_primary: boolean;
        created_at: string;
      }>;
    }>('/api/auth/emails/');
  },

  addEmailAddress: async (data: {
    email: string;
    is_primary?: boolean;
  }) => {
    return apiRequest('/api/auth/emails/add/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  verifyEmailAddress: async (data: {
    email: string;
    otp: string;
  }) => {
    return apiRequest('/api/auth/emails/verify/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateEmailAddress: async (emailId: number, data: {
    is_primary?: boolean;
  }) => {
    return apiRequest(`/api/auth/emails/${emailId}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteEmailAddress: async (emailId: number) => {
    return apiRequest(`/api/auth/emails/${emailId}/delete/`, {
      method: 'DELETE',
    });
  },

  // Designer Dashboard methods
  getDesignerDashboard: async (): Promise<ApiResponse<any>> => {
    return apiRequest<any>('/api/profiles/designer-dashboard/');
  },

  // Designer Onboarding methods
  saveDesignerOnboardingStep1: async (data: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    is_individual: boolean;
    profile_photo?: File;
  }): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append('first_name', data.first_name);
    formData.append('last_name', data.last_name);
    formData.append('email', data.email);
    formData.append('phone', data.phone);
    formData.append('is_individual', String(data.is_individual));
    if (data.profile_photo) {
      formData.append('profile_photo', data.profile_photo);
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('wedesign_access_token') : null;
    const baseUrl = getApiBaseUrl();
    if (!baseUrl) {
      return {
        error: 'API base URL is not configured. Please set NEXT_PUBLIC_API_BASE_URL environment variable.',
        errorDetails: {
          type: ErrorType.NETWORK,
          message: 'API base URL is not configured',
          statusCode: 500,
        },
      };
    }
    
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      // Don't set Content-Type for FormData - browser will set it automatically with boundary
      
      const response = await fetch(`${baseUrl}/api/profiles/designer-onboarding-step1/`, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include', // Include credentials for CORS
      });

      if (!response.ok) {
        // Handle 413 Payload Too Large specifically
        if (response.status === 413) {
          return {
            error: 'File size is too large. Profile photo must be less than 5MB.',
            errorDetails: formatError({ detail: 'Payload Too Large' }, 413),
          };
        }
        
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        return {
          error: errorData.error || errorData.detail || 'Failed to save Step 1 data',
          errorDetails: formatError(errorData, response.status),
        };
      }

      const data = await response.json();
      return { data };
    } catch (error: any) {
      // Handle network errors (including CORS and 413)
      if (error.message?.includes('CORS') || error.message?.includes('Failed to fetch')) {
        return {
          error: 'Network error: Unable to connect to server. Please check your connection and try again.',
          errorDetails: error,
        };
      }
      return {
        error: error.message || 'Network error occurred',
        errorDetails: error,
      };
    }
  },

  saveDesignerOnboardingStep2: async (data: {
    legal_business_name: string;
    business_type: string;
    business_model: string;
    business_category: string;
    business_sub_category: string;
    street: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    studio_email: string;
    studio_mobile_number: string;
    gst_number?: string;
    msme_udyam_number?: string;
    msme_certificate_annexure?: File;
  }): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append('legal_business_name', data.legal_business_name);
    formData.append('business_type', data.business_type);
    formData.append('business_model', data.business_model);
    formData.append('business_category', data.business_category);
    formData.append('business_sub_category', data.business_sub_category);
    formData.append('street', data.street);
    formData.append('city', data.city);
    formData.append('state', data.state);
    formData.append('postal_code', data.postal_code);
    formData.append('country', data.country);
    formData.append('studio_email', data.studio_email);
    formData.append('studio_mobile_number', data.studio_mobile_number);
    if (data.gst_number) formData.append('gst_number', data.gst_number);
    if (data.msme_udyam_number) formData.append('msme_udyam_number', data.msme_udyam_number);
    if (data.msme_certificate_annexure) {
      formData.append('msme_certificate_annexure', data.msme_certificate_annexure);
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('wedesign_access_token') : null;
    const baseUrl = getApiBaseUrl();
    if (!baseUrl) {
      return {
        error: 'API base URL is not configured. Please set NEXT_PUBLIC_API_BASE_URL environment variable.',
        errorDetails: {
          type: ErrorType.NETWORK,
          message: 'API base URL is not configured',
          statusCode: 500,
        },
      };
    }
    
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      // Don't set Content-Type for FormData - browser will set it automatically with boundary
      
      const response = await fetch(`${baseUrl}/api/profiles/designer-onboarding-step2/`, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include', // Include credentials for CORS
      });

      if (!response.ok) {
        // Handle 413 Payload Too Large specifically
        if (response.status === 413) {
          return {
            error: 'File size is too large. MSME certificate must be less than 10MB.',
            errorDetails: formatError({ detail: 'Payload Too Large' }, 413),
          };
        }
        
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        return {
          error: errorData.error || errorData.detail || 'Failed to save Step 2 data',
          errorDetails: formatError(errorData, response.status),
        };
      }

      const responseData = await response.json();
      return { data: responseData };
    } catch (error: any) {
      return {
        error: error.message || 'Network error occurred',
        errorDetails: error,
      };
    }
  },

  saveDesignerOnboardingStep3: async (data: {
    pan_number: string;
    pan_card?: File;
  }): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append('pan_number', data.pan_number);
    if (data.pan_card) {
      formData.append('pan_card', data.pan_card);
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('wedesign_access_token') : null;
    const baseUrl = getApiBaseUrl();
    if (!baseUrl) {
      return {
        error: 'API base URL is not configured. Please set NEXT_PUBLIC_API_BASE_URL environment variable.',
        errorDetails: {
          type: ErrorType.NETWORK,
          message: 'API base URL is not configured',
          statusCode: 500,
        },
      };
    }
    
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      // Don't set Content-Type for FormData - browser will set it automatically with boundary
      
      const response = await fetch(`${baseUrl}/api/profiles/designer-onboarding-step3/`, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include', // Include credentials for CORS
      });

      if (!response.ok) {
        // Handle 413 Payload Too Large specifically
        if (response.status === 413) {
          return {
            error: 'File size is too large. PAN card document must be less than 10MB.',
            errorDetails: formatError({ detail: 'Payload Too Large' }, 413),
          };
        }
        
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        return {
          error: errorData.error || errorData.detail || 'Failed to save Step 3 data',
          errorDetails: formatError(errorData, response.status),
        };
      }

      const responseData = await response.json();
      return { data: responseData };
    } catch (error: any) {
      return {
        error: error.message || 'Network error occurred',
        errorDetails: error,
      };
    }
  },

  saveDesignerOnboardingStep4: async (zipFile: File): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append('zip_file', zipFile);

    const token = typeof window !== 'undefined' ? localStorage.getItem('wedesign_access_token') : null;
    const baseUrl = getApiBaseUrl();
    if (!baseUrl) {
      return {
        error: 'API base URL is not configured. Please set NEXT_PUBLIC_API_BASE_URL environment variable.',
        errorDetails: {
          type: ErrorType.NETWORK,
          message: 'API base URL is not configured',
          statusCode: 500,
        },
      };
    }
    
    try {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      // Don't set Content-Type for FormData - browser will set it automatically with boundary
      
      const response = await fetch(`${baseUrl}/api/profiles/designer-onboarding-step4/`, {
        method: 'POST',
        headers,
        body: formData,
        credentials: 'include', // Include credentials for CORS
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        return {
          error: errorData.error || errorData.detail || 'Failed to upload zip file',
          errorDetails: errorData,
          validationErrors: errorData.validation_errors,
        };
      }

      const responseData = await response.json();
      return { data: responseData };
    } catch (error: any) {
      return {
        error: error.message || 'Network error occurred',
        errorDetails: error,
      };
    }
  },

  getDesignProcessingProgress: async (taskId: number): Promise<ApiResponse<any>> => {
    const baseUrl = getApiBaseUrl();
    if (!baseUrl) {
      return {
        error: 'API base URL is not configured',
        errorDetails: {
          type: ErrorType.NETWORK,
          message: 'API base URL is not configured',
          statusCode: 500,
        },
      };
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('wedesign_access_token') : null;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${baseUrl}/api/profiles/design-processing-progress/?task_id=${taskId}`, {
        method: 'GET',
        headers,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        return {
          error: errorData.error || errorData.detail || 'Failed to get processing progress',
          errorDetails: formatError(errorData, response.status),
        };
      }

      const responseData = await response.json();
      return { data: responseData };
    } catch (error: any) {
      return {
        error: error.message || 'Network error occurred',
        errorDetails: error,
      };
    }
  },

  getDesignProcessingStatus: async (): Promise<ApiResponse<any>> => {
    return apiRequest<any>('/api/profiles/design-processing-status/');
  },

  streamDesignProcessingProgress: (taskId: number): EventSource | null => {
    const baseUrl = getApiBaseUrl();
    if (!baseUrl || typeof window === 'undefined') {
      return null;
    }

    const token = localStorage.getItem('wedesign_access_token');
    if (!token) {
      return null;
    }

    // Create EventSource for SSE
    // Note: EventSource doesn't support custom headers, so we pass token as query parameter
    const url = `${baseUrl}/api/profiles/design-processing-stream/?task_id=${taskId}&token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(url, {
      withCredentials: true,
    });

    return eventSource;
  },

  getDesignerOnboardingStep1: async (): Promise<ApiResponse<any>> => {
    const response = await apiRequest<any>('/api/profiles/get-designer-onboarding-step1/');
    // Handle 404 gracefully - it means no saved data exists yet (expected for new users)
    if (response.error && response.errorDetails?.statusCode === 404) {
      return { data: null, message: 'No Step 1 data found' };
    }
    return response;
  },

  getDesignerOnboardingStep2: async (): Promise<ApiResponse<any>> => {
    const response = await apiRequest<any>('/api/profiles/get-designer-onboarding-step2/');
    // Handle 404 gracefully - it means no saved data exists yet (expected for new users)
    if (response.error && response.errorDetails?.statusCode === 404) {
      return { data: null, message: 'No Step 2 data found' };
    }
    return response;
  },

  getDesignerOnboardingStep3: async (): Promise<ApiResponse<any>> => {
    const response = await apiRequest<any>('/api/profiles/get-designer-onboarding-step3/');
    // Handle 404 gracefully - it means no saved data exists yet (expected for new users)
    if (response.error && response.errorDetails?.statusCode === 404) {
      return { data: null, message: 'No Step 3 data found' };
    }
    return response;
  },

  getDesignerOnboardingStatus: async (): Promise<ApiResponse<{
    onboarding_status: {
      step1_completed: boolean;
      step2_completed: boolean;
      email_verified: boolean;
      mobile_verified: boolean;
      designer_profile_status: string;
      studio_created: boolean;
      business_details_completed: boolean;
      razorpay_account_verified: boolean;
      design_processing_status?: {
        task_id: number;
        status: string;
        total_designs: number;
        processed_designs: number;
        failed_designs: number;
        progress_percentage: number;
      } | null;
    };
    can_access_console: boolean;
  }>> => {
    return apiRequest<{
      onboarding_status: {
        step1_completed: boolean;
        step2_completed: boolean;
        email_verified: boolean;
        mobile_verified: boolean;
        designer_profile_status: string;
        studio_created: boolean;
        business_details_completed: boolean;
        razorpay_account_verified: boolean;
        design_processing_status?: {
          task_id: number;
          status: string;
          total_designs: number;
          processed_designs: number;
          failed_designs: number;
          progress_percentage: number;
        } | null;
      };
      can_access_console: boolean;
    }>('/api/profiles/designer-onboarding-status/');
  },

  // Wallet methods
  getWalletBalance: async (): Promise<ApiResponse<any>> => {
    return apiRequest<any>('/api/wallet/balance/');
  },

  getWalletSummary: async (): Promise<ApiResponse<any>> => {
    return apiRequest<any>('/api/wallet/summary/');
  },

  getRecentTransactions: async (limit?: number): Promise<ApiResponse<{
    recent_transactions?: Array<any>;
    [key: string]: any;
  }>> => {
    const query = limit ? `?limit=${limit}` : '';
    return apiRequest<{
      recent_transactions?: Array<any>;
      [key: string]: any;
    }>(`/api/wallet/recent-transactions${query}`);
  },

  getWalletTransactions: async (): Promise<ApiResponse<any>> => {
    return apiRequest<any>('/api/wallet/transactions/');
  },

  getEarningsSummary: async (): Promise<ApiResponse<any>> => {
    return apiRequest<any>('/api/wallet/earnings-summary/');
  },

  getWithdrawalRequests: async (): Promise<ApiResponse<{
    withdrawal_requests?: Array<{
      id: number;
      amount: number | string;
      status: string;
      created_at: string;
      reason?: string;
      admin_remarks?: string;
      [key: string]: any;
    }>;
    [key: string]: any;
  }>> => {
    return apiRequest<{
      withdrawal_requests?: Array<{
        id: number;
        amount: number | string;
        status: string;
        created_at: string;
        reason?: string;
        admin_remarks?: string;
        [key: string]: any;
      }>;
      [key: string]: any;
    }>('/api/wallet/withdrawal-requests/');
  },

  getWithdrawalRequestDetail: async (requestId: number) => {
    return apiRequest(`/api/wallet/withdrawal-requests/${requestId}/`);
  },

  createWithdrawal: async (data: { amount: number; reason?: string }) => {
    return apiRequest('/api/wallet/create-withdrawal/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  cancelWithdrawal: async (requestId: number) => {
    return apiRequest(`/api/wallet/withdrawal-requests/${requestId}/cancel/`, {
      method: 'POST',
    });
  },

  // My Designs
  getMyDesigns: async (params?: { 
    page?: number; 
    limit?: number;
    status?: string;
    category_id?: number;
    search?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<ApiResponse<{
    designs?: Array<any>;
    [key: string]: any;
  }>> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    if (params?.status) query.append('status', params.status);
    if (params?.category_id) query.append('category_id', String(params.category_id));
    if (params?.search) query.append('search', params.search);
    if (params?.date_from) query.append('date_from', params.date_from);
    if (params?.date_to) query.append('date_to', params.date_to);
    const queryString = query.toString();
    return apiRequest<{
      designs?: Array<any>;
      [key: string]: any;
    }>(`/api/catalog/my-designs${queryString ? `?${queryString}` : ''}`);
  },

  getDesignDetail: async (designId: number): Promise<ApiResponse<{
    design?: any;
    [key: string]: any;
  }>> => {
    return apiRequest<{
      design?: any;
      [key: string]: any;
    }>(`/api/catalog/designs/${designId}/`);
  },

  getDesignAnalytics: async (designId: number): Promise<ApiResponse<any>> => {
    return apiRequest<any>(`/api/catalog/design-analytics/${designId}/`);
  },

  updateDesign: async (designId: number, data: any) => {
    // Check if data is FormData (for file uploads)
    const isFormData = data instanceof FormData;
    
    return apiRequest(`/api/catalog/designs/${designId}/`, {
      method: 'PUT',
      body: isFormData ? data : JSON.stringify(data),
    });
  },

  deleteDesign: async (designId: number) => {
    return apiRequest(`/api/catalog/designs/${designId}/`, {
      method: 'DELETE',
    });
  },

  // Upload Design
  uploadDesign: async (formData: FormData) => {
    console.log('[uploadDesign] Starting upload...');
    
    const token = typeof window !== 'undefined' 
      ? localStorage.getItem('wedesign_access_token') 
      : null;

    console.log('[uploadDesign] Token found:', token ? 'Yes' : 'No');

    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const baseUrl = getApiBaseUrl();
    if (!baseUrl) {
      console.error('[uploadDesign] No API base URL configured');
      return {
        error: 'API base URL is not configured',
        errorDetails: {
          type: ErrorType.NETWORK,
          message: 'API base URL is not configured',
          statusCode: 500,
        },
      };
    }

    console.log('[uploadDesign] Base URL:', baseUrl);
    console.log('[uploadDesign] Endpoint: /api/catalog/upload-design/');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error('[uploadDesign] Request timeout after 5 minutes');
      controller.abort();
    }, 5 * 60 * 1000); // 5 minutes
    
    try {
      console.log('[uploadDesign] Sending fetch request...');
      const startTime = Date.now();
      const response = await fetch(`${baseUrl}/api/catalog/upload-design/`, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const elapsedTime = Date.now() - startTime;
      console.log(`[uploadDesign] Response received after ${elapsedTime}ms:`, response.status, response.statusText);

      if (!response.ok) {
        console.error('[uploadDesign] Response not OK:', response.status);
        let errorData: any = {};
        try {
          const text = await response.text();
          console.error('[uploadDesign] Error response text:', text);
          errorData = JSON.parse(text);
        } catch (parseError) {
          console.error('[uploadDesign] Failed to parse error response:', parseError);
          errorData = { error: response.statusText || 'Upload failed' };
        }

        if (response.status === 401) {
          console.error('[uploadDesign] Unauthorized - redirecting to login');
          await handleUnauthorized();
        }

        const errorMessage = errorData.error || errorData.detail || 'Upload failed';
        console.error('[uploadDesign] Returning error:', errorMessage);
        return {
          error: errorMessage,
          errorDetails: formatError(errorData, response.status),
        };
      }

      console.log('[uploadDesign] Parsing success response...');
      const data = await response.json();
      console.log('[uploadDesign] Success data:', data);
      return { data };
      
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('[uploadDesign] Exception caught:', error);
      
      if (error.name === 'AbortError') {
        console.error('[uploadDesign] Request aborted (timeout)');
        return {
          error: 'Upload timeout. Please try again with smaller files.',
          errorDetails: {
            type: ErrorType.NETWORK,
            message: 'Upload timeout',
            statusCode: 408,
          },
        };
      }

      const errorMessage = error?.message || 'Failed to upload design. Please check your connection and try again.';
      console.error('[uploadDesign] Returning network error:', errorMessage);
      return {
        error: errorMessage,
        errorDetails: formatError(error, undefined),
      };
    }
  },

  // Designer Profile
  getDesignerProfile: async (): Promise<ApiResponse<{
    designer_profile?: any;
    [key: string]: any;
  }>> => {
    return apiRequest<{
      designer_profile?: any;
      [key: string]: any;
    }>('/api/profiles/designer-profile/');
  },

  updateDesignerProfile: async (profileData: any) => {
    return apiRequest('/api/profiles/designer-profile/', {
      method: 'POST',
      body: JSON.stringify(profileData),
    });
  },

  // Studios
  getStudios: async (params?: {
    status?: string;
    industry_type?: string;
    search?: string;
  }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.industry_type) query.append('industry_type', params.industry_type);
    if (params?.search) query.append('search', params.search);
    const queryString = query.toString();
    return apiRequest(`/api/profiles/studios${queryString ? `?${queryString}` : ''}`);
  },

  getMyStudios: async (): Promise<ApiResponse<any>> => {
    return apiRequest<any>('/api/profiles/my-studios/');
  },

  getStudioDetail: async (studioId: number): Promise<ApiResponse<{
    studio?: any;
    [key: string]: any;
  }>> => {
    return apiRequest<{
      studio?: any;
      [key: string]: any;
    }>(`/api/profiles/studios/${studioId}/`);
  },

  createStudio: async (studioData: any) => {
    return apiRequest('/api/profiles/studios/create/', {
      method: 'POST',
      body: JSON.stringify(studioData),
    });
  },

  updateStudio: async (studioId: number, studioData: any) => {
    return apiRequest(`/api/profiles/studios/${studioId}/`, {
      method: 'PUT',
      body: JSON.stringify(studioData),
    });
  },

  getStudioBusinessDetails: async (studioId: number): Promise<ApiResponse<{
    business_details?: any;
    [key: string]: any;
  }>> => {
    return apiRequest<{
      business_details?: any;
      [key: string]: any;
    }>(`/api/profiles/studios/${studioId}/business-details/`);
  },

  updateStudioBusinessDetails: async (studioId: number, businessData: FormData | any) => {
    // Check if businessData is FormData (for file uploads)
    if (businessData instanceof FormData) {
      try {
        const token = typeof window !== 'undefined' 
          ? localStorage.getItem('wedesign_access_token') 
          : null;

        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const baseUrl = getApiBaseUrl();
        if (!baseUrl) {
          return {
            error: 'API base URL is not configured. Please set NEXT_PUBLIC_API_BASE_URL environment variable.',
            errorDetails: {
              type: ErrorType.NETWORK,
              message: 'API base URL is not configured',
              statusCode: 500,
            },
          };
        }

        const response = await fetch(`${baseUrl}/api/profiles/studios/${studioId}/business-details/`, {
          method: 'POST',
          headers,
          body: businessData,
        });

        if (!response.ok) {
          let errorData: any = {};
          try {
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              errorData = await response.json();
            } else {
              errorData = { detail: response.statusText || 'Update failed' };
            }
          } catch (parseError) {
            errorData = { detail: response.statusText || 'Update failed' };
          }

          const errorDetails = formatError(errorData, response.status);
          const userMessage = getUserFriendlyMessage(errorDetails);
          logError(errorDetails, 'Update Studio Business Details');

          if (response.status === 401) {
            await handleUnauthorized();
          }

          return {
            error: userMessage,
            errorDetails,
            fieldErrors: errorDetails.fieldErrors,
          };
        }

        const data = await response.json();
        return { data };
      } catch (error: any) {
        const errorDetails = formatError(error, undefined);
        const userMessage = getUserFriendlyMessage(errorDetails);
        logError(errorDetails, 'Update Studio Business Details');

        return {
          error: userMessage,
          errorDetails,
        };
      }
    } else {
      return apiRequest(`/api/profiles/studios/${studioId}/business-details/`, {
        method: 'POST',
        body: JSON.stringify(businessData),
      });
    }
  },

  // ==================== PLANS & SUBSCRIPTIONS ====================
  
  /**
   * Get all subscription plans
   */
  getPlans: async () => {
    return apiRequest<{
      monthly_plans: any[];
      annual_plans: any[];
      all_plans: any[];
    }>('/api/plans/plans/');
  },

  /**
   * Get plan detail by ID
   */
  getPlanDetail: async (planId: number) => {
    return apiRequest<{
      plan: any;
    }>(`/api/plans/plans/${planId}/`);
  },

  /**
   * Get user's current subscription
   */
  getMySubscription: async () => {
    return apiRequest<{
      subscription: any;
      has_active_subscription: boolean;
      plan?: any;
    }>('/api/plans/subscription/');
  },

  /**
   * Subscribe to a plan
   */
  subscribeToPlan: async (planId: number, autoRenew: boolean = true) => {
    return apiRequest<{
      message: string;
      subscription: any;
      plan: any;
    }>('/api/plans/subscription/subscribe/', {
      method: 'POST',
      body: JSON.stringify({ plan_id: planId, auto_renew: autoRenew }),
    });
  },

  /**
   * Cancel subscription
   */
  cancelSubscription: async () => {
    return apiRequest<{
      message: string;
      subscription: any;
    }>('/api/plans/subscription/cancel/', {
      method: 'POST',
    });
  },

  /**
   * Update subscription
   */
  updateSubscription: async (data: { auto_renew?: boolean }) => {
    return apiRequest<{
      message: string;
      subscription: any;
    }>('/api/plans/subscription/update/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get subscription history
   */
  getSubscriptionHistory: async () => {
    return apiRequest<{
      subscriptions: any[];
    }>('/api/plans/subscription/history/');
  },

  /**
   * Get subscription benefits
   */
  getSubscriptionBenefits: async () => {
    return apiRequest<{
      benefits: any;
    }>('/api/plans/subscription/benefits/');
  },

  /**
   * Get subscription usage
   */
  getSubscriptionUsage: async () => {
    return apiRequest<{
      usage: any;
    }>('/api/plans/subscription/usage/');
  },

  // ==================== CUSTOM REQUESTS ====================
  
  /**
   * Get custom requests list
   */
  getCustomRequests: async (params?: {
    status?: string;
    search?: string;
    page?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    
    const query = queryParams.toString();
    return apiRequest<{
      custom_requests: any[];
      total_requests: number;
    }>(`/api/custom-requests/${query ? `?${query}` : ''}`);
  },


  /**
   * Cancel custom request
   */
  cancelCustomRequest: async (requestId: number) => {
    return apiRequest<{
      message: string;
      custom_request: any;
    }>(`/api/custom-requests/${requestId}/cancel/`, {
      method: 'POST',
    });
  },

  /**
   * Get custom request comments
   */
  getCustomRequestComments: async (requestId: number) => {
    return apiRequest<{
      comments: any[];
    }>(`/api/custom-requests/${requestId}/comments/`);
  },

  /**
   * Add comment to custom request
   */
  addCustomRequestComment: async (requestId: number, data: {
    comment: string;
    media_ids?: number[];
  }) => {
    return apiRequest<{
      message: string;
      comment: any;
    }>(`/api/custom-requests/${requestId}/comments/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // ==================== NOTIFICATIONS ====================
  
  /**
   * Get notifications
   */
  getNotifications: async (params?: {
    status?: 'unread' | 'read' | 'all';
    type?: string;
    page?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.page) queryParams.append('page', params.page.toString());
    
    const query = queryParams.toString();
    return apiRequest<{
      notifications: any[];
      unread_count: number;
      total_count: number;
      filters_applied: any;
    }>(`/api/notifications/designer-notifications/${query ? `?${query}` : ''}`);
  },

  /**
   * Get notification count
   */
  getNotificationCount: async () => {
    return apiRequest<{
      unread_count: number;
    }>('/api/notifications/notification-count/');
  },

  /**
   * Mark notification as read
   */
  markNotificationRead: async (notificationId: number) => {
    return apiRequest<{
      message: string;
    }>(`/api/notifications/mark-notification-read/${notificationId}/`, {
      method: 'POST',
    });
  },

  /**
   * Mark all notifications as read
   */
  markAllNotificationsRead: async () => {
    return apiRequest<{
      message: string;
    }>('/api/notifications/mark-all-notifications-read/', {
      method: 'POST',
    });
  },

  /**
   * Get notification statistics
   */
  getNotificationStatistics: async () => {
    return apiRequest<{
      unread_count: number;
      total_count: number;
      by_type: any;
      by_priority: any;
    }>('/api/notifications/statistics/');
  },

  // ==================== SUPPORT & CHAT ====================
  
  /**
   * Get support tickets/threads
   */
  getSupportTickets: async () => {
    return apiRequest<{
      threads: any[];
      total_threads: number;
      open_threads: number;
      closed_threads: number;
    }>('/api/feedback/support-threads/');
  },

  /**
   * Create support thread
   */
  createSupportThread: async (data: {
    subject: string;
    message: string;
    priority?: 'low' | 'medium' | 'high';
    category?: string;
  }) => {
    return apiRequest<{
      message: string;
      thread_id: string;
    }>('/api/feedback/create-support-thread/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Get support thread messages
   */
  getSupportThreadMessages: async (threadId: number) => {
    return apiRequest<{
      thread_id: number;
      messages: any[];
      status: string;
      subject: string;
    }>(`/api/feedback/support-thread/${threadId}/`);
  },

  /**
   * Send message to support thread
   */
  sendSupportMessage: async (threadId: number, message: string) => {
    return apiRequest<{
      message: string;
      message_id: string;
    }>(`/api/feedback/support-thread/${threadId}/`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },

  /**
   * Get business configuration values
   */
  getBusinessConfig: async (): Promise<ApiResponse<{
    commission_rate: number;
    gst_percentage: number;
    custom_order_time_slot_hours: number;
    minimum_required_designs_onboard: number;
  }>> => {
    const response = await apiRequest<{
      message: string;
      data: {
        commission_rate: number;
        gst_percentage: number;
        custom_order_time_slot_hours: number;
        minimum_required_designs_onboard: number;
      };
    }>('/api/coreadmin/business-config/');
    
    // Transform response to match expected format
    if (response.data?.data) {
      return {
        data: response.data.data,
      };
    }
    return response as ApiResponse<{
      commission_rate: number;
      gst_percentage: number;
      custom_order_time_slot_hours: number;
      minimum_required_designs_onboard: number;
    }>;
  },
};

