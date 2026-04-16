import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Switch } from "./switch";

describe("Switch", () => {
  it("renders as unchecked by default", () => {
    render(<Switch aria-label="Toggle" />);
    expect(screen.getByRole("switch", { name: "Toggle" })).toHaveAttribute("aria-checked", "false");
  });

  it("renders as checked when defaultChecked=true", () => {
    render(<Switch aria-label="Toggle" defaultChecked />);
    expect(screen.getByRole("switch", { name: "Toggle" })).toHaveAttribute("aria-checked", "true");
  });

  it("is disabled when disabled prop is set", () => {
    render(<Switch aria-label="Toggle" disabled />);
    expect(screen.getByRole("switch", { name: "Toggle" })).toBeDisabled();
  });

  it("toggles on click", async () => {
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="Toggle" onCheckedChange={onCheckedChange} />);
    await userEvent.click(screen.getByRole("switch", { name: "Toggle" }));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("is keyboard-accessible via Space", async () => {
    const onCheckedChange = vi.fn();
    render(<Switch aria-label="Toggle" onCheckedChange={onCheckedChange} />);
    screen.getByRole("switch").focus();
    await userEvent.keyboard(" ");
    expect(onCheckedChange).toHaveBeenCalled();
  });
});
