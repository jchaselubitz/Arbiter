export function createLineDiff(before: string, after: string): string {
  if (before === after) {
    return "No changes.";
  }

  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  const rows = Math.max(beforeLines.length, afterLines.length);
  const output = ["--- before", "+++ after"];

  for (let i = 0; i < rows; i += 1) {
    const left = beforeLines[i];
    const right = afterLines[i];
    if (left === right) {
      output.push(` ${left ?? ""}`);
      continue;
    }
    if (left !== undefined) {
      output.push(`-${left}`);
    }
    if (right !== undefined) {
      output.push(`+${right}`);
    }
  }

  return output.join("\n");
}

export function summarizeDiff(diff: string): string {
  const added = diff.split("\n").filter((line) => line.startsWith("+") && !line.startsWith("+++")).length;
  const removed = diff.split("\n").filter((line) => line.startsWith("-") && !line.startsWith("---")).length;
  return `${added} additions, ${removed} removals`;
}
