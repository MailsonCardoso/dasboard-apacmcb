import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { PeriodFilter } from "@/types";
import { REFERENCE_DATE } from "@/mocks/data";

interface Ctx extends PeriodFilter {
  setUnitId: (v: string) => void;
  setYear: (v: number) => void;
  setMonth: (v: number) => void;
}

const FiltersContext = createContext<Ctx | null>(null);

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [unitId, setUnitId] = useState("all");
  const [year, setYear] = useState(Number(REFERENCE_DATE.slice(0, 4)));
  const [month, setMonth] = useState(Number(REFERENCE_DATE.slice(5, 7)));
  const value = useMemo(() => ({ unitId, year, month, setUnitId, setYear, setMonth }), [unitId, year, month]);
  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

export function useFilters() {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error("useFilters must be used inside FiltersProvider");
  return ctx;
}
