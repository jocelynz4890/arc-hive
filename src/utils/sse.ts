type Subscriber = (line: string) => void;

const subscribers: Set<Subscriber> = new Set();

export function emit(event: string, data?: unknown) {
  const payload = data === undefined ? {} : data;
  const line = `event: ${event}\n` + `data: ${JSON.stringify(payload)}\n\n`;
  for (const sub of Array.from(subscribers)) {
    try {
      sub(line);
    } catch (_e) {
      // ignore delivery errors to disconnected clients
    }
  }
}

export function subscribe(): ReadableStream {
  let closed = false;
  let interval: number | undefined;
  let send: Subscriber | undefined;
  const encoder = new TextEncoder();

  return new ReadableStream({
    start(controller) {
      send = (line: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(line));
        } catch (_e) {
          // If enqueuing fails, mark closed to stop future sends
          closed = true;
        }
      };
      subscribers.add(send);
      // initial comment and retry hint
      send(`: connected ${Date.now()}\n\n`);
      send(`retry: 5000\n\n`);
      // heartbeat every 25s to keep connections alive through proxies
      // deno-lint-ignore no-explicit-any
      interval = setInterval(() => send && send(`: heartbeat ${Date.now()}\n\n`), 25000) as any;
    },
    cancel() {
      closed = true;
      if (interval !== undefined) clearInterval(interval);
      if (send) subscribers.delete(send);
    },
  });
}


