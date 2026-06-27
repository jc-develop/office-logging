import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/kiosk/KioskNavbar", () => ({
  default: () => <div data-testid="kiosk-navbar">Mock Navbar</div>,
}));

vi.mock("@/components/kiosk/LogForm", () => ({
  default: () => <div data-testid="log-form">Mock LogForm</div>,
}));

describe("KioskPage", () => {
  it("renders the heading", async () => {
    const KioskPage = (await import("@/components/kiosk/KioskPage")).default;
    render(<KioskPage />);
    expect(screen.getByText("StartupLab Office Logging")).toBeInTheDocument();
  });

  it("renders the subtitle", async () => {
    const KioskPage = (await import("@/components/kiosk/KioskPage")).default;
    render(<KioskPage />);
    expect(screen.getByText(/welcome to the startupLab workspace/i)).toBeInTheDocument();
  });

  it("renders the KioskNavbar", async () => {
    const KioskPage = (await import("@/components/kiosk/KioskPage")).default;
    render(<KioskPage />);
    expect(screen.getByTestId("kiosk-navbar")).toBeInTheDocument();
  });

  it("renders the LogForm", async () => {
    const KioskPage = (await import("@/components/kiosk/KioskPage")).default;
    render(<KioskPage />);
    expect(screen.getByTestId("log-form")).toBeInTheDocument();
  });

  it("renders the footer", async () => {
    const KioskPage = (await import("@/components/kiosk/KioskPage")).default;
    render(<KioskPage />);
    expect(screen.getByText(/StartupLab Kiosk System/i)).toBeInTheDocument();
  });
});
