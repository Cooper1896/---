/**
 * MVU (Model-View-Update) hook
 *
 * A thin wrapper around React's useReducer that enforces the MVU discipline:
 *   Model  – the state type
 *   Msg    – a discriminated-union action type
 *   update – pure (model, msg) => model reducer
 *
 * Pages import `useMvu` instead of mixing useState / useReducer ad-hoc.
 */
import { useReducer, useCallback, Dispatch } from 'react';

export type Update<Model, Msg> = (model: Model, msg: Msg) => Model;

export interface MvuResult<Model, Msg> {
  model: Model;
  dispatch: Dispatch<Msg>;
}

export function useMvu<Model, Msg>(
  update: Update<Model, Msg>,
  init: Model,
): MvuResult<Model, Msg> {
  const [model, dispatch] = useReducer(update, init);
  return { model, dispatch };
}

/**
 * Helper to create a typed dispatch action.
 * Usage: const send = createSend(dispatch); send({ type: 'SET_LOADING', payload: true });
 */
export function createSend<Msg>(dispatch: Dispatch<Msg>) {
  return (msg: Msg) => dispatch(msg);
}
