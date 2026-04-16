import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Combobox } from "./combobox";

const options = [
  { value: "claude-code", label: "Claude Code" },
  { value: "cursor", label: "Cursor" },
  { value: "gemini", label: "Gemini", disabled: true }
];

describe("Combobox", () => {
  it("renders with placeholder when no value", () => {
    render(<Combobox options={options} placeholder="Select agent" aria-label="Agent" />);
    expect(screen.getByText("Select agent")).toBeInTheDocument();
  });

  it("shows selected label when value is set", () => {
    render(<Combobox options={options} value="claude-code" aria-label="Agent" />);
    expect(screen.getByText("Claude Code")).toBeInTheDocument();
  });

  it("opens dropdown on click", async () => {
    render(<Combobox options={options} aria-label="Agent" />);
    await userEvent.click(screen.getByRole("button", { name: "Agent" }));
    expect(screen.getByRole("button", { name: "Claude Code" })).toBeInTheDocument();
  });

  it("calls onValueChange when option selected", async () => {
    const onValueChange = vi.fn();
    render(<Combobox options={options} onValueChange={onValueChange} aria-label="Agent" />);
    await userEvent.click(screen.getByRole("button", { name: "Agent" }));
    await userEvent.click(screen.getByRole("button", { name: /claude code/i }));
    expect(onValueChange).toHaveBeenCalledWith("claude-code");
  });

  it("filters options by search input", async () => {
    render(<Combobox options={options} aria-label="Agent" searchPlaceholder="Search agents" />);
    await userEvent.click(screen.getByRole("button", { name: "Agent" }));
    await userEvent.type(screen.getByPlaceholderText("Search agents"), "cursor");
    expect(screen.getByRole("button", { name: /cursor/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /claude code/i })).not.toBeInTheDocument();
  });

  it("disabled option cannot be selected", async () => {
    const onValueChange = vi.fn();
    render(<Combobox options={options} onValueChange={onValueChange} aria-label="Agent" />);
    await userEvent.click(screen.getByRole("button", { name: "Agent" }));
    const geminiBtn = screen.getByRole("button", { name: /gemini/i });
    expect(geminiBtn).toBeDisabled();
    await userEvent.click(geminiBtn);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("is disabled when disabled prop set", () => {
    render(<Combobox options={options} disabled aria-label="Agent" />);
    expect(screen.getByRole("button", { name: "Agent" })).toBeDisabled();
  });
});
