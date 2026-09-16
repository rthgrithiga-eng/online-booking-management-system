/**
 * Mock Data for Online Booking Management System
 * Prepared to align directly with future Spring Boot JPA Entities:
 * - ServiceEntity (id, name, category, description, durationMinutes, price, active)
 * - BookingEntity (id, serviceId, customerName, customerEmail, customerPhone, bookingDate, timeSlot, status, price, notes, createdAt)
 */

export const INITIAL_SERVICES = [
  {
    id: 1,
    name: "General Health Consultation",
    category: "Healthcare",
    description: "One-on-one virtual or in-person consultation with certified physicians for routine checkups and medical guidance.",
    durationMinutes: 45,
    price: 60.00,
    badge: "Popular",
    icon: "stethoscope"
  },
  {
    id: 2,
    name: "Full Dental Examination & Cleaning",
    category: "Dental Care",
    description: "Comprehensive oral exam, plaque removal, teeth polishing, and professional dental hygiene assessment.",
    durationMinutes: 60,
    price: 85.00,
    badge: "Recommended",
    icon: "sparkles"
  },
  {
    id: 3,
    name: "Physical Therapy & Rehabilitation",
    category: "Physiotherapy",
    description: "Targeted musculoskeletal therapy session to improve joint mobility, relieve chronic pain, and recover from sports injury.",
    durationMinutes: 50,
    price: 75.00,
    badge: "Specialized",
    icon: "activity"
  },
  {
    id: 4,
    name: "Software Technical Architecture Review",
    category: "Tech Consulting",
    description: "Expert code review, system design evaluation, database optimization advice, and cloud deployment roadmap.",
    durationMinutes: 60,
    price: 120.00,
    badge: "Enterprise",
    icon: "code"
  },
  {
    id: 5,
    name: "Personal Fitness & Nutrition Coaching",
    category: "Wellness",
    description: "Customized workout plan design, body composition analysis, and dietary macro breakdown with certified coach.",
    durationMinutes: 45,
    price: 50.00,
    badge: "Flexible",
    icon: "dumbbell"
  },
  {
    id: 6,
    name: "Legal Advisory & Contract Consultation",
    category: "Legal Services",
    description: "Initial case review, contract scrutiny, intellectual property advice, and compliance strategy session.",
    durationMinutes: 60,
    price: 110.00,
    badge: "Confidential",
    icon: "shield-check"
  }
];

export const AVAILABLE_TIME_SLOTS = [
  "09:00 AM - 09:45 AM",
  "10:00 AM - 10:45 AM",
  "11:15 AM - 12:00 PM",
  "01:30 PM - 02:15 PM",
  "02:30 PM - 03:15 PM",
  "03:45 PM - 04:30 PM",
  "04:45 PM - 05:30 PM"
];

// Helper to get formatted dates relative to today
const getRelativeDate = (offsetDays) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const INITIAL_BOOKINGS = [
  {
    id: "BKG-1001",
    serviceId: 1,
    serviceName: "General Health Consultation",
    customerName: "Alex Morgan",
    customerEmail: "alex.morgan@example.com",
    customerPhone: "+1 (555) 234-5678",
    bookingDate: getRelativeDate(1),
    timeSlot: "10:00 AM - 10:45 AM",
    price: 60.00,
    status: "CONFIRMED", // PENDING, CONFIRMED, COMPLETED, CANCELLED
    notes: "Follow-up discussion for annual bloodwork report.",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: "BKG-1002",
    serviceId: 2,
    serviceName: "Full Dental Examination & Cleaning",
    customerName: "Sarah Jenkins",
    customerEmail: "sarah.j@example.com",
    customerPhone: "+1 (555) 876-5432",
    bookingDate: getRelativeDate(2),
    timeSlot: "11:15 AM - 12:00 PM",
    price: 85.00,
    status: "PENDING",
    notes: "Requested morning appointment if possible.",
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    id: "BKG-1003",
    serviceId: 4,
    serviceName: "Software Technical Architecture Review",
    customerName: "David Chen",
    customerEmail: "david.chen@enterprise.io",
    customerPhone: "+1 (555) 345-6789",
    bookingDate: getRelativeDate(3),
    timeSlot: "02:30 PM - 03:15 PM",
    price: 120.00,
    status: "CONFIRMED",
    notes: "Reviewing Spring Boot microservices and MySQL schema design.",
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: "BKG-1004",
    serviceId: 5,
    serviceName: "Personal Fitness & Nutrition Coaching",
    customerName: "Emily Watson",
    customerEmail: "emily.w@example.com",
    customerPhone: "+1 (555) 901-2345",
    bookingDate: getRelativeDate(-1),
    timeSlot: "09:00 AM - 09:45 AM",
    price: 50.00,
    status: "COMPLETED",
    notes: "Initial fitness assessment completed successfully.",
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString()
  },
  {
    id: "BKG-1005",
    serviceId: 3,
    serviceName: "Physical Therapy & Rehabilitation",
    customerName: "Michael Rodriguez",
    customerEmail: "m.rodriguez@example.com",
    customerPhone: "+1 (555) 678-1234",
    bookingDate: getRelativeDate(4),
    timeSlot: "03:45 PM - 04:30 PM",
    price: 75.00,
    status: "CANCELLED",
    notes: "Client rescheduled due to travel conflict.",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  }
];
