import React from 'react';
import { UserRole } from '../types';
import { ShieldAlert, Users, UserCheck } from 'lucide-react';

interface RoleBadgeProps {
  role: UserRole;
  showIcon?: boolean;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, showIcon = true }) => {
  switch (role) {
    case 'super_admin':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-sm">
          {showIcon && <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />}
          Super Admin
        </span>
      );
    case 'partner':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm">
          {showIcon && <Users className="w-3.5 h-3.5 text-cyan-400" />}
          Partner
        </span>
      );
    case 'staff':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
          {showIcon && <UserCheck className="w-3.5 h-3.5 text-emerald-400" />}
          Staff
        </span>
      );
    default:
      return null;
  }
};
