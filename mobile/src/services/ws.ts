export class TripWebSocket {
  ws: WebSocket | null = null;
  tripId: string;
  onMessage: (data: any) => void;

  constructor(tripId: string, onMessage: (data: any) => void) {
    this.tripId = tripId;
    this.onMessage = onMessage;
  }

  connect() {
    this.ws = new WebSocket(`ws://localhost:8000/trips/${this.tripId}/stream`);
    
    this.ws.onmessage = (e) => {
      this.onMessage(JSON.parse(e.data));
    };

    this.ws.onclose = () => {
      console.log("WS closed, reconnecting in 2s...");
      setTimeout(() => this.connect(), 2000); 
    };
  }

  sendPing(ping: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(ping));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
    }
  }
}

