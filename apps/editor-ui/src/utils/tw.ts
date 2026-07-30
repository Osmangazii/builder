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

export const tw = { parse, has, add: addClass, remove: removeClass, clearPrefix, setPrefixed, toggle, activeInGroup };
