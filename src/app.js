/**
 * Online Booking Management System - Main Application Controller
 * Handles SPA navigation, dynamic view rendering, form validations, and user interactions.
 */

import { bookingService } from './bookingService.js';

// SVG Icons Helper for clean rendering without heavy external dependencies
const ICONS = {
  calendar: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
  clock: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
  checkCircle: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
  search: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
  user: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
  trash: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
  edit: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
  plus: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
  info: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
  tag: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>`
};

class AppController {
  constructor() {
    this.currentView = 'home';
    this.selectedTimeSlot = '';
    this.bookingFilterStatus = 'ALL';
    this.bookingSearchQuery = '';
    this.serviceSearchQuery = '';
    this.serviceFilterCategory = 'ALL';
    this.adminActiveTab = 'bookings';
    this.rescheduleTargetBookingId = null;
    this.editingServiceId = null;
    this.pendingServiceId = null;
    
    this.init();
  }

  async init() {
    this.updateAuthNav();
    this.bindEvents();
    this.handleRoute();
    window.addEventListener('hashchange', () => this.handleRoute());

    // Synchronize with Spring Boot REST backend if online
    try {
      await bookingService.loadDataFromBackend();
      this.renderCurrentView();
    } catch (e) {
      console.debug("Backend initial load skipped:", e);
    }
  }

  // --- ROUTING & VIEW NAVIGATION ---

  handleRoute() {
    const hash = window.location.hash.replace('#', '') || 'home';
    const validViews = ['home', 'services', 'booking', 'my-bookings', 'admin', 'login'];
    this.currentView = validViews.includes(hash) ? hash : 'home';

    // Update active nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      const linkView = link.getAttribute('data-view');
      if (linkView === this.currentView) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Hide all views, display the active view
    document.querySelectorAll('.page-view').forEach(view => {
      view.classList.remove('active-view');
    });

    const activeElem = document.getElementById(`view-${this.currentView}`);
    if (activeElem) {
      activeElem.classList.add('active-view');
    }

    // Close mobile menu if opened
    const navMenu = document.getElementById('navMenu');
    if (navMenu) navMenu.classList.remove('show-mobile');

    // Scroll smoothly to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Render corresponding view data
    this.renderCurrentView();
  }

  navigateTo(viewId, queryParams = {}) {
    if (queryParams.serviceId) {
      this.pendingServiceId = queryParams.serviceId;
    }
    if (window.location.hash === `#${viewId}`) {
      this.handleRoute();
    } else {
      window.location.hash = `#${viewId}`;
    }
    if (queryParams.serviceId) {
      this.preselectService(queryParams.serviceId);
    }
  }

  updateAuthNav() {
    const user = bookingService.getCurrentUser();
    const navBtnLogin = document.getElementById('navBtnLogin');
    const navUserBadge = document.getElementById('navUserBadge');
    const navUserName = document.getElementById('navUserName');
    const navUserRole = document.getElementById('navUserRole');
    const navMenuAuthText = document.getElementById('navMenuAuthText');

    if (user) {
      if (navBtnLogin) navBtnLogin.style.display = 'none';
      if (navUserBadge) navUserBadge.style.display = 'inline-flex';
      if (navUserName) navUserName.textContent = user.fullName || user.email;
      if (navUserRole) navUserRole.textContent = user.role || 'CUSTOMER';
      if (navMenuAuthText) navMenuAuthText.textContent = user.fullName || 'Account';
    } else {
      if (navBtnLogin) navBtnLogin.style.display = 'inline-flex';
      if (navUserBadge) navUserBadge.style.display = 'none';
      if (navMenuAuthText) navMenuAuthText.textContent = 'Login';
    }
  }

  renderCurrentView() {
    switch (this.currentView) {
      case 'home':
        this.renderHome();
        break;
      case 'services':
        this.renderServices();
        break;
      case 'booking':
        this.renderBookingForm();
        break;
      case 'my-bookings':
        this.renderMyBookings();
        break;
      case 'admin':
        this.renderAdmin();
        break;
      case 'login':
        this.renderLogin();
        break;
    }
  }

  // --- LOGIN VIEW ---

  renderLogin() {
    const user = bookingService.getCurrentUser();
    const loginForm = document.getElementById('loginForm');
    const alreadyAlert = document.getElementById('loginAlreadyAlert');
    const alreadyUserText = document.getElementById('loginAlreadyUserText');
    const errorAlert = document.getElementById('loginErrorAlert');

    if (errorAlert) errorAlert.style.display = 'none';

    if (user) {
      if (alreadyAlert) alreadyAlert.style.display = 'block';
      if (alreadyUserText) {
        alreadyUserText.textContent = `${user.fullName || user.email} (${user.email}) • Role: ${user.role || 'CUSTOMER'}`;
      }
      if (loginForm) loginForm.style.display = 'none';
    } else {
      if (alreadyAlert) alreadyAlert.style.display = 'none';
      if (loginForm) loginForm.style.display = 'block';
    }
  }

  // --- HOME VIEW ---

  renderHome() {
    const stats = bookingService.getStats();
    
    const totalServicesEl = document.getElementById('homeTotalServices');
    const totalSlotsEl = document.getElementById('homeTotalSlots');
    const activeBookingsEl = document.getElementById('homeActiveBookings');
    const confirmedEl = document.getElementById('homeConfirmedBookings');

    if (totalServicesEl) totalServicesEl.textContent = stats.totalServices;
    if (totalSlotsEl) totalSlotsEl.textContent = bookingService.getTimeSlots().length * 3;
    if (activeBookingsEl) activeBookingsEl.textContent = stats.totalBookings;
    if (confirmedEl) confirmedEl.textContent = stats.confirmedBookings;

    // Render featured services (first 3)
    const featuredServicesContainer = document.getElementById('homeFeaturedServices');
    if (featuredServicesContainer) {
      const services = bookingService.getAllServices().slice(0, 3);
      featuredServicesContainer.innerHTML = services.map(s => this.generateServiceCardHtml(s)).join('');
    }
  }

  // --- SERVICES VIEW ---

  renderServices() {
    const container = document.getElementById('servicesListContainer');
    if (!container) return;

    let services = bookingService.getAllServices();

    // Category filter
    if (this.serviceFilterCategory !== 'ALL') {
      services = services.filter(s => s.category.toLowerCase() === this.serviceFilterCategory.toLowerCase());
    }

    // Search query
    if (this.serviceSearchQuery) {
      const query = this.serviceSearchQuery.toLowerCase();
      services = services.filter(s => 
        s.name.toLowerCase().includes(query) || 
        s.description.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query)
      );
    }

    if (services.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-icon">${ICONS.search}</div>
          <h3 class="empty-title">No matching services found</h3>
          <p class="empty-desc">Try clearing your search keyword or switching category filter.</p>
          <button class="btn btn-secondary btn-sm" id="btnResetServiceFilter">Reset Filters</button>
        </div>
      `;
      const resetBtn = document.getElementById('btnResetServiceFilter');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          this.serviceFilterCategory = 'ALL';
          this.serviceSearchQuery = '';
          const searchInput = document.getElementById('serviceSearchInput');
          if (searchInput) searchInput.value = '';
          document.querySelectorAll('.service-category-btn').forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-category') === 'ALL');
          });
          this.renderServices();
        });
      }
      return;
    }

    container.innerHTML = services.map(s => this.generateServiceCardHtml(s)).join('');
  }

  generateServiceCardHtml(service) {
    return `
      <div class="service-card" id="service-card-${service.id}">
        <div class="service-header">
          <span class="service-category-badge">${service.category}</span>
          ${service.badge ? `<span class="service-highlight-badge">${service.badge}</span>` : ''}
        </div>
        <h3 class="service-title">${service.name}</h3>
        <p class="service-description">${service.description}</p>
        <div class="service-meta">
          <div class="service-duration">
            ${ICONS.clock}
            <span>${service.durationMinutes} mins</span>
          </div>
          <div class="service-price">$${Number(service.price).toFixed(2)}</div>
        </div>
        <button class="btn btn-primary btn-book-service" data-id="${service.id}" style="width: 100%;">
          ${ICONS.calendar} Book Now
        </button>
      </div>
    `;
  }

  // --- BOOKING FORM VIEW ---

  renderBookingForm() {
    const serviceSelect = document.getElementById('bookingServiceSelect');
    const services = bookingService.getAllServices();

    if (serviceSelect) {
      const currentSelected = serviceSelect.value;
      serviceSelect.innerHTML = `
        <option value="">-- Choose a Service --</option>
        ${services.map(s => `
          <option value="${s.id}" data-price="${s.price}" data-duration="${s.durationMinutes}">
            ${s.name} ($${Number(s.price).toFixed(2)} - ${s.durationMinutes} mins)
          </option>
        `).join('')}
      `;

      if (this.pendingServiceId) {
        serviceSelect.value = String(this.pendingServiceId);
        this.pendingServiceId = null;
      } else if (currentSelected) {
        serviceSelect.value = currentSelected;
      }
    }

    // Set min date to today
    const dateInput = document.getElementById('bookingDate');
    if (dateInput && !dateInput.value) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      dateInput.min = `${yyyy}-${mm}-${dd}`;
      
      // Default to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const t_dd = String(tomorrow.getDate()).padStart(2, '0');
      const t_mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
      dateInput.value = `${tomorrow.getFullYear()}-${t_mm}-${t_dd}`;
    }

    // Render Time Slots
    this.renderTimeSlots();
    this.updateBookingSummary();
  }

  renderTimeSlots() {
    const slotsContainer = document.getElementById('bookingSlotsContainer');
    if (!slotsContainer) return;

    const slots = bookingService.getTimeSlots();
    if (!this.selectedTimeSlot && slots.length > 0) {
      this.selectedTimeSlot = slots[1] || slots[0]; // pick morning slot as default
    }

    slotsContainer.innerHTML = slots.map(slot => `
      <div class="slot-chip ${slot === this.selectedTimeSlot ? 'selected' : ''}" data-slot="${slot}">
        ${slot}
      </div>
    `).join('');

    slotsContainer.querySelectorAll('.slot-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        slotsContainer.querySelectorAll('.slot-chip').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        this.selectedTimeSlot = chip.getAttribute('data-slot');
        this.updateBookingSummary();
      });
    });
  }

  preselectService(serviceId) {
    const serviceSelect = document.getElementById('bookingServiceSelect');
    if (serviceSelect) {
      serviceSelect.value = serviceId;
      this.updateBookingSummary();
    }
  }

  updateBookingSummary() {
    const serviceSelect = document.getElementById('bookingServiceSelect');
    const dateInput = document.getElementById('bookingDate');
    const summaryService = document.getElementById('summaryServiceName');
    const summaryDuration = document.getElementById('summaryDuration');
    const summaryDate = document.getElementById('summaryDate');
    const summaryTime = document.getElementById('summaryTime');
    const summaryPrice = document.getElementById('summaryPrice');
    const summaryTotal = document.getElementById('summaryTotalPrice');

    const serviceId = serviceSelect ? serviceSelect.value : null;
    const service = serviceId ? bookingService.getServiceById(serviceId) : null;

    if (summaryService) summaryService.textContent = service ? service.name : 'No service selected';
    if (summaryDuration) summaryDuration.textContent = service ? `${service.durationMinutes} minutes` : '--';
    if (summaryDate) summaryDate.textContent = (dateInput && dateInput.value) ? dateInput.value : 'Select date';
    if (summaryTime) summaryTime.textContent = this.selectedTimeSlot || 'Select time slot';
    if (summaryPrice) summaryPrice.textContent = service ? `$${Number(service.price).toFixed(2)}` : '$0.00';
    if (summaryTotal) summaryTotal.textContent = service ? `$${Number(service.price).toFixed(2)}` : '$0.00';
  }

  async handleBookingSubmit(e) {
    e.preventDefault();
    let isValid = true;

    const nameInput = document.getElementById('bookingCustomerName');
    const emailInput = document.getElementById('bookingCustomerEmail');
    const phoneInput = document.getElementById('bookingCustomerPhone');
    const serviceSelect = document.getElementById('bookingServiceSelect');
    const dateInput = document.getElementById('bookingDate');
    const notesInput = document.getElementById('bookingNotes');

    // Validation rules
    if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
      this.setInputError(nameInput, 'Please provide a valid customer full name.');
      isValid = false;
    } else {
      this.clearInputError(nameInput);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailInput.value.trim() || !emailRegex.test(emailInput.value.trim())) {
      this.setInputError(emailInput, 'Please provide a valid email address.');
      isValid = false;
    } else {
      this.clearInputError(emailInput);
    }

    if (!phoneInput.value.trim() || phoneInput.value.trim().length < 7) {
      this.setInputError(phoneInput, 'Please provide a valid contact phone number.');
      isValid = false;
    } else {
      this.clearInputError(phoneInput);
    }

    if (!serviceSelect.value) {
      this.setInputError(serviceSelect, 'Please choose a service from the list.');
      isValid = false;
    } else {
      this.clearInputError(serviceSelect);
    }

    if (!dateInput.value) {
      this.setInputError(dateInput, 'Please select a booking date.');
      isValid = false;
    } else {
      this.clearInputError(dateInput);
    }

    if (!this.selectedTimeSlot) {
      this.showToast('Please select an available time slot chip.', 'error');
      isValid = false;
    }

    if (!isValid) return;

    try {
      const newBooking = await bookingService.createBooking({
        customerName: nameInput.value,
        customerEmail: emailInput.value,
        customerPhone: phoneInput.value,
        serviceId: serviceSelect.value,
        bookingDate: dateInput.value,
        timeSlot: this.selectedTimeSlot,
        notes: notesInput.value
      });

      // Show confirmation dialog / modal
      this.showBookingSuccessModal(newBooking);

      // Reset form
      nameInput.value = '';
      emailInput.value = '';
      phoneInput.value = '';
      notesInput.value = '';
      this.updateBookingSummary();
      this.showToast(`Booking ${newBooking.id} created successfully!`, 'success');
    } catch (err) {
      this.showToast(err.message || 'Error creating booking', 'error');
    }
  }

  setInputError(inputElem, message) {
    inputElem.classList.add('is-invalid');
    const feedback = inputElem.parentElement.querySelector('.invalid-feedback');
    if (feedback) {
      feedback.textContent = message;
      feedback.style.display = 'block';
    }
  }

  clearInputError(inputElem) {
    inputElem.classList.remove('is-invalid');
    const feedback = inputElem.parentElement.querySelector('.invalid-feedback');
    if (feedback) {
      feedback.style.display = 'none';
    }
  }

  showBookingSuccessModal(booking) {
    const modal = document.getElementById('bookingSuccessModal');
    if (!modal) return;

    const refEl = document.getElementById('successBookingRef');
    const serviceEl = document.getElementById('successBookingService');
    const dateEl = document.getElementById('successBookingDate');
    const slotEl = document.getElementById('successBookingSlot');
    const customerEl = document.getElementById('successBookingCustomer');
    const totalEl = document.getElementById('successBookingPrice');

    if (refEl) refEl.textContent = booking.id;
    if (serviceEl) serviceEl.textContent = booking.serviceName;
    if (dateEl) dateEl.textContent = booking.bookingDate;
    if (slotEl) slotEl.textContent = booking.timeSlot;
    if (customerEl) customerEl.textContent = `${booking.customerName} (${booking.customerEmail})`;
    if (totalEl) totalEl.textContent = `$${Number(booking.price).toFixed(2)}`;

    modal.classList.add('show');
  }

  // --- MY BOOKINGS VIEW ---

  renderMyBookings() {
    const tbody = document.getElementById('myBookingsTableBody');
    const countEl = document.getElementById('myBookingsCountBadge');
    if (!tbody) return;

    let bookings = bookingService.getAllBookings();

    // Status filter
    if (this.bookingFilterStatus !== 'ALL') {
      bookings = bookings.filter(b => b.status === this.bookingFilterStatus);
    }

    // Search filter
    if (this.bookingSearchQuery) {
      const q = this.bookingSearchQuery.toLowerCase();
      bookings = bookings.filter(b => 
        b.id.toLowerCase().includes(q) ||
        b.serviceName.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.customerEmail.toLowerCase().includes(q)
      );
    }

    if (countEl) countEl.textContent = `${bookings.length} Bookings`;

    if (bookings.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-state">
              <div class="empty-icon">${ICONS.calendar}</div>
              <h3 class="empty-title">No bookings found</h3>
              <p class="empty-desc">No appointment records match your selected status or search criteria.</p>
              <button class="btn btn-primary btn-sm" id="btnBookFromEmpty">Create a New Booking</button>
            </div>
          </td>
        </tr>
      `;
      const btn = document.getElementById('btnBookFromEmpty');
      if (btn) btn.addEventListener('click', () => this.navigateTo('booking'));
      return;
    }

    tbody.innerHTML = bookings.map(b => `
      <tr id="booking-row-${b.id}">
        <td>
          <span style="font-family: monospace; font-weight: 700; color: var(--primary);">
            ${b.id}
          </span>
        </td>
        <td>
          <div style="font-weight: 600; color: var(--text-main);">${b.serviceName}</div>
          <div style="font-size: 0.82rem; color: var(--text-muted);">${b.customerName} &bull; ${b.customerEmail}</div>
        </td>
        <td>
          <div style="font-weight: 500;">${b.bookingDate}</div>
        </td>
        <td>
          <span style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.86rem; color: var(--text-muted);">
            ${ICONS.clock} ${b.timeSlot}
          </span>
        </td>
        <td>
          <span style="font-weight: 700;">$${Number(b.price).toFixed(2)}</span>
        </td>
        <td>
          ${this.getStatusBadgeHtml(b.status)}
        </td>
        <td>
          <div style="display: flex; gap: 8px; align-items: center;">
            <button class="btn btn-secondary btn-sm btn-reschedule" data-id="${b.id}" title="Reschedule / Edit Appointment">
              ${ICONS.edit} Reschedule
            </button>
            ${b.status !== 'CANCELLED' ? `
              <button class="btn btn-danger btn-sm btn-cancel-booking" data-id="${b.id}" title="Cancel Appointment">
                Cancel
              </button>
            ` : `
              <span style="font-size: 0.8rem; color: var(--text-light); italic;">Cancelled</span>
            `}
          </div>
        </td>
      </tr>
    `).join('');
  }

  getStatusBadgeHtml(status) {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'CONFIRMED':
        return `<span class="badge-status badge-confirmed"><span class="badge-dot"></span>Confirmed</span>`;
      case 'PENDING':
        return `<span class="badge-status badge-pending"><span class="badge-dot"></span>Pending</span>`;
      case 'COMPLETED':
        return `<span class="badge-status badge-completed"><span class="badge-dot"></span>Completed</span>`;
      case 'CANCELLED':
        return `<span class="badge-status badge-cancelled"><span class="badge-dot"></span>Cancelled</span>`;
      default:
        return `<span class="badge-status">${status}</span>`;
    }
  }

  // --- ADMIN VIEW ---

  renderAdmin() {
    const stats = bookingService.getStats();

    const elServices = document.getElementById('adminStatServices');
    const elBookings = document.getElementById('adminStatBookings');
    const elPending = document.getElementById('adminStatPending');
    const elConfirmed = document.getElementById('adminStatConfirmed');
    const elRevenue = document.getElementById('adminStatRevenue');

    if (elServices) elServices.textContent = stats.totalServices;
    if (elBookings) elBookings.textContent = stats.totalBookings;
    if (elPending) elPending.textContent = stats.pendingBookings;
    if (elConfirmed) elConfirmed.textContent = stats.confirmedBookings;
    if (elRevenue) elRevenue.textContent = `$${stats.totalRevenue.toFixed(2)}`;

    // Render active admin tab content
    if (this.adminActiveTab === 'bookings') {
      this.renderAdminBookingsTable();
    } else if (this.adminActiveTab === 'services') {
      this.renderAdminServicesTable();
    }
  }

  renderAdminBookingsTable() {
    const tbody = document.getElementById('adminBookingsTableBody');
    if (!tbody) return;

    let bookings = bookingService.getAllBookings();

    // Filter by search or status if selected
    const statusFilter = document.getElementById('adminBookingStatusFilter');
    const searchInput = document.getElementById('adminBookingSearchInput');

    if (statusFilter && statusFilter.value !== 'ALL') {
      bookings = bookings.filter(b => b.status === statusFilter.value);
    }

    if (searchInput && searchInput.value.trim()) {
      const q = searchInput.value.trim().toLowerCase();
      bookings = bookings.filter(b => 
        b.id.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.customerEmail.toLowerCase().includes(q) ||
        b.serviceName.toLowerCase().includes(q)
      );
    }

    if (bookings.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8">
            <div class="empty-state">
              <div class="empty-icon">${ICONS.search}</div>
              <h3 class="empty-title">No Bookings Found</h3>
              <p class="empty-desc">No bookings match the filter criteria.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = bookings.map(b => `
      <tr>
        <td><strong style="font-family: monospace; color: var(--primary);">${b.id}</strong></td>
        <td>
          <div style="font-weight: 600;">${b.customerName}</div>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${b.customerEmail}</div>
        </td>
        <td>${b.serviceName}</td>
        <td>${b.bookingDate}</td>
        <td><small>${b.timeSlot}</small></td>
        <td><strong>$${Number(b.price).toFixed(2)}</strong></td>
        <td>
          <select class="form-control form-control-sm admin-status-select" data-id="${b.id}" style="padding: 4px 8px; font-size: 0.84rem; width: 125px;">
            <option value="PENDING" ${b.status === 'PENDING' ? 'selected' : ''}>Pending</option>
            <option value="CONFIRMED" ${b.status === 'CONFIRMED' ? 'selected' : ''}>Confirmed</option>
            <option value="COMPLETED" ${b.status === 'COMPLETED' ? 'selected' : ''}>Completed</option>
            <option value="CANCELLED" ${b.status === 'CANCELLED' ? 'selected' : ''}>Cancelled</option>
          </select>
        </td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-secondary btn-sm btn-reschedule" data-id="${b.id}" title="Edit Booking">
              ${ICONS.edit}
            </button>
            <button class="btn btn-danger btn-sm btn-delete-booking" data-id="${b.id}" title="Permanently Delete">
              ${ICONS.trash}
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    // Attach status dropdown change listeners
    tbody.querySelectorAll('.admin-status-select').forEach(select => {
      select.addEventListener('change', async (e) => {
        const id = select.getAttribute('data-id');
        const newStatus = select.value;
        try {
          await bookingService.updateBookingStatus(id, newStatus);
          this.showToast(`Booking ${id} status updated to ${newStatus}`, 'success');
          this.renderAdmin();
        } catch (err) {
          this.showToast(err.message || 'Error updating status', 'error');
        }
      });
    });
  }

  renderAdminServicesTable() {
    const tbody = document.getElementById('adminServicesTableBody');
    if (!tbody) return;

    const services = bookingService.getAllServices();

    if (services.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="empty-state">
              <h3 class="empty-title">No Services Available</h3>
              <p class="empty-desc">Add your first booking service.</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = services.map(s => `
      <tr>
        <td><strong>#${s.id}</strong></td>
        <td>
          <div style="font-weight: 600;">${s.name}</div>
          <small style="color: var(--text-muted);">${s.description}</small>
        </td>
        <td><span class="service-category-badge">${s.category}</span></td>
        <td>${s.durationMinutes} mins</td>
        <td><strong>$${Number(s.price).toFixed(2)}</strong></td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-secondary btn-sm btn-edit-service" data-id="${s.id}">
              ${ICONS.edit} Edit
            </button>
            <button class="btn btn-danger btn-sm btn-delete-service" data-id="${s.id}">
              ${ICONS.trash}
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // --- MODALS & ACTIONS ---

  openRescheduleModal(bookingId) {
    const booking = bookingService.getBookingById(bookingId);
    if (!booking) return;

    this.rescheduleTargetBookingId = bookingId;
    const modal = document.getElementById('rescheduleModal');
    if (!modal) return;

    document.getElementById('rescheduleBookingId').textContent = booking.id;
    document.getElementById('rescheduleServiceName').textContent = booking.serviceName;
    
    const rescheduleDateInput = document.getElementById('rescheduleDate');
    if (rescheduleDateInput) {
      const today = new Date().toISOString().split('T')[0];
      rescheduleDateInput.min = today;
      rescheduleDateInput.value = booking.bookingDate;
    }
    
    // Fill slots dropdown
    const slotSelect = document.getElementById('rescheduleSlot');
    slotSelect.innerHTML = bookingService.getTimeSlots().map(slot => `
      <option value="${slot}" ${slot === booking.timeSlot ? 'selected' : ''}>${slot}</option>
    `).join('');

    document.getElementById('rescheduleNotes').value = booking.notes || '';
    modal.classList.add('show');
  }

  async saveReschedule() {
    if (!this.rescheduleTargetBookingId) return;

    const dateInput = document.getElementById('rescheduleDate');
    const slotSelect = document.getElementById('rescheduleSlot');
    const notesInput = document.getElementById('rescheduleNotes');

    if (!dateInput.value) {
      this.showToast('Please select a valid date.', 'error');
      return;
    }

    try {
      await bookingService.updateBooking(this.rescheduleTargetBookingId, {
        bookingDate: dateInput.value,
        timeSlot: slotSelect.value,
        notes: notesInput.value,
        status: 'CONFIRMED'
      });

      this.closeModal('rescheduleModal');
      this.showToast(`Appointment ${this.rescheduleTargetBookingId} updated and rescheduled!`, 'success');
      
      if (this.currentView === 'my-bookings') this.renderMyBookings();
      if (this.currentView === 'admin') this.renderAdmin();
    } catch (err) {
      this.showToast(err.message || 'Error rescheduling appointment', 'error');
    }
  }

  openServiceModal(serviceId = null) {
    this.editingServiceId = serviceId;
    const modal = document.getElementById('serviceModal');
    const title = document.getElementById('serviceModalTitle');
    
    if (serviceId) {
      const s = bookingService.getServiceById(serviceId);
      if (!s) return;
      title.textContent = 'Edit Service';
      document.getElementById('modalServiceName').value = s.name;
      document.getElementById('modalServiceCategory').value = s.category;
      document.getElementById('modalServiceDuration').value = s.durationMinutes;
      document.getElementById('modalServicePrice').value = s.price;
      document.getElementById('modalServiceDesc').value = s.description;
      document.getElementById('modalServiceBadge').value = s.badge || '';
    } else {
      title.textContent = 'Add New Service';
      document.getElementById('modalServiceName').value = '';
      document.getElementById('modalServiceCategory').value = 'General';
      document.getElementById('modalServiceDuration').value = '45';
      document.getElementById('modalServicePrice').value = '50';
      document.getElementById('modalServiceDesc').value = '';
      document.getElementById('modalServiceBadge').value = '';
    }

    modal.classList.add('show');
  }

  saveServiceModal() {
    const name = document.getElementById('modalServiceName').value.trim();
    const category = document.getElementById('modalServiceCategory').value.trim();
    const duration = document.getElementById('modalServiceDuration').value;
    const price = document.getElementById('modalServicePrice').value;
    const description = document.getElementById('modalServiceDesc').value.trim();
    const badge = document.getElementById('modalServiceBadge').value.trim();

    if (!name || !price || !duration) {
      this.showToast('Please fill in service name, duration and price.', 'error');
      return;
    }

    if (this.editingServiceId) {
      bookingService.updateService(this.editingServiceId, {
        name, category, durationMinutes: duration, price, description, badge
      });
      this.showToast('Service updated successfully!', 'success');
    } else {
      bookingService.addService({
        name, category, durationMinutes: duration, price, description, badge
      });
      this.showToast('New service added successfully!', 'success');
    }

    this.closeModal('serviceModal');
    this.renderAdmin();
    if (this.currentView === 'services') this.renderServices();
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('show');
  }

  showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span>${type === 'success' ? ICONS.checkCircle : ICONS.info}</span>
      <div>${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // --- EVENT BINDINGS ---

  bindEvents() {
    // Navigation link clicks
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = link.getAttribute('data-view');
        this.navigateTo(view);
      });
    });

    // Mobile menu toggle
    const mobileToggle = document.getElementById('mobileMenuToggle');
    if (mobileToggle) {
      mobileToggle.addEventListener('click', () => {
        const menu = document.getElementById('navMenu');
        if (menu) menu.classList.toggle('show-mobile');
      });
    }

    // Hero Book Now button
    const heroBookBtn = document.getElementById('heroBtnBookNow');
    if (heroBookBtn) {
      heroBookBtn.addEventListener('click', () => this.navigateTo('booking'));
    }

    const heroServicesBtn = document.getElementById('heroBtnServices');
    if (heroServicesBtn) {
      heroServicesBtn.addEventListener('click', () => this.navigateTo('services'));
    }

    // Global click delegate for "Book Now" on service cards
    document.addEventListener('click', (e) => {
      const bookBtn = e.target.closest('.btn-book-service');
      if (bookBtn) {
        const serviceId = bookBtn.getAttribute('data-id');
        this.navigateTo('booking', { serviceId });
      }

      const rescheduleBtn = e.target.closest('.btn-reschedule');
      if (rescheduleBtn) {
        const id = rescheduleBtn.getAttribute('data-id');
        this.openRescheduleModal(id);
      }

      const cancelBtn = e.target.closest('.btn-cancel-booking');
      if (cancelBtn) {
        const id = cancelBtn.getAttribute('data-id');
        if (confirm(`Are you sure you want to cancel booking ${id}?`)) {
          (async () => {
            try {
              await bookingService.cancelBooking(id);
              this.showToast(`Booking ${id} was cancelled.`, 'info');
              this.renderMyBookings();
              this.renderAdmin();
            } catch (err) {
              this.showToast(err.message || 'Error cancelling booking', 'error');
            }
          })();
        }
      }

      const editServiceBtn = e.target.closest('.btn-edit-service');
      if (editServiceBtn) {
        const id = editServiceBtn.getAttribute('data-id');
        this.openServiceModal(id);
      }

      const deleteServiceBtn = e.target.closest('.btn-delete-service');
      if (deleteServiceBtn) {
        const id = deleteServiceBtn.getAttribute('data-id');
        if (confirm(`Are you sure you want to delete this service? Existing bookings will remain.`)) {
          bookingService.deleteService(id);
          this.showToast('Service deleted.', 'info');
          this.renderAdmin();
          if (this.currentView === 'services') this.renderServices();
        }
      }

      const deleteBookingBtn = e.target.closest('.btn-delete-booking');
      if (deleteBookingBtn) {
        const id = deleteBookingBtn.getAttribute('data-id');
        if (confirm(`Permanently delete booking ${id}?`)) {
          bookingService.deleteBookingPermanent(id);
          this.showToast(`Booking ${id} deleted.`, 'info');
          this.renderAdmin();
        }
      }
    });

    // Services Page category buttons
    document.querySelectorAll('.service-category-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.service-category-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.serviceFilterCategory = btn.getAttribute('data-category');
        this.renderServices();
      });
    });

    // Services Page search input
    const serviceSearchInput = document.getElementById('serviceSearchInput');
    if (serviceSearchInput) {
      serviceSearchInput.addEventListener('input', (e) => {
        this.serviceSearchQuery = e.target.value;
        this.renderServices();
      });
    }

    // Booking form events
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
      bookingForm.addEventListener('submit', (e) => this.handleBookingSubmit(e));
    }

    const bookingServiceSelect = document.getElementById('bookingServiceSelect');
    if (bookingServiceSelect) {
      bookingServiceSelect.addEventListener('change', () => this.updateBookingSummary());
    }

    const bookingDateInput = document.getElementById('bookingDate');
    if (bookingDateInput) {
      bookingDateInput.addEventListener('change', () => this.updateBookingSummary());
    }

    // My Bookings filters & search
    document.querySelectorAll('.booking-status-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.booking-status-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.bookingFilterStatus = btn.getAttribute('data-status');
        this.renderMyBookings();
      });
    });

    const bookingSearchInput = document.getElementById('bookingSearchInput');
    if (bookingSearchInput) {
      bookingSearchInput.addEventListener('input', (e) => {
        this.bookingSearchQuery = e.target.value.trim();
        this.renderMyBookings();
      });
    }

    // Admin Tabs
    document.querySelectorAll('.admin-tab-btn').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));

        tabBtn.classList.add('active');
        this.adminActiveTab = tabBtn.getAttribute('data-tab');

        const tabContent = document.getElementById(`adminTabContent-${this.adminActiveTab}`);
        if (tabContent) tabContent.classList.add('active');

        this.renderAdmin();
      });
    });

    // Admin filters
    const adminStatusFilter = document.getElementById('adminBookingStatusFilter');
    if (adminStatusFilter) {
      adminStatusFilter.addEventListener('change', () => this.renderAdminBookingsTable());
    }

    const adminBookingSearch = document.getElementById('adminBookingSearchInput');
    if (adminBookingSearch) {
      adminBookingSearch.addEventListener('input', () => this.renderAdminBookingsTable());
    }

    // Add Service button in admin
    const btnAddService = document.getElementById('btnAddService');
    if (btnAddService) {
      btnAddService.addEventListener('click', () => this.openServiceModal(null));
    }

    // Modal submit buttons
    const btnSaveReschedule = document.getElementById('btnSaveReschedule');
    if (btnSaveReschedule) {
      btnSaveReschedule.addEventListener('click', () => this.saveReschedule());
    }

    const btnSaveService = document.getElementById('btnSaveService');
    if (btnSaveService) {
      btnSaveService.addEventListener('click', () => this.saveServiceModal());
    }

    // Modal Close Buttons
    document.querySelectorAll('.modal-close, .btn-modal-cancel').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = btn.closest('.modal-overlay');
        if (modal) modal.classList.remove('show');
      });
    });

    // Success Modal action buttons
    const btnViewMyBookings = document.getElementById('btnSuccessViewBookings');
    if (btnViewMyBookings) {
      btnViewMyBookings.addEventListener('click', () => {
        this.closeModal('bookingSuccessModal');
        this.navigateTo('my-bookings');
      });
    }

    const btnSuccessNewBooking = document.getElementById('btnSuccessNewBooking');
    if (btnSuccessNewBooking) {
      btnSuccessNewBooking.addEventListener('click', () => {
        this.closeModal('bookingSuccessModal');
      });
    }

    // Reset Sample Data button
    const btnResetData = document.getElementById('btnResetSampleData');
    if (btnResetData) {
      btnResetData.addEventListener('click', () => {
        if (confirm('Reset all bookings and services to initial sample data?')) {
          bookingService.resetToDefaults();
          this.showToast('Sample data reset successfully', 'info');
          this.renderCurrentView();
        }
      });
    }

    // --- AUTHENTICATION & LOGIN EVENT LISTENERS ---

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('loginEmail');
        const passwordInput = document.getElementById('loginPassword');
        const errorAlert = document.getElementById('loginErrorAlert');
        const errorMessage = document.getElementById('loginErrorMessage');
        const btnSubmit = document.getElementById('btnSubmitLogin');
        const btnText = document.getElementById('loginBtnText');

        const email = emailInput ? emailInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value.trim() : '';

        // Reset previous validation errors
        if (errorAlert) errorAlert.style.display = 'none';
        if (emailInput) emailInput.classList.remove('is-invalid');
        if (passwordInput) passwordInput.classList.remove('is-invalid');

        let isValid = true;
        if (!email) {
          if (emailInput) emailInput.classList.add('is-invalid');
          isValid = false;
        }
        if (!password) {
          if (passwordInput) passwordInput.classList.add('is-invalid');
          isValid = false;
        }

        if (!isValid) {
          if (errorAlert && errorMessage) {
            errorMessage.textContent = 'Please enter both email and password.';
            errorAlert.style.display = 'block';
          }
          return;
        }

        // Loading state
        if (btnSubmit) btnSubmit.disabled = true;
        if (btnText) btnText.textContent = 'Signing in...';

        try {
          const userData = await bookingService.login(email, password);
          this.updateAuthNav();
          this.showToast(`Signed in successfully as ${userData.fullName || userData.email}`, 'success');

          // Pre-fill booking form fields for convenience
          const custName = document.getElementById('bookingCustomerName');
          const custEmail = document.getElementById('bookingCustomerEmail');
          if (custName && !custName.value) custName.value = userData.fullName || '';
          if (custEmail && !custEmail.value) custEmail.value = userData.email || '';

          // Navigate back to home or my bookings
          this.navigateTo('home');
        } catch (err) {
          console.error('Login error:', err);
          if (errorAlert && errorMessage) {
            const is401 = err.status === 401 || (err.message && err.message.includes('401'));
            errorMessage.textContent = is401 
              ? 'Invalid email or password (401). Please verify your credentials.' 
              : (err.message || 'Authentication failed. Please check your credentials and try again.');
            errorAlert.style.display = 'block';
          }
          this.showToast(err.message || 'Login failed', 'error');
        } finally {
          if (btnSubmit) btnSubmit.disabled = false;
          if (btnText) btnText.textContent = 'Sign In';
        }
      });
    }

    const handleLogout = () => {
      bookingService.logout();
      this.updateAuthNav();
      this.showToast('You have been signed out.', 'info');
      if (this.currentView === 'login') {
        this.renderLogin();
      } else {
        this.renderCurrentView();
      }
    };

    const navBtnLogout = document.getElementById('navBtnLogout');
    if (navBtnLogout) {
      navBtnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleLogout();
      });
    }

    const btnActiveUserLogout = document.getElementById('btnActiveUserLogout');
    if (btnActiveUserLogout) {
      btnActiveUserLogout.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
      });
    }

    // Seeded accounts quick-fill buttons
    const btnPrefillCustomer = document.getElementById('btnPrefillCustomer');
    if (btnPrefillCustomer) {
      btnPrefillCustomer.addEventListener('click', () => {
        const emailInput = document.getElementById('loginEmail');
        const passwordInput = document.getElementById('loginPassword');
        if (emailInput) emailInput.value = 'alex.morgan@example.com';
        if (passwordInput) passwordInput.value = 'SecurePassword123!';
        const errorAlert = document.getElementById('loginErrorAlert');
        if (errorAlert) errorAlert.style.display = 'none';
      });
    }

    const btnPrefillAdmin = document.getElementById('btnPrefillAdmin');
    if (btnPrefillAdmin) {
      btnPrefillAdmin.addEventListener('click', () => {
        const emailInput = document.getElementById('loginEmail');
        const passwordInput = document.getElementById('loginPassword');
        if (emailInput) emailInput.value = 'admin@onlinebooking.com';
        if (passwordInput) passwordInput.value = 'AdminPassword123!';
        const errorAlert = document.getElementById('loginErrorAlert');
        if (errorAlert) errorAlert.style.display = 'none';
      });
    }
  }
}

// Bootstrap application once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new AppController();
});
