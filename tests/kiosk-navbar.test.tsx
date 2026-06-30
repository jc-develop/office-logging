import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import KioskNavbar from "@/components/kiosk/KioskNavbar";

vi.mock("next/image", () => ({
  default: ({ alt, ...props }: Record<string, unknown>) => {
    const { fill, ...rest } = props as { fill?: boolean; [key: string]: unknown };
    return <img alt={alt as string} data-fill={fill ? "true" : undefined} {...rest} />;
  },
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: Record<string, unknown>) => (
    <a href={href as string} {...props}>{children}</a>
  ),
}));

vi.mock("@/components/shared/DateTimeDisplay", () => ({
  default: () => <div data-testid="date-time-display">Mock DateTime</div>,
}));

describe("KioskNavbar", () => {
  it("renders the company logo", () => {
    render(<KioskNavbar />);
    const logo = screen.getByAltText("Company logo");
    expect(logo).toBeInTheDocument();
  });

  it("renders the company text logo", () => {
    render(<KioskNavbar />);
    const textLogo = screen.getByAltText("StartupLab Business Center");
    expect(textLogo).toBeInTheDocument();
  });

  it("renders the DateTimeDisplay component", () => {
    render(<KioskNavbar />);
    expect(screen.getByTestId("date-time-display")).toBeInTheDocument();
  });

  it("renders the Admin Portal link", () => {
    render(<KioskNavbar />);
    const adminLink = screen.getByText(/admin portal/i);
    expect(adminLink).toBeInTheDocument();
    expect(adminLink.closest("a")).toHaveAttribute("href", "/login");
  });
});
