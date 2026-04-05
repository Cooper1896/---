/**
 * Home page – Update (reducer / message handling)
 */
import type { HomeModel } from './model';

export type HomeMsg = { type: 'NOOP' };

export function homeUpdate(model: HomeModel, _msg: HomeMsg): HomeModel {
  return model;
}
