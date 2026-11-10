type EventListener = (...args: any[]) => void;

class SimpleEventEmitter {
  private events: { [key: string]: EventListener[] } = {};

  on(event: string, listener: EventListener): () => void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return () => this.off(event, listener);
  }

  off(event: string, listener: EventListener) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  emit(event: string, ...args: any[]) {
    if (!this.events[event]) return;
    this.events[event].slice().forEach(listener => {
      try {
        listener(...args);
      } catch (err) {
        console.error(`Error in event listener for ${event}:`, err);
      }
    });
  }
}

export const eventBus = new SimpleEventEmitter();

