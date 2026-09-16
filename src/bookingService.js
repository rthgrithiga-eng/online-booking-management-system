/**
 * Booking Service - Client-side Service Layer
 * 
 * ARCHITECTURE NOTE FOR FUTURE SPRING BOOT INTEGRATION:
 * This layer is intentionally designed to match the Spring Boot REST API contract:
 * - GET    /api/v1/services         -> getAllServices()
 * - GET    /api/v1/services/{id}    -> getServiceById(id)
 * - POST   /api/v1/services         -> addService(data)
 * - PUT    /api/v1/services/{id}    -> updateService(id, data)
 * - DELETE /api/v1/services/{id}    -> deleteService(id)
 * 
 * - GET    /api/v1/bookings         -> getAllBookings()
 * - GET    /api/v1/bookings/{id}    -> getBookingById(id)
 * - POST   /api/v1/bookings         -> createBooking(data)
 * - PUT    /api/v1/bookings/{id}    -> updateBooking(id, data)
 * - PATCH  /api/v1/bookings/{id}/status -> updateBookingStatus(id, status)
 * - DELETE /api/v1/bookings/{id}    -> cancelBooking(id)
 */

import { INITIAL_SERVICES, INITIAL_BOOKINGS, AVAILABLE_TIME_SLOTS } from './mockData.js';

const STORAGE_KEYS = {
  SERVICES: 'obms_services_data',
  BOOKINGS: 'obms_bookings_data',
};

const DEFAULT_API_BASE_URL = (typeof window !== 'undefined' && window.__API_BASE_URL__) 
  || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL)
  || 'http://localhost:8080/api';

/**
 * Helper to convert date ("YYYY-MM-DD") and slot ("10:00 AM - 10:45 AM") to ISO-8601 "YYYY-MM-DDTHH:mm:ss"
 */
function convertDateAndSlotToISO(dateStr, slotStr) {
  if (!dateStr) return null;
  let hours = 9;
  let minutes = 0;
  if (slotStr) {
    const match = slotStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (match) {
      hours = parseInt(match[1], 10);
      minutes = parseInt(match[2], 10);
      const meridiem = match[3] ? match[3].toUpperCase() : null;
      if (meridiem === 'PM' && hours < 12) hours += 12;
      if (meridiem === 'AM' && hours === 12) hours = 0;
    }
  }
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  return `${dateStr}T${hh}:${mm}:00`;
}

class BookingDataService {
  constructor() {
    this.services = [];
    this.bookings = [];
    this.apiBaseUrl = DEFAULT_API_BASE_URL;
    this.isBackendConnected = false;
    this.authToken = null;
    this.currentUser = null;
    this.initStorage();
  }

  getAuthToken() {
    return this.authToken 
      || (typeof window !== 'undefined' && window.__AUTH_TOKEN__) 
      || (typeof localStorage !== 'undefined' && localStorage.getItem('auth_token')) 
      || null;
  }

  setAuthToken(token) {
    this.authToken = token;
    if (typeof localStorage !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  getCurrentUser() {
    if (this.currentUser) return this.currentUser;
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('auth_user');
      if (stored) {
        try {
          this.currentUser = JSON.parse(stored);
          return this.currentUser;
        } catch (e) {
          // ignore corrupted storage
        }
      }
    }
    return null;
  }

  setCurrentUser(user) {
    this.currentUser = user;
    if (typeof localStorage !== 'undefined') {
      if (user) {
        localStorage.setItem('auth_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('auth_user');
      }
    }
  }

  logout() {
    this.setAuthToken(null);
    this.setCurrentUser(null);
  }

  getAuthHeaders(extraHeaders = {}) {
    const headers = { 'Content-Type': 'application/json', ...extraHeaders };
    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async login(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: cleanPass })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const status = response.status;
        const msg = errorData.message || (status === 401 ? 'Invalid email or password' : `Login failed (HTTP ${status})`);
        const err = new Error(msg);
        err.status = status;
        throw err;
      }

      const data = await response.json();
      if (data.token) {
        this.setAuthToken(data.token);
      }
      this.setCurrentUser(data);
      return data;
    } catch (err) {
      // If network fails (e.g. backend offline on localhost:8080 during frontend standalone preview)
      if (err.name === 'TypeError' || (err.message && (err.message.includes('fetch') || err.message.includes('NetworkError')))) {
        const seededUsers = [
          { id: 1, email: 'alex.morgan@example.com', fullName: 'Alex Morgan', role: 'CUSTOMER', phone: '+1-555-0192' },
          { id: 2, email: 'sarah.connor@example.com', fullName: 'Sarah Connor', role: 'CUSTOMER', phone: '+1-555-0144' },
          { id: 3, email: 'admin@onlinebooking.com', fullName: 'Admin User', role: 'ADMIN', phone: '+1-555-0100' }
        ];
        const match = seededUsers.find(u => u.email.toLowerCase() === cleanEmail);
        if (match && cleanPass.length > 0) {
          const demoUser = {
            token: `demo-jwt-${match.id}-${Date.now()}`,
            tokenType: 'Bearer',
            userId: match.id,
            email: match.email,
            fullName: match.fullName,
            role: match.role
          };
          this.setAuthToken(demoUser.token);
          this.setCurrentUser(demoUser);
          return demoUser;
        } else {
          const authErr = new Error('Invalid email or password');
          authErr.status = 401;
          throw authErr;
        }
      }
      console.error("Authentication error:", err);
      throw err;
    }
  }

  initStorage() {
    try {
      const storedServices = localStorage.getItem(STORAGE_KEYS.SERVICES);
      if (storedServices) {
        this.services = JSON.parse(storedServices);
      } else {
        this.services = [...INITIAL_SERVICES];
        this.saveServices();
      }

      const storedBookings = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
      if (storedBookings) {
        this.bookings = JSON.parse(storedBookings);
      } else {
        this.bookings = [...INITIAL_BOOKINGS];
        this.saveBookings();
      }
    } catch (e) {
      console.warn("Storage fallback to memory:", e);
      this.services = [...INITIAL_SERVICES];
      this.bookings = [...INITIAL_BOOKINGS];
    }
  }

  saveServices() {
    try {
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(this.services));
    } catch (e) {
      console.error("Could not persist services:", e);
    }
  }

  saveBookings() {
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(this.bookings));
    } catch (e) {
      console.error("Could not persist bookings:", e);
    }
  }

  // --- BACKEND API SYNCHRONIZATION ---

  async loadDataFromBackend() {
    try {
      await Promise.allSettled([
        this.fetchServicesFromBackend(),
        this.fetchBookingsFromBackend()
      ]);
    } catch (err) {
      console.debug("Standalone mode active (Backend not reachable, using local storage):", err.message);
    }
  }

  async fetchServicesFromBackend() {
    try {
      const res = await fetch(`${this.apiBaseUrl}/services?activeOnly=false`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        this.services = data.map(s => ({
          id: s.id,
          name: s.title || s.name,
          category: s.category || "Healthcare",
          description: s.description || "",
          durationMinutes: s.durationMinutes || 45,
          price: Number(s.price) || 50.00,
          badge: s.isActive ? "Active" : "Inactive",
          icon: "calendar",
          isActive: s.isActive
        }));
        this.saveServices();
        this.isBackendConnected = true;
      }
      return this.services;
    } catch (e) {
      console.debug("Backend services API not available, using stored services:", e.message);
      return this.services;
    }
  }

  async fetchBookingsFromBackend(statusFilter) {
    try {
      const query = statusFilter && statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
      const res = await fetch(`${this.apiBaseUrl}/bookings${query}`, {
        headers: this.getAuthHeaders()
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        this.bookings = data.map(b => ({
          id: `BKG-${b.id}`,
          rawId: b.id,
          serviceId: b.serviceId,
          serviceName: b.serviceTitle || "Service",
          customerName: b.userFullName || "Alex Morgan",
          customerEmail: b.userEmail || "alex.morgan@example.com",
          customerPhone: "+1 (555) 234-5678",
          bookingDate: b.bookingDate || (b.bookingDateTime ? b.bookingDateTime.split('T')[0] : ""),
          timeSlot: b.bookingTime ? `${b.bookingTime} (${b.serviceDurationMinutes || 45} mins)` : "10:00 AM",
          price: Number(b.totalAmount) || 0,
          status: b.status || "PENDING",
          notes: b.notes || "",
          createdAt: b.createdAt || new Date().toISOString()
        }));
        this.saveBookings();
        this.isBackendConnected = true;
      }
      return this.bookings;
    } catch (e) {
      console.debug("Backend bookings API not available, using stored bookings:", e.message);
      return this.bookings;
    }
  }

  // --- SERVICE OPERATIONS ---

  getAllServices() {
    return [...this.services];
  }

  getServiceById(id) {
    const numId = Number(id);
    return this.services.find(s => s.id === numId) || null;
  }

  addService(serviceData) {
    const newId = this.services.length > 0 
      ? Math.max(...this.services.map(s => s.id)) + 1 
      : 1;

    const newService = {
      id: newId,
      name: serviceData.name.trim(),
      category: serviceData.category || "General",
      description: serviceData.description.trim(),
      durationMinutes: parseInt(serviceData.durationMinutes, 10) || 45,
      price: parseFloat(serviceData.price) || 50.00,
      badge: serviceData.badge || "New",
      icon: serviceData.icon || "calendar"
    };

    this.services.push(newService);
    this.saveServices();

    // Async push to backend if available
    fetch(`${this.apiBaseUrl}/services`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        title: newService.name,
        description: newService.description,
        durationMinutes: newService.durationMinutes,
        price: newService.price,
        isActive: true
      })
    }).catch(err => console.debug("Service backend sync skipped:", err.message));

    return newService;
  }

  updateService(id, serviceData) {
    const numId = Number(id);
    const index = this.services.findIndex(s => s.id === numId);
    if (index === -1) return null;

    this.services[index] = {
      ...this.services[index],
      name: serviceData.name.trim(),
      category: serviceData.category || this.services[index].category,
      description: serviceData.description.trim(),
      durationMinutes: parseInt(serviceData.durationMinutes, 10) || this.services[index].durationMinutes,
      price: parseFloat(serviceData.price) || this.services[index].price,
      badge: serviceData.badge || this.services[index].badge
    };

    this.saveServices();

    // Async push to backend
    fetch(`${this.apiBaseUrl}/services/${numId}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        title: this.services[index].name,
        description: this.services[index].description,
        durationMinutes: this.services[index].durationMinutes,
        price: this.services[index].price,
        isActive: true
      })
    }).catch(err => console.debug("Service update backend sync skipped:", err.message));

    return this.services[index];
  }

  deleteService(id) {
    const numId = Number(id);
    this.services = this.services.filter(s => s.id !== numId);
    this.saveServices();

    fetch(`${this.apiBaseUrl}/services/${numId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    }).catch(err => console.debug("Service delete backend sync skipped:", err.message));

    return true;
  }

  // --- BOOKING OPERATIONS ---

  getAllBookings() {
    return [...this.bookings].sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime());
  }

  getBookingById(id) {
    return this.bookings.find(b => b.id === id || String(b.rawId) === String(id)) || null;
  }

  async createBooking(bookingInput) {
    const service = this.getServiceById(bookingInput.serviceId);
    if (!service) {
      throw new Error("Invalid service selected.");
    }

    const isoDateTime = convertDateAndSlotToISO(bookingInput.bookingDate, bookingInput.timeSlot);

    // Try creating on Spring Boot backend first
    try {
      const payload = {
        userId: Number(bookingInput.userId) || 1, // Default to Alex Morgan (user 1)
        serviceId: Number(bookingInput.serviceId),
        bookingDateTime: isoDateTime,
        notes: bookingInput.notes ? bookingInput.notes.trim() : ""
      };

      const response = await fetch(`${this.apiBaseUrl}/bookings`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 409) {
          throw new Error(errorData.message || "Conflict: This time slot is already booked. Please choose another date or time.");
        } else if (response.status === 400) {
          const detail = errorData.validationErrors 
            ? Object.values(errorData.validationErrors).join(', ') 
            : errorData.message;
          throw new Error(detail || "Invalid booking details provided.");
        } else if (response.status === 404) {
          throw new Error(errorData.message || "User or Service not found.");
        } else {
          throw new Error(errorData.message || `Server error (HTTP ${response.status})`);
        }
      }

      const backendData = await response.json();
      const newBooking = {
        id: `BKG-${backendData.id}`,
        rawId: backendData.id,
        serviceId: backendData.serviceId,
        serviceName: backendData.serviceTitle || service.name,
        customerName: backendData.userFullName || bookingInput.customerName.trim(),
        customerEmail: backendData.userEmail || bookingInput.customerEmail.trim().toLowerCase(),
        customerPhone: bookingInput.customerPhone ? bookingInput.customerPhone.trim() : "",
        bookingDate: backendData.bookingDate || bookingInput.bookingDate,
        timeSlot: bookingInput.timeSlot,
        price: Number(backendData.totalAmount) || service.price,
        status: backendData.status || "PENDING",
        notes: backendData.notes || (bookingInput.notes ? bookingInput.notes.trim() : ""),
        createdAt: backendData.createdAt || new Date().toISOString()
      };

      this.bookings.unshift(newBooking);
      this.saveBookings();
      return newBooking;

    } catch (networkOrApiErr) {
      // If it's a specific validation/conflict error thrown from the response handling above, re-throw it!
      if (networkOrApiErr.message && (
          networkOrApiErr.message.includes("Conflict") || 
          networkOrApiErr.message.includes("already booked") ||
          networkOrApiErr.message.includes("future") ||
          networkOrApiErr.message.includes("inactive") ||
          networkOrApiErr.message.includes("Validation") ||
          networkOrApiErr.message.includes("not found")
      )) {
        throw networkOrApiErr;
      }

      console.debug("Backend unreachable, falling back to client-side booking:", networkOrApiErr.message);

      // Conflict check against local bookings
      const hasConflict = this.bookings.some(b => 
        b.serviceId === service.id && 
        b.bookingDate === bookingInput.bookingDate && 
        b.timeSlot === bookingInput.timeSlot &&
        b.status !== "CANCELLED"
      );

      if (hasConflict) {
        throw new Error("Conflict: The selected time slot is already booked for this service. Please choose another time slot.");
      }

      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const bookingId = `BKG-${randomNum}`;

      const newBooking = {
        id: bookingId,
        serviceId: service.id,
        serviceName: service.name,
        customerName: bookingInput.customerName.trim(),
        customerEmail: bookingInput.customerEmail.trim().toLowerCase(),
        customerPhone: bookingInput.customerPhone ? bookingInput.customerPhone.trim() : "",
        bookingDate: bookingInput.bookingDate,
        timeSlot: bookingInput.timeSlot,
        price: service.price,
        status: "CONFIRMED",
        notes: bookingInput.notes ? bookingInput.notes.trim() : "No special notes provided.",
        createdAt: new Date().toISOString()
      };

      this.bookings.unshift(newBooking);
      this.saveBookings();
      return newBooking;
    }
  }

  async updateBooking(id, updateData) {
    const index = this.bookings.findIndex(b => b.id === id || String(b.rawId) === String(id));
    if (index === -1) return null;

    const currentBooking = this.bookings[index];
    const numericId = currentBooking.rawId || (typeof id === 'string' ? id.replace('BKG-', '') : id);

    // If changing date/time, try Spring Boot PUT /api/bookings/{id}
    if (updateData.bookingDate) {
      const isoDateTime = convertDateAndSlotToISO(updateData.bookingDate, updateData.timeSlot || currentBooking.timeSlot);
      try {
        const response = await fetch(`${this.apiBaseUrl}/bookings/${numericId}`, {
          method: 'PUT',
          headers: this.getAuthHeaders(),
          body: JSON.stringify({
            bookingDateTime: isoDateTime,
            notes: updateData.notes !== undefined ? updateData.notes : currentBooking.notes
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          if (response.status === 409) {
            throw new Error(errData.message || "Conflict: The new time slot is already booked for this service.");
          } else if (response.status === 400) {
            throw new Error(errData.message || "Invalid update data provided.");
          } else if (response.status === 404) {
            throw new Error(errData.message || "Booking not found.");
          }
        }
      } catch (err) {
        if (err.message && (err.message.includes("Conflict") || err.message.includes("already booked") || err.message.includes("future"))) {
          throw err;
        }
        console.debug("Backend update skipped or offline:", err.message);
      }
    }

    if (updateData.serviceId && updateData.serviceId !== this.bookings[index].serviceId) {
      const s = this.getServiceById(updateData.serviceId);
      if (s) {
        this.bookings[index].serviceId = s.id;
        this.bookings[index].serviceName = s.name;
        this.bookings[index].price = s.price;
      }
    }

    if (updateData.bookingDate) this.bookings[index].bookingDate = updateData.bookingDate;
    if (updateData.timeSlot) this.bookings[index].timeSlot = updateData.timeSlot;
    if (updateData.customerName) this.bookings[index].customerName = updateData.customerName.trim();
    if (updateData.customerEmail) this.bookings[index].customerEmail = updateData.customerEmail.trim();
    if (updateData.customerPhone) this.bookings[index].customerPhone = updateData.customerPhone.trim();
    if (updateData.notes !== undefined) this.bookings[index].notes = updateData.notes.trim();
    if (updateData.status) this.bookings[index].status = updateData.status;

    this.saveBookings();
    return this.bookings[index];
  }

  async cancelBooking(id) {
    const booking = this.bookings.find(b => b.id === id || String(b.rawId) === String(id));
    const numericId = (booking && booking.rawId) || (typeof id === 'string' ? id.replace('BKG-', '') : id);

    try {
      await fetch(`${this.apiBaseUrl}/bookings/${numericId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
    } catch (e) {
      console.debug("Backend cancel API skipped or offline:", e.message);
    }

    return this.updateBookingStatus(id, "CANCELLED");
  }

  async updateBookingStatus(id, newStatus) {
    const booking = this.bookings.find(b => b.id === id || String(b.rawId) === String(id));
    if (!booking) return null;

    const numericId = booking.rawId || (typeof id === 'string' ? id.replace('BKG-', '') : id);

    try {
      await fetch(`${this.apiBaseUrl}/bookings/${numericId}/status`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
    } catch (e) {
      console.debug("Backend status update skipped or offline:", e.message);
    }

    booking.status = newStatus;
    this.saveBookings();
    return booking;
  }

  deleteBookingPermanent(id) {
    this.bookings = this.bookings.filter(b => b.id !== id && String(b.rawId) !== String(id));
    this.saveBookings();
    return true;
  }

  getTimeSlots() {
    return [...AVAILABLE_TIME_SLOTS];
  }

  getStats() {
    const totalServices = this.services.length;
    const totalBookings = this.bookings.length;
    const pendingBookings = this.bookings.filter(b => b.status === "PENDING").length;
    const confirmedBookings = this.bookings.filter(b => b.status === "CONFIRMED").length;
    const completedBookings = this.bookings.filter(b => b.status === "COMPLETED").length;
    const cancelledBookings = this.bookings.filter(b => b.status === "CANCELLED").length;
    const totalRevenue = this.bookings
      .filter(b => b.status === "CONFIRMED" || b.status === "COMPLETED")
      .reduce((sum, b) => sum + (Number(b.price) || 0), 0);

    return {
      totalServices,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue
    };
  }

  resetToDefaults() {
    this.services = [...INITIAL_SERVICES];
    this.bookings = [...INITIAL_BOOKINGS];
    this.saveServices();
    this.saveBookings();
  }
}

export const bookingService = new BookingDataService();

