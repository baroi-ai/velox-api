"use client";

import { useEffect, useState } from "react";

export default function SafeHydrate({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Return a dark empty div during the "Connection closed" phase
  if (!mounted) return <div className="min-h-screen bg-[#0f172a]" />;

  return <>{children}</>;
}
