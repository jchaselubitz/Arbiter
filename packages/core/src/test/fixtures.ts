import type { SourceFile } from "../model/source";

export function fixtureSource(source: SourceFile, content: string): SourceFile {
  return { ...source, exists: true, content };
}
