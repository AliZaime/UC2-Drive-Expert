
import React from 'react';
import { UserRole } from '../types';

interface ProtectProps {
  children: React.ReactNode;
  roles: UserRole[];
  fallback?: React.ReactNode;
}

export const Protect: React.FC<ProtectProps> = ({ children, roles, fallback = null }) => {
  const userStr = localStorage.getItem('auto_uc2_user');
  if (!userStr || userStr === 'undefined') return <>{fallback}</>;

  try {
    const user = JSON.parse(userStr);
    if (roles.includes(user.role)) {
      return <>{children}</>;
    }
  } catch (e) {
    console.error("RBAC Error", e);
  }

  return <>{fallback}</>;
};
