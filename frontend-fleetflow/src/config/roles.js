/**
 * Role-Based Access Control configuration for FleetFlow frontend.
 * Controls sidebar visibility, action buttons, and page access per role.
 */

export const ROLES = {
  FLEET_MANAGER: 'fleet_manager',
  DISPATCHER: 'dispatcher',
  SAFETY_OFFICER: 'safety_officer',
  FINANCIAL_ANALYST: 'financial_analyst',
};

export const ROLE_LABELS = {
  [ROLES.FLEET_MANAGER]: 'Fleet Manager',
  [ROLES.DISPATCHER]: 'Dispatcher',
  [ROLES.SAFETY_OFFICER]: 'Safety Officer',
  [ROLES.FINANCIAL_ANALYST]: 'Financial Analyst',
};

import { Truck, ClipboardList, Shield, IndianRupee } from 'lucide-react';

export const ROLE_ICONS = {
  [ROLES.FLEET_MANAGER]: Truck,
  [ROLES.DISPATCHER]: ClipboardList,
  [ROLES.SAFETY_OFFICER]: Shield,
  [ROLES.FINANCIAL_ANALYST]: IndianRupee,
};

export const ROLE_COLORS = {
  [ROLES.FLEET_MANAGER]: '#3b82f6',
  [ROLES.DISPATCHER]: '#f59e0b',
  [ROLES.SAFETY_OFFICER]: '#22c55e',
  [ROLES.FINANCIAL_ANALYST]: '#a855f7',
};

/**
 * Access matrix — defines what each role can DO per module
 * 'full'  = CRUD + actions
 * 'view'  = read only
 * false   = no access (won't show in sidebar)
 */
export const ACCESS_MATRIX = {
  dashboard: { [ROLES.FLEET_MANAGER]: 'full', [ROLES.DISPATCHER]: 'view', [ROLES.SAFETY_OFFICER]: 'view', [ROLES.FINANCIAL_ANALYST]: 'view' },
  vehicles: { [ROLES.FLEET_MANAGER]: 'full', [ROLES.DISPATCHER]: 'view', [ROLES.SAFETY_OFFICER]: 'view', [ROLES.FINANCIAL_ANALYST]: 'view' },
  drivers: { [ROLES.FLEET_MANAGER]: 'full', [ROLES.DISPATCHER]: 'view', [ROLES.SAFETY_OFFICER]: 'full', [ROLES.FINANCIAL_ANALYST]: 'view' },
  trips: { [ROLES.FLEET_MANAGER]: 'full', [ROLES.DISPATCHER]: 'full', [ROLES.SAFETY_OFFICER]: 'view', [ROLES.FINANCIAL_ANALYST]: 'view' },
  maintenance: { [ROLES.FLEET_MANAGER]: 'full', [ROLES.DISPATCHER]: 'view', [ROLES.SAFETY_OFFICER]: 'view', [ROLES.FINANCIAL_ANALYST]: 'view' },
  fuel: { [ROLES.FLEET_MANAGER]: 'full', [ROLES.DISPATCHER]: 'view', [ROLES.SAFETY_OFFICER]: 'view', [ROLES.FINANCIAL_ANALYST]: 'full' },
  reports: { [ROLES.FLEET_MANAGER]: 'full', [ROLES.DISPATCHER]: 'view', [ROLES.SAFETY_OFFICER]: 'view', [ROLES.FINANCIAL_ANALYST]: 'full' },
};

/**
 * Helper: check if a role can write (create/edit/delete) on a module
 */
export function canWrite(role, module) {
  return ACCESS_MATRIX[module]?.[role] === 'full';
}

/**
 * Helper: check if a role has any access to a module
 */
export function hasAccess(role, module) {
  return !!ACCESS_MATRIX[module]?.[role];
}
