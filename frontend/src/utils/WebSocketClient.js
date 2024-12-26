class WebSocketClient {
  constructor() {
    this.socket = null;
    this.onMessageCallback = null;
    this.onClientIdReceivedCallback = null;  // Add this line
  }

  connect() {
    this.socket = new WebSocket("ws://localhost:9090");

    this.socket.onopen = () => {
      console.log("WebSocket connection established");
    };

    this.socket.onmessage = (message) => {
      const data = JSON.parse(message.data);

      // Trigger the callback if it's set
      if (this.onMessageCallback) {
        this.onMessageCallback(data);
      }

      // Check if the message is related to client ID
      if (data.method === "connect" && this.onClientIdReceivedCallback) {
        this.onClientIdReceivedCallback(data.clientId);  // Invoke callback with clientId
      }
    };

    this.socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    this.socket.onclose = () => {
      console.log("WebSocket connection closed");
    };
  }

  onMessage(callback) {
    this.onMessageCallback = callback; // Set the callback function
  }

  onClientIdReceived(callback) {
    this.onClientIdReceivedCallback = callback;  // Set the clientId received callback
  }

  sendMessage(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    } else {
      console.error("WebSocket is not open. Cannot send message.");
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export default new WebSocketClient();
