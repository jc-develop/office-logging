import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SuggestionsDropdown from "@/components/kiosk/SuggestionsDropdown";

describe("SuggestionsDropdown", () => {
  const suggestions = [
    { name: "Alice", role: "staff" as const },
    { name: "Bob", role: "intern" as const },
  ];

  it("renders all suggestions", () => {
    render(<SuggestionsDropdown suggestions={suggestions} onSelect={vi.fn()} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("renders role labels", () => {
    render(<SuggestionsDropdown suggestions={suggestions} onSelect={vi.fn()} />);
    expect(screen.getByText("staff")).toBeInTheDocument();
    expect(screen.getByText("intern")).toBeInTheDocument();
  });

  it("returns null when suggestions are empty", () => {
    const { container } = render(<SuggestionsDropdown suggestions={[]} onSelect={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("calls onSelect with the suggestion when clicked", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<SuggestionsDropdown suggestions={suggestions} onSelect={onSelect} />);
    await user.click(screen.getByText("Alice"));
    expect(onSelect).toHaveBeenCalledWith({ name: "Alice", role: "staff" });
  });
});
