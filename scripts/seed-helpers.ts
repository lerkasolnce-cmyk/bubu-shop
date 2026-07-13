// Shared spec-builder helpers used by the per-brand seed-data files.
// Kept separate from seed-data.ts so the brand files (seed-data-anex.ts,
// seed-data-cybex.ts, seed-data-espiro.ts) don't need a runtime import from
// the file that re-exports them (seed-data.ts imports the brand files, not
// the other way around).

export function strollerSpecs(
  weight: string,
  ageGroup: string,
  fold: string,
  wheels: string
): Record<string, string> {
  return {
    вага: weight,
    "група/вік": ageGroup,
    складання: fold,
    колеса: wheels,
    гарантія: "24 місяці",
  };
}

export function carSeatSpecs(
  weight: string,
  group: string,
  mount: string,
  heightRange: string
): Record<string, string> {
  return {
    вага: weight,
    група: group,
    кріплення: mount,
    "зріст дитини": heightRange,
    гарантія: "24 місяці",
  };
}

export function accessorySpecs(
  material: string,
  compatibility: string,
  care: string
): Record<string, string> {
  return {
    матеріал: material,
    сумісність: compatibility,
    догляд: care,
    гарантія: "12 місяців",
  };
}
