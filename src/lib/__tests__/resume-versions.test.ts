import { describe, it, expect } from "vitest";
import { hashResumeContent } from "../resume-versions";

describe("hashResumeContent", () => {
  it("returns the same hash for equivalent objects with different key order", () => {
    const a = { skills: { languages: "Python" }, education: [] };
    const b = { education: [], skills: { languages: "Python" } };

    expect(hashResumeContent(a)).toBe(hashResumeContent(b));
  });

  it("returns different hashes when content changes", () => {
    const before = { education: [{ id: "1", degree: "BS" }] };
    const after = { education: [{ id: "1", degree: "MS" }] };

    expect(hashResumeContent(before)).not.toBe(hashResumeContent(after));
  });

  it("preserves array order in the hash", () => {
    const first = { education: [{ id: "1" }, { id: "2" }] };
    const second = { education: [{ id: "2" }, { id: "1" }] };

    expect(hashResumeContent(first)).not.toBe(hashResumeContent(second));
  });
});
