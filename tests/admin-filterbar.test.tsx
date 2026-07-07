import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import FilterBar from "@/components/admin/FilterBar";

vi.mock("@/lib/audio", () => ({
  playClickSound: vi.fn(),
}));

describe("FilterBar", () => {
  const defaultProps = {
    search: "",
    dateFrom: "",
    dateTo: "",
    typeFilter: "all" as const,
    sortBy: "date-desc" as const,
    totalLogs: 100,
    visibleCount: 50,
    hasFilters: false,
    onSearchChange: vi.fn(),
    onDateFromChange: vi.fn(),
    onDateToChange: vi.fn(),
    onTypeFilterChange: vi.fn(),
    onSortByChange: vi.fn(),
    onClearFilters: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all filter labels", () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByText("Search name")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("From date")).toBeInTheDocument();
    expect(screen.getByText("To date")).toBeInTheDocument();
    expect(screen.getByText("Sort by")).toBeInTheDocument();
  });

  it("shows visible/total count text", () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.getByText(/50 of 100 entries matching search query/i)).toBeInTheDocument();
  });

  it("does not show clear filters button when no filters are active", () => {
    render(<FilterBar {...defaultProps} />);
    expect(screen.queryByText("Clear all filters")).not.toBeInTheDocument();
  });

  it("shows clear filters button when filters are active", () => {
    render(<FilterBar {...defaultProps} hasFilters={true} />);
    expect(screen.getByText("Clear all filters")).toBeInTheDocument();
  });

  it("calls onClearFilters when clear button is clicked", async () => {
    const onClearFilters = vi.fn();
    const user = userEvent.setup();
    render(<FilterBar {...defaultProps} hasFilters={true} onClearFilters={onClearFilters} />);
    await user.click(screen.getByText("Clear all filters"));
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });

  it("calls onTypeFilterChange when type is changed", async () => {
    const onTypeFilterChange = vi.fn();
    const user = userEvent.setup();
    render(<FilterBar {...defaultProps} onTypeFilterChange={onTypeFilterChange} />);
    await user.selectOptions(screen.getByLabelText("Type"), "login");
    expect(onTypeFilterChange).toHaveBeenCalledWith("login");
  });

  it("calls onSortByChange when sort is changed", async () => {
    const onSortByChange = vi.fn();
    const user = userEvent.setup();
    render(<FilterBar {...defaultProps} onSortByChange={onSortByChange} />);
    await user.selectOptions(screen.getByLabelText("Sort by"), "name-asc");
    expect(onSortByChange).toHaveBeenCalledWith("name-asc");
  });

  it("calls onSearchChange when search input changes", async () => {
    const onSearchChange = vi.fn();
    const user = userEvent.setup();
    render(<FilterBar {...defaultProps} onSearchChange={onSearchChange} />);
    await user.type(screen.getByPlaceholderText(/e.g. Alex/i), "A");
    expect(onSearchChange).toHaveBeenCalledWith("A");
  });

  it("calls onDateFromChange when from date changes", async () => {
    const onDateFromChange = vi.fn();
    const user = userEvent.setup();
    render(<FilterBar {...defaultProps} onDateFromChange={onDateFromChange} />);
    const fromInput = screen.getByLabelText("From date");
    await user.type(fromInput, "2025-01-01");
    expect(onDateFromChange).toHaveBeenCalled();
  });
});
