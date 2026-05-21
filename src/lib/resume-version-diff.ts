type SectionConfig = {
  key: string;
  label: string;
  nameField: string;
};

const ARRAY_SECTIONS: SectionConfig[] = [
  { key: "education", label: "Education", nameField: "universityName" },
  { key: "work_experience", label: "Experience", nameField: "company" },
  { key: "projects", label: "Projects", nameField: "projectName" },
  { key: "leadership", label: "Leadership", nameField: "organization" },
];

const SKILL_FIELDS = [
  "languages",
  "developerTools",
  "technologiesFrameworks",
] as const;

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? (value as Record<string, unknown>[]) : [];
}

function itemKey(item: Record<string, unknown>, index: number): string {
  return typeof item.id === "string" ? item.id : `index:${index}`;
}

function itemSnapshot(item: Record<string, unknown>): string {
  const rest = { ...item };
  delete rest.isCollapsed;
  return JSON.stringify(rest);
}

function itemDisplayName(item: Record<string, unknown>, nameField: string): string {
  const name = item[nameField];
  return typeof name === "string" && name.trim() ? name.trim() : "Untitled entry";
}

function diffArraySection(
  beforeItems: Record<string, unknown>[],
  afterItems: Record<string, unknown>[],
  config: SectionConfig,
): string[] {
  const changes: string[] = [];
  const beforeMap = new Map(
    beforeItems.map((item, index) => [itemKey(item, index), item]),
  );
  const afterMap = new Map(
    afterItems.map((item, index) => [itemKey(item, index), item]),
  );

  for (const [key, afterItem] of afterMap) {
    const beforeItem = beforeMap.get(key);
    if (!beforeItem) {
      changes.push(
        `${config.label}: added ${itemDisplayName(afterItem, config.nameField)}`,
      );
      continue;
    }

    if (itemSnapshot(beforeItem) !== itemSnapshot(afterItem)) {
      changes.push(
        `${config.label}: updated ${itemDisplayName(afterItem, config.nameField)}`,
      );
    }
  }

  for (const [key, beforeItem] of beforeMap) {
    if (!afterMap.has(key)) {
      changes.push(
        `${config.label}: removed ${itemDisplayName(beforeItem, config.nameField)}`,
      );
    }
  }

  return changes;
}

function diffSkills(before: unknown, after: unknown): string | null {
  const beforeSkills = asRecord(before);
  const afterSkills = asRecord(after);
  const changedFields = SKILL_FIELDS.filter(
    (field) => (beforeSkills[field] ?? "") !== (afterSkills[field] ?? ""),
  );

  if (changedFields.length === 0) return null;

  const readable = changedFields
    .map((field) =>
      field === "technologiesFrameworks" ? "frameworks" : field.replace(/([A-Z])/g, " $1").trim(),
    )
    .join(", ");

  return `Skills: updated ${readable}`;
}

export function summarizeSectionChanges(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown>,
): string {
  if (!before) {
    return "Initial saved version";
  }

  const changes: string[] = [];

  for (const section of ARRAY_SECTIONS) {
    changes.push(
      ...diffArraySection(
        asArray(before[section.key]),
        asArray(after[section.key]),
        section,
      ),
    );
  }

  const skillsChange = diffSkills(before.skills, after.skills);
  if (skillsChange) {
    changes.push(skillsChange);
  }

  if (changes.length === 0) {
    return "No section changes detected";
  }

  const limit = 4;
  if (changes.length <= limit) {
    return changes.join("; ");
  }

  return `${changes.slice(0, limit).join("; ")}; +${changes.length - limit} more`;
}
