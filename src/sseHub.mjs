// 연결된 SSE 클라이언트 목록을 관리한다. 연결이 끊기면 목록에서 뺀다.
export function createSseHub() {
  const clients = new Set();
  return {
    connect(req, res) {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      res.flushHeaders();
      clients.add(res);
      req.on('close', () => clients.delete(res));
    },
    // EventSource는 data 줄이 없는 이벤트를 발생시키지 않으므로 빈 data를 함께 보낸다.
    broadcast(event) {
      for (const res of clients) res.write(`event: ${event}\ndata: {}\n\n`);
    },
  };
}
