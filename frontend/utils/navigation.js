/**
 * Shewwina — Role-Based Routing & Navigation Helper
 *
 * Resolves verified dashboard destination for all 4 Shewwina modules:
 * 1. Hospital OPD Operators → /hospital/dashboard
 * 2. Government Kendra Operators → /government/dashboard
 * 3. Salon & Clinic Business Operators → /dashboard
 * 4. Customers / Citizens → /customer/dashboard
 */

export function resolveDashboardRoute(user, preferredModule = null) {
  if (!user) return '/login';

  // 1. Customer role
  if (user.role === 'CUSTOMER') {
    return '/customer/dashboard';
  }

  // Explicit preferred module resolution for multi-module operators
  if (preferredModule === 'hospital' && (user.hospitalId || user.hospital)) {
    return '/hospital/dashboard';
  }
  if (preferredModule === 'government' && (user.centreId || user.centre)) {
    return '/government/dashboard';
  }
  if (preferredModule === 'business' && (user.businessId || user.business)) {
    return '/dashboard';
  }

  // 2. Multi-module operator fallback (explicitly consistent without silent hiding)
  if (user.isMultiModule || (user.hospitalId && user.centreId)) {
    // If user has both Hospital and Government Centre, return the primary module
    return user.hospitalId ? '/hospital/dashboard' : '/government/dashboard';
  }

  // 3. Hospital operator
  if (user.hospitalId || user.hospital || user.module === 'hospital') {
    return '/hospital/dashboard';
  }

  // 4. Government Kendra operator
  if (user.centreId || user.centre || user.module === 'government') {
    return '/government/dashboard';
  }

  // 5. Salon / Clinic business operator
  if (user.role === 'BUSINESS') {
    return '/dashboard';
  }

  return '/login';
}

export function getUserDisplayRole(user) {
  if (!user) return '';
  if (user.role === 'CUSTOMER') return 'Customer';
  if (user.isMultiModule || (user.hospitalId && user.centreId)) return 'Hospital & Kendra Admin';
  if (user.hospitalId || user.hospital || user.module === 'hospital') return 'Hospital OPD';
  if (user.centreId || user.centre || user.module === 'government') return 'Govt Kendra';
  if (user.business?.category === 'clinic') return 'Clinic';
  if (user.role === 'BUSINESS') return 'Business';
  return user.role;
}

export default {
  resolveDashboardRoute,
  getUserDisplayRole,
};
