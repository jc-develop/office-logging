import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SuccessCard from "@/components/kiosk/SuccessCard";

describe("SuccessCard", () => {
  const baseProps = {
    message: "Logged In Successfully!",
    welcomeCards: [
      {
        name: "Alex",
        welcomeMessage: "Good to see you, Alex!",
        badges: [],
      },
    ],
  };

  it("renders the success message", () => {
    render(<SuccessCard {...baseProps} />);
    expect(screen.getByText("Logged In Successfully!")).toBeInTheDocument();
  });

  it("renders welcome card with user name", () => {
    render(<SuccessCard {...baseProps} />);
    expect(screen.getByText("Alex")).toBeInTheDocument();
  });

  it("renders welcome card message", () => {
    render(<SuccessCard {...baseProps} />);
    expect(screen.getByText((content) => content.includes("Good to see you, Alex!"))).toBeInTheDocument();
  });

  it("renders multiple welcome cards", () => {
    render(
      <SuccessCard
        message="Done!"
        welcomeCards={[
          { name: "Alice", welcomeMessage: "Hi Alice!", badges: [] },
          { name: "Bob", welcomeMessage: "Hi Bob!", badges: [] },
        ]}
      />
    );
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("renders badges inside welcome cards", () => {
    render(
      <SuccessCard
        message="Done!"
        welcomeCards={[
          {
            name: "Alex",
            welcomeMessage: "Hey!",
            badges: [{ name: "Early Bird", icon: "🌅", style: "text-brand-blue-700" }],
          },
        ]}
      />
    );
    expect(screen.getByText("Early Bird")).toBeInTheDocument();
    expect(screen.getByText("🌅")).toBeInTheDocument();
  });

  it("shows loading indicator", () => {
    render(<SuccessCard {...baseProps} />);
    expect(screen.getByText(/loading new logging session/i)).toBeInTheDocument();
  });
});
