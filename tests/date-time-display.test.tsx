import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import DateTimeDisplay from "@/components/shared/DateTimeDisplay";

describe("DateTimeDisplay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-27T10:30:45"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the date", () => {
    render(<DateTimeDisplay />);
    expect(screen.getByText(/saturday/i)).toBeInTheDocument();
  });

  it("renders the time", () => {
    render(<DateTimeDisplay />);
    expect(screen.getByText("10:30:45 AM")).toBeInTheDocument();
  });

  it("updates time every second", () => {
    render(<DateTimeDisplay />);
    expect(screen.getByText("10:30:45 AM")).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByText("10:30:46 AM")).toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(1000); });
    expect(screen.getByText("10:30:47 AM")).toBeInTheDocument();
  });

  it("sets aria-label with current date and time", () => {
    render(<DateTimeDisplay />);
    const container = screen.getByLabelText(/current date and time/i);
    expect(container).toBeInTheDocument();
  });
});
