import NetInfo from '@react-native-community/netinfo';

class NetworkService {
  constructor() {
    this.isConnected = false;
    this.connectionType = 'unknown';
    this.listeners = [];
  }

  async init() {
    const state = await NetInfo.fetch();
    this.updateState(state);

    NetInfo.addEventListener(state => {
      this.updateState(state);
      this.notifyListeners(state);
    });
  }

  updateState(state) {
    this.isConnected = state.isConnected;
    this.connectionType = state.type;
    this.isInternetReachable = state.isInternetReachable;
  }

  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners(state) {
    this.listeners.forEach(callback => callback(state));
  }

  async isOnline() {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable;
  }

  async getConnectionQuality() {
    const state = await NetInfo.fetch();

    if (!state.isConnected) {
      return 'offline';
    }

    if (state.type === 'wifi') {
      return 'excellent';
    }

    if (state.type === 'cellular') {
      const details = state.details;
      if (details.cellularGeneration === '4g' || details.cellularGeneration === '5g') {
        return 'good';
      }
      return 'poor';
    }

    return 'unknown';
  }

  async waitForConnection(timeout = 30000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, timeout);

      const unsubscribe = NetInfo.addEventListener(state => {
        if (state.isConnected) {
          clearTimeout(timeoutId);
          unsubscribe();
          resolve();
        }
      });
    });
  }
}

export default new NetworkService();
