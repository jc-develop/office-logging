import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BadgeList from "@/components/kiosk/BadgeList";

describe("BadgeList", () => {
  it("renders nothing when badges are empty", () => {
    const { container } = render(<BadgeList badges={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a single badge", () => {
    render(
      <BadgeList
        badges={[{ name: "Early Bird", icon: "🌅", style: "text-brand-blue-700" }]}
      />
    );
    expect(screen.getByText("Early Bird")).toBeInTheDocument();
    expect(screen.getByText("🌅")).toBeInTheDocument();
  });

  it("renders multiple badges", () => {
    render(
      <BadgeList
        badges={[
          { name: "Early Bird", icon: "🌅", style: "text-brand-blue-700" },
          { name: "5-Day Streak", icon: "🔥", style: "text-brand-blue-700" },
        ]}
      />
    );
    expect(screen.getByText("Early Bird")).toBeInTheDocument();
    expect(screen.getByText("5-Day Streak")).toBeInTheDocument();
  });

  it("applies the given style class to each badge", () => {
    render(
      <BadgeList
        badges={[{ name: "Test", icon: "⭐", style: "custom-style-class" }]}
      />
    );
    const badge = screen.getByText("Test").parentElement!;
    expect(badge).toHaveClass("custom-style-class");
    expect(badge).toHaveClass("flex");
  });
});
