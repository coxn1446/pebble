import React, { createContext, useContext, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

const NativeContext = createContext({
  isNative: false,
  platform: 'web',
});

export const NativeProvider = ({ children }) => {
  const [value, setValue] = useState({
    isNative: Capacitor.isNativePlatform(),
    platform: Capacitor.getPlatform(),
  });

  useEffect(() => {
    setValue({
      isNative: Capacitor.isNativePlatform(),
      platform: Capacitor.getPlatform(),
    });
  }, []);

  return <NativeContext.Provider value={value}>{children}</NativeContext.Provider>;
};

export const useNative = () => useContext(NativeContext);

export default NativeContext;
