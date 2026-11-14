"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { captureAttribution } from "../contact/attribution";

export function InquiryContext() {
  const pathname = usePathname();
  useEffect(() => { captureAttribution(); }, [pathname]);
  return null;
}
