import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import PersonForm from "@/components/kiosk/PersonForm";
import type { LogEntry } from "@/lib/supabase";

const { mockCalculateStreak } = vi.hoisted(() => ({
  mockCalculateStreak: vi.fn(),
}));

vi.mock("@/lib/audio", () => ({
  playClickSound: vi.fn(),
}));

vi.mock("@/lib/logs", () => ({
  calculateStreak: mockCalculateStreak,
}));

vi.mock("@/components/kiosk/SuggestionsDropdown", () => ({
  default: ({ suggestions, onSelect }: { suggestions: Array<{ name: string; role: string }>; onSelect: (s: { name: string; role: string }) => void }) => (
    <div data-testid="suggestions-dropdown">
      {suggestions.map((s, i) => (
        <button key={i} onClick={() => onSelect(s)} data-testid={`suggestion-${i}`}>
          {s.name} ({s.role})
        </button>
      ))}
    </div>
  ),
}));

const mockPeople = [{ name: "", role: "intern" as const }];

function defaultProps(overrides: Record<string, unknown> = {}) {
  return {
    people: mockPeople,
    allLogs: [] as LogEntry[],
    suggestions: [{ name: "Alex", role: "intern" as const }],
    saving: false,
    onUpdateName: vi.fn(),
    onUpdateRole: vi.fn(),
    onRemove: vi.fn(),
    onAdd: vi.fn(),
    onSelectSuggestion: vi.fn(),
    ...overrides,
  };
}

describe("PersonForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCalculateStreak.mockReturnValue(0);
  });

  it("renders name input for each person", () => {
    render(<PersonForm {...defaultProps()} />);
    expect(screen.getByPlaceholderText("e.g. Alex")).toBeInTheDocument();
  });

  it("renders role select for each person", () => {
    render(<PersonForm {...defaultProps()} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("calls onUpdateName when typing in the name field", async () => {
    const onUpdateName = vi.fn();
    const user = userEvent.setup();
    render(<PersonForm {...defaultProps({ onUpdateName })} />);
    await user.type(screen.getByPlaceholderText("e.g. Alex"), "A");
    expect(onUpdateName).toHaveBeenCalledWith(0, "A");
  });

  it("calls onAdd when Add Friend button is clicked", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    render(<PersonForm {...defaultProps({ onAdd })} />);
    await user.click(screen.getByText(/add friend/i));
    expect(onAdd).toHaveBeenCalled();
  });

  it("shows streak badge when streak > 0 and name is not empty", () => {
    mockCalculateStreak.mockReturnValue(3);
    render(<PersonForm {...defaultProps({ people: [{ name: "Alex", role: "intern" as const }] })} />);
    expect(screen.getByText(/3-day streak active/i)).toBeInTheDocument();
  });

  it("does not show streak badge when name is empty", () => {
    mockCalculateStreak.mockReturnValue(3);
    render(<PersonForm {...defaultProps()} />);
    expect(screen.queryByText(/streak/i)).not.toBeInTheDocument();
  });

  it("disables inputs when saving is true", () => {
    render(<PersonForm {...defaultProps({ saving: true })} />);
    expect(screen.getByPlaceholderText("e.g. Alex")).toBeDisabled();
    expect(screen.getByRole("combobox")).toBeDisabled();
  });

  it("shows suggestions dropdown when name input is focused", async () => {
    const user = userEvent.setup();
    render(<PersonForm {...defaultProps()} />);
    await user.click(screen.getByPlaceholderText("e.g. Alex"));
    expect(screen.getByTestId("suggestions-dropdown")).toBeInTheDocument();
  });

  it("calls onSelectSuggestion when a suggestion is clicked", async () => {
    const onSelectSuggestion = vi.fn();
    const user = userEvent.setup();
    render(<PersonForm {...defaultProps({ onSelectSuggestion })} />);
    await user.click(screen.getByPlaceholderText("e.g. Alex"));
    await user.click(screen.getByTestId("suggestion-0"));
    expect(onSelectSuggestion).toHaveBeenCalledWith(0, { name: "Alex", role: "intern" });
  });

  it("renders remove button only for additional persons", () => {
    const { rerender } = render(<PersonForm {...defaultProps()} />);
    expect(screen.queryByTitle("Remove person")).not.toBeInTheDocument();

    rerender(
      <PersonForm
        {...defaultProps({
          people: [
            { name: "", role: "intern" as const },
            { name: "", role: "guest" as const },
          ],
        })}
      />
    );
    const removeBtns = screen.getAllByTitle("Remove person");
    expect(removeBtns).toHaveLength(1);
  });
});
