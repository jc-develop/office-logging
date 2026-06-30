import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SessionGreeting from "@/components/kiosk/SessionGreeting";

describe("SessionGreeting", () => {
  it("renders text in hero variant by default", () => {
    render(<SessionGreeting emoji="" text="Welcome!" />);
    expect(screen.getByText("Welcome!")).toBeInTheDocument();
  });

  it("renders emoji in hero variant", () => {
    render(<SessionGreeting emoji="🚀" text="Blast off!" />);
    expect(screen.getByText("🚀")).toBeInTheDocument();
    expect(screen.getByText("Blast off!")).toBeInTheDocument();
  });

  it("renders in inline variant", () => {
    render(<SessionGreeting emoji="" text="Inline greeting" variant="inline" />);
    expect(screen.getByText("Inline greeting")).toBeInTheDocument();
  });

  it("renders emoji in inline variant", () => {
    render(<SessionGreeting emoji="🔥" text="On fire!" variant="inline" />);
    expect(screen.getByText("🔥")).toBeInTheDocument();
    expect(screen.getByText("On fire!")).toBeInTheDocument();
  });

  it("handles empty emoji string gracefully", () => {
    render(<SessionGreeting emoji="" text="No emoji" />);
    expect(screen.getByText("No emoji")).toBeInTheDocument();
  });
});
