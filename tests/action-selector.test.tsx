import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ActionSelector from "@/components/kiosk/ActionSelector";

vi.mock("@/lib/audio", () => ({
  playClickSound: vi.fn(),
}));

describe("ActionSelector", () => {
  it("renders all three action buttons", () => {
    render(<ActionSelector onSelect={vi.fn()} />);
    expect(screen.getByText("Log In")).toBeInTheDocument();
    expect(screen.getByText("Take Break")).toBeInTheDocument();
    expect(screen.getByText("Log Out")).toBeInTheDocument();
  });

  it("calls onSelect with 'login' when Log In is clicked", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<ActionSelector onSelect={onSelect} />);
    await user.click(screen.getByText("Log In"));
    expect(onSelect).toHaveBeenCalledWith("login");
  });

  it("calls onSelect with 'break' when Take Break is clicked", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<ActionSelector onSelect={onSelect} />);
    await user.click(screen.getByText("Take Break"));
    expect(onSelect).toHaveBeenCalledWith("break");
  });

  it("calls onSelect with 'logout' when Log Out is clicked", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<ActionSelector onSelect={onSelect} />);
    await user.click(screen.getByText("Log Out"));
    expect(onSelect).toHaveBeenCalledWith("logout");
  });
});
