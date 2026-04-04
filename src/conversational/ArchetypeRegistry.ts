import { Archetype } from '../types/index';

/**
 * Registry for archetype definitions.
 * New archetypes can be added at runtime via `register()` without
 * modifying any existing nudge logic (Req 2.4).
 */
export class ArchetypeRegistry {
  private archetypes = new Map<string, Archetype>();

  register(archetype: Archetype): void {
    this.archetypes.set(archetype.name, archetype);
  }

  get(name: string): Archetype | undefined {
    return this.archetypes.get(name);
  }
}

/** Default Squeezed Saver archetype definition. */
export const SQUEEZED_SAVER_ARCHETYPE: Archetype = {
  name: 'squeezed-saver',
  traits: ['cost-conscious', 'deal-seeking', 'fee-averse'],
  preferredStrategies: ['loss-aversion', 'peak-end-rule', 'identity-reinforcement'],
};

/** Default Value Seeker archetype definition. */
export const VALUE_SEEKER_ARCHETYPE: Archetype = {
  name: 'value-seeker',
  traits: ['optimization-driven', 'data-responsive', 'exclusivity-motivated'],
  preferredStrategies: ['identity-reinforcement', 'loss-aversion', 'peak-end-rule'],
};

/**
 * Creates an ArchetypeRegistry pre-loaded with the default archetypes.
 */
export function createDefaultRegistry(): ArchetypeRegistry {
  const registry = new ArchetypeRegistry();
  registry.register(SQUEEZED_SAVER_ARCHETYPE);
  registry.register(VALUE_SEEKER_ARCHETYPE);
  return registry;
}
