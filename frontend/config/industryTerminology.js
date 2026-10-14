/**
 * Shewwina — Industry-Agnostic Terminology Configuration
 * 
 * Provides unified, dynamic mapping for queue terminology across various business verticals.
 * Allows the exact same dashboard to adapt labels, metrics, and queue terminology seamlessly.
 */

export const INDUSTRY_CONFIGS = {
  salon: {
    categoryName: 'Salon & Spa',
    customerTerm: 'Customer',
    customerPlural: 'Customers',
    serviceTerm: 'Service',
    servicePlural: 'Services',
    servingTerm: 'Serving',
    providerTerm: 'Stylist / Specialist',
    queueTerm: 'Queue',
    actionCallNext: 'Call Next Customer',
    actionComplete: 'Complete Service',
    icon: '✂️',
  },
  clinic: {
    categoryName: 'Clinic & Healthcare',
    customerTerm: 'Patient',
    customerPlural: 'Patients',
    serviceTerm: 'Consultation',
    servicePlural: 'Consultations',
    servingTerm: 'In Consultation',
    providerTerm: 'Doctor / Physician',
    queueTerm: 'Patient Queue',
    actionCallNext: 'Call Next Patient',
    actionComplete: 'Complete Consultation',
    icon: '🩺',
  },
  hospital: {
    categoryName: 'Hospital OPD',
    customerTerm: 'Patient',
    customerPlural: 'Patients',
    serviceTerm: 'Department',
    servicePlural: 'Departments',
    servingTerm: 'With Doctor',
    providerTerm: 'Physician / Triage',
    queueTerm: 'OPD Queue',
    actionCallNext: 'Call Next Patient',
    actionComplete: 'Discharge / Complete',
    icon: '🏥',
  },
  bank: {
    categoryName: 'Banking & Financial',
    customerTerm: 'Customer',
    customerPlural: 'Customers',
    serviceTerm: 'Counter Service',
    servicePlural: 'Counter Services',
    servingTerm: 'At Counter',
    providerTerm: 'Cashier / Officer',
    queueTerm: 'Branch Line',
    actionCallNext: 'Call Next Ticket',
    actionComplete: 'Complete Transaction',
    icon: '🏦',
  },
  restaurant: {
    categoryName: 'Restaurant & Dining',
    customerTerm: 'Guest',
    customerPlural: 'Guests',
    serviceTerm: 'Table / Order',
    servicePlural: 'Tables & Orders',
    servingTerm: 'Seated',
    providerTerm: 'Host / Waitstaff',
    queueTerm: 'Waitlist',
    actionCallNext: 'Seat Next Guest',
    actionComplete: 'Table Cleared',
    icon: '🍽️',
  },
  government: {
    categoryName: 'Government & Public Office',
    customerTerm: 'Citizen',
    customerPlural: 'Citizens',
    serviceTerm: 'Public Service',
    servicePlural: 'Services',
    servingTerm: 'At Desk',
    providerTerm: 'Desk Officer',
    queueTerm: 'Public Queue',
    actionCallNext: 'Call Next Citizen',
    actionComplete: 'Service Dispatched',
    icon: '🏛️',
  },
  gov: {
    categoryName: 'Government & Public Office',
    customerTerm: 'Citizen',
    customerPlural: 'Citizens',
    serviceTerm: 'Public Service',
    servicePlural: 'Services',
    servingTerm: 'At Desk',
    providerTerm: 'Desk Officer',
    queueTerm: 'Public Queue',
    actionCallNext: 'Call Next Citizen',
    actionComplete: 'Service Dispatched',
    icon: '🏛️',
  },
  service: {
    categoryName: 'Service & Repair Center',
    customerTerm: 'Customer',
    customerPlural: 'Customers',
    serviceTerm: 'Repair / Job',
    servicePlural: 'Repairs & Jobs',
    servingTerm: 'Under Inspection',
    providerTerm: 'Technician',
    queueTerm: 'Job Queue',
    actionCallNext: 'Call Next Job',
    actionComplete: 'Complete Repair',
    icon: '🔧',
  },
  education: {
    categoryName: 'Education & Admissions',
    customerTerm: 'Student',
    customerPlural: 'Students',
    serviceTerm: 'Inquiry Desk',
    servicePlural: 'Counseling & Inquiries',
    servingTerm: 'In Session',
    providerTerm: 'Advisor / Counselor',
    queueTerm: 'Inquiry Queue',
    actionCallNext: 'Call Next Student',
    actionComplete: 'Session Concluded',
    icon: '🎓',
  },
  barber: {
    categoryName: 'Barbershop',
    customerTerm: 'Client',
    customerPlural: 'Clients',
    serviceTerm: 'Grooming Service',
    servicePlural: 'Services',
    servingTerm: 'In Chair',
    providerTerm: 'Barber',
    queueTerm: 'Waiting Line',
    actionCallNext: 'Call Next Client',
    actionComplete: 'Complete Grooming',
    icon: '💈',
  },
  default: {
    categoryName: 'General Business',
    customerTerm: 'Customer',
    customerPlural: 'Customers',
    serviceTerm: 'Service',
    servicePlural: 'Services',
    servingTerm: 'Serving',
    providerTerm: 'Staff / Agent',
    queueTerm: 'Queue',
    actionCallNext: 'Call Next Customer',
    actionComplete: 'Complete Service',
    icon: '⚡',
  },
};

/**
 * Normalizes input category and returns the corresponding terminology dictionary.
 * @param {string} category 
 * @returns {typeof INDUSTRY_CONFIGS['default']}
 */
export function getIndustryConfig(category) {
  if (!category || typeof category !== 'string') {
    return INDUSTRY_CONFIGS.default;
  }
  const key = category.toLowerCase().trim();
  return INDUSTRY_CONFIGS[key] || INDUSTRY_CONFIGS.default;
}

export default getIndustryConfig;
