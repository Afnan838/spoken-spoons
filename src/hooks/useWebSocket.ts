import { useCallback, useEffect, useRef, useState } from "react";

export type WebSocketStatus = "idle" | "connecting" | "connected" | "error" | "disconnected";

interface UseWebSocketOptions {
  url: string;
  onMessage?: (data: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  autoReconnect?: boolean;
  reconnectDelay?: number;
  maxRetries?: number;
}

export function useWebSocket({
  url,
  onMessage,
  onOpen,
  onClose,
  onError,
  autoReconnect = true,
  reconnectDelay = 3000,
  maxRetries = 5,
}: UseWebSocketOptions) {
  const [status, setStatus] = useState<WebSocketStatus>("idle");
  const wsRef = useRef<WebSocket | null>(null);
  const retriesRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus("connecting");

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus("connected");
        retriesRef.current = 0;
        onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch {
          onMessage?.(event.data);
        }
      };

      ws.onclose = () => {
        setStatus("disconnected");
        onClose?.();

        if (autoReconnect && retriesRef.current < maxRetries) {
          retriesRef.current++;
          reconnectTimerRef.current = setTimeout(connect, reconnectDelay);
        }
      };

      ws.onerror = (error) => {
        setStatus("error");
        onError?.(error);
      };
    } catch {
      setStatus("error");
    }
  }, [url, onMessage, onOpen, onClose, onError, autoReconnect, reconnectDelay, maxRetries]);

  const disconnect = useCallback(() => {
    clearTimeout(reconnectTimerRef.current);
    retriesRef.current = maxRetries; // prevent auto-reconnect
    wsRef.current?.close();
    wsRef.current = null;
    setStatus("idle");
  }, [maxRetries]);

  const send = useCallback((data: string | ArrayBuffer | Blob) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, []);

  return { status, connect, disconnect, send };
}
