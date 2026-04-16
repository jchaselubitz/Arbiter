import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "./dialog";

describe("Dialog", () => {
  function TestDialog({ open }: { open?: boolean }) {
    return (
      <Dialog defaultOpen={open}>
        <DialogTrigger asChild>
          <button type="button">Open dialog</button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Title</DialogTitle>
            <DialogDescription>Test description</DialogDescription>
          </DialogHeader>
          <p>Dialog body content</p>
        </DialogContent>
      </Dialog>
    );
  }

  it("renders trigger button", () => {
    render(<TestDialog />);
    expect(screen.getByRole("button", { name: "Open dialog" })).toBeInTheDocument();
  });

  it("shows dialog on trigger click", async () => {
    render(<TestDialog />);
    await userEvent.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Test Title")).toBeInTheDocument();
  });

  it("shows dialog content when defaultOpen=true", () => {
    render(<TestDialog open />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes with Esc key", async () => {
    render(<TestDialog />);
    await userEvent.click(screen.getByRole("button", { name: "Open dialog" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("has accessible title and description", () => {
    render(<TestDialog open />);
    expect(screen.getByRole("dialog", { name: "Test Title" })).toBeInTheDocument();
    expect(screen.getByText("Test description")).toBeInTheDocument();
  });

  it("close button has accessible name", () => {
    render(<TestDialog open />);
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });
});
