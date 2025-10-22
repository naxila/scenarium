import { Action } from '../types/Actions';

export function normalizeActions(actions: Action | Action[]): Action[] {
  if (!actions) {
    return [];
  }
  if (Array.isArray(actions)) {
    // Filter out null/undefined values from array
    return actions.filter(action => action != null);
  }
  return [actions];
}

export function isActionArray(actions: any): actions is Action[] {
  return Array.isArray(actions) && actions.length > 0 && typeof actions[0] === 'object';
}
