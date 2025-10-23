/**
 * Simple in-process event emitter with typed events
 */

export type EventHandler<T = unknown> = (payload: T) => void | Promise<void>;

export interface EventEmitter {
  subscribe<T>(event: string, handler: EventHandler<T>): void;
  emit<T>(event: string, payload: T): Promise<void>;
}

export class InProcessEventEmitter implements EventEmitter {
  private handlers: Map<string, EventHandler[]> = new Map();

  subscribe<T>(event: string, handler: EventHandler<T>): void {
    const existing = this.handlers.get(event) || [];
    this.handlers.set(event, [...existing, handler as EventHandler]);
  }

  async emit<T>(event: string, payload: T): Promise<void> {
    const handlers = this.handlers.get(event) || [];
    await Promise.all(handlers.map((handler) => handler(payload)));
  }
}
