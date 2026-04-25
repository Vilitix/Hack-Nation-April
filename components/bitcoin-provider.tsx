"use client";

import { ReactNode, useEffect } from "react";

export function BitcoinProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    import("@getalby/bitcoin-connect-react").then(({ init }) => {
      init({
        appName: "Agent Market",
        showBalance: true,
        filters: ["nwc"],
      });
    });
  }, []);

  return <>{children}</>;
}
