"use client";

import { useEffect } from "react";
import { getLanguage, getTheme } from "@/lib/preferences";

export function PreferenceBoot() {
  useEffect(() => {
    document.documentElement.dataset.theme = getTheme();
    document.documentElement.lang = getLanguage();
  }, []);
  return null;
}
