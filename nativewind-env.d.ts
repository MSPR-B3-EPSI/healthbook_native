/// <reference types="nativewind/types" />

declare module '*.css';


declare namespace NodeJS {
  interface ProcessEnv {
    [key: `EXPO_PUBLIC_${string}`]: string | undefined;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};
