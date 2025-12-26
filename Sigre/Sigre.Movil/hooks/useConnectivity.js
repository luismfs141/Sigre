import NetInfo from "@react-native-community/netinfo";

export const useConnectivity = () => {
  const isOnline = async () => {
    const state = await NetInfo.fetch();

    // 🔥 SOLUCIÓN REAL
    if (state.isInternetReachable === null) {
      return state.isConnected;
    }

    return state.isConnected && state.isInternetReachable;
  };

  return { isOnline };
};
