import { getTokens } from '../api';

type WsMessage = {
  type: string;
  data?: any;
};

type MessageHandler = (msg: WsMessage) => void;
type StatusHandler = (status: 'connected' | 'disconnected' | 'error') => void;

const WS_BASE = 'wss://yoha.ma/ws';
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;

export class WsClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private destroyed = false;
  private handlers = new Map<string, Set<MessageHandler>>();
  private onStatus: StatusHandler[] = [];

  constructor(
    private path: string,
    private query: Record<string, string> = {},
  ) {}

  async connect() {
    if (this.destroyed) return;
    const tokens = await getTokens();
    const params = new URLSearchParams(this.query);
    if (tokens?.access) params.set('token', tokens.access);
    const qs = params.toString();
    const url = `${WS_BASE}/${this.path.replace(/^\//, '')}${qs ? `?${qs}` : ''}`;

    try {
      this.ws = new WebSocket(url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.emitStatus('connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data);
        const typeHandlers = this.handlers.get(msg.type);
        if (typeHandlers) typeHandlers.forEach((fn) => fn(msg));
        const allHandlers = this.handlers.get('*');
        if (allHandlers) allHandlers.forEach((fn) => fn(msg));
      } catch {}
    };

    this.ws.onclose = () => {
      this.emitStatus('disconnected');
      if (!this.destroyed) this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      this.emitStatus('error');
    };
  }

  disconnect() {
    this.destroyed = true;
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }

  send(msg: WsMessage) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  on(type: string, handler: MessageHandler) {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type)!.add(handler);
    return () => this.handlers.get(type)?.delete(handler);
  }

  onStatusChange(handler: StatusHandler) {
    this.onStatus.push(handler);
    return () => {
      this.onStatus = this.onStatus.filter((h) => h !== handler);
    };
  }

  private scheduleReconnect() {
    if (this.destroyed || this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return;
    this.reconnectAttempts++;
    setTimeout(() => this.connect(), RECONNECT_DELAY);
  }

  private emitStatus(status: 'connected' | 'disconnected' | 'error') {
    this.onStatus.forEach((fn) => fn(status));
  }
}

const clients = new Map<string, WsClient>();

export function subscribeOrder(publicId: string, handlers: {
  onState?: (data: any) => void;
  onLocation?: (data: any) => void;
}) {
  const existing = clients.get(`order:${publicId}`);
  if (existing) existing.disconnect();

  const client = new WsClient(`orders/${publicId}/`);
  client.connect();
  client.on('order.state', (msg) => handlers.onState?.(msg.data));
  client.on('order.location', (msg) => handlers.onLocation?.(msg.data));
  client.send({ type: 'order.request_state' });
  clients.set(`order:${publicId}`, client);
  return client;
}

export function subscribeCourierLocation(handlers: {
  onLocation?: (data: any) => void;
}) {
  const client = new WsClient('courier/location/');
  client.connect();
  client.on('order.location', (msg) => handlers.onLocation?.(msg.data));
  return client;
}

export function unsubscribe(publicId: string) {
  const key = `order:${publicId}`;
  const client = clients.get(key);
  if (client) {
    client.disconnect();
    clients.delete(key);
  }
}
