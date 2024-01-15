
declare global {
  interface Navigator {
    connection: {
      downlink: number;
      effectiveType: string;
      rtt: number;
    };
  }
}

export {}