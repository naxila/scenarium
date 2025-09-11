import { Action } from '../types/Actions';

export function normalizeActions(actions: Action | Action[]): Action[] {
  if (Array.isArray(actions)) {
    return actions;
  }
  return [actions];
}

export function isActionArray(actions: any): actions is Action[] {
  return Array.isArray(actions) && actions.length > 0 && typeof actions[0] === 'object';
}
