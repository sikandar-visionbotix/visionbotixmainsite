/**
 * Scripted "See it work" previews (D19). One script per agent lives in the agent's content file (`demo:`);
 * the homepage hero has its own in `src/components/home/AgentConsole.astro`. The live demos of S7/S7b replace
 * these in the `[data-demo-slot]` container on each agent page.
 */
import type { IconName } from '@/lib/icons';

export type DemoLine =
  | { kind: 'in'; who: string; text: string; wait?: number | undefined }
  | { kind: 'out'; who?: string | undefined; text: string; wait?: number | undefined }
  | { kind: 'sys'; icon?: IconName | undefined; label: string; text: string; wait?: number | undefined }
  | { kind: 'tool'; icon?: IconName | undefined; calls: string[]; result?: string | undefined; wait?: number | undefined }
  | { kind: 'gate'; icon?: IconName | undefined; text: string; wait?: number | undefined }
  | { kind: 'done'; icon?: IconName | undefined; text: string; wait?: number | undefined };

export interface DemoScript {
  title: string;
  status: string;
  icon?: IconName | undefined;
  tools: { icon: IconName; label: string }[];
  lines: DemoLine[];
  caption: string;
}

/** Default pause after each kind of line (ms), tuned so a loop reads comfortably. */
export const defaultWait: Record<DemoLine['kind'], number> = { in: 1200, out: 1600, sys: 1100, tool: 1200, gate: 1600, done: 4200 };
