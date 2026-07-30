// ═══════════════════════════════════════════════════════════════
//  TAILWIND CLASS UTILITIES
// ═══════════════════════════════════════════════════════════════

function parse(input: string): string[] {
  return input.trim().split(/\s+/).filter(Boolean);
}

function has(input: string, cls: string): boolean {
  return parse(input).includes(cls);
}

function addClass(input: string, cls: string): string {
  return has(input, cls) ? input : (input + " " + cls).trim();
}

function removeClass(input: string, cls: string): string {
  return parse(input).filter((c) => c !== cls).join(" ");
}

function clearPrefix(input: string, prefix: string): string {
  return parse(input).filter((c) => !c.startsWith(prefix)).join(" ");
}

function setPrefixed(input: string, prefix: string, value: string): string {
  return addClass(clearPrefix(input, prefix), prefix + value);
}

function toggle(input: string, cls: string): string {
  return has(input, cls) ? removeClass(input, cls) : addClass(input, cls);
}

function activeInGroup(input: string, prefix: string): string | undefined {
  return parse(input).find((c) => c.startsWith(prefix));
}

// ── Mutually exclusive class groups ──────────────────────────

export const DISPLAY_GROUP = ["block", "flex", "inline-block", "inline", "grid", "hidden"];
export const FLEX_DIR_GROUP = ["flex-row", "flex-col", "flex-row-reverse", "flex-col-reverse"];
export const ALIGN_GROUP = ["items-start", "items-center", "items-end", "items-stretch", "items-baseline"];
export const JUSTIFY_GROUP = ["justify-start", "justify-center", "justify-end", "justify-between", "justify-around", "justify-evenly"];
export const TEXT_ALIGN_GROUP = ["text-left", "text-center", "text-right", "text-justify"];
export const FONT_SIZE_GROUP = ["text-xs", "text-sm", "text-base", "text-lg", "text-xl", "text-2xl", "text-3xl", "text-4xl", "text-5xl"];
export const FONT_WEIGHT_GROUP = ["font-thin", "font-normal", "font-medium", "font-semibold", "font-bold", "font-extrabold"];

/**
 * Replace any class from `group` that is present in `input` with `newClass`.
 * If `newClass` is empty/undefined, all group members are stripped (none selected).
 * Example: setGroupClass("block hidden p-4", DISPLAY_GROUP, "flex") → "flex p-4"
 */
function setGroupClass(input: string, group: string[], newClass: string): string {
  const cleaned = parse(input).filter((c) => !group.includes(c)).join(" ");
  if (!newClass) return cleaned;
  return addClass(cleaned, newClass);
}

export const tw = {
  parse,
  has,
  add: addClass,
  remove: removeClass,
  clearPrefix,
  setPrefixed,
  toggle,
  activeInGroup,
  setGroupClass,
};
