import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { ASSET_BASE_URL } from '../constants';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) {
      setSocket(null);
      return;
    }

    const instance = io(ASSET_BASE_URL, {
      auth: { token }
    });
    setSocket(instance);

    return () => {
      instance.disconnect();
    };
  }, [token]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);
