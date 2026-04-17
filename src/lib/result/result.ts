export type Ok<T> = { ok: true; data: T };
export type Err<E extends object = { message: string }> = { ok: false } & E;

export type Result<T, E extends object = { message: string }> = Ok<T> | Err<E>;

export class ActionError<E extends object = { message: string }> extends Error {
  public readonly payload: E;

  constructor(message: string, payload: E) {
    super(message);
    this.name = 'ActionError';
    this.payload = payload;
  }
}

export function unwrap<T, E extends { message: string }>(res: Result<T, E>): T {
  if (res.ok) return res.data;
  throw new ActionError(res.message, res);
}
