import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FiltersProvider, useFilters } from "@/hooks/use-filters";

describe("Shared screen filters", () => {
  it("shares one unit and period selection between screen consumers", () => {
    const { result } = renderHook(() => ({ first: useFilters(), second: useFilters() }), { wrapper: FiltersProvider });
    act(() => {
      result.current.first.setUnitId("u2");
      result.current.first.setYear(2025);
      result.current.first.setMonth(3);
    });
    expect(result.current.second.unitId).toBe("u2");
    expect(result.current.second.year).toBe(2025);
    expect(result.current.second.month).toBe(3);
  });
});