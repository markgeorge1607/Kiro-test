import { describe, it, expect } from 'vitest';
import {
  ArchetypeRegistry,
  SQUEEZED_SAVER_ARCHETYPE,
  VALUE_SEEKER_ARCHETYPE,
  createDefaultRegistry,
} from './ArchetypeRegistry';
import { Archetype } from '../types/index';

describe('ArchetypeRegistry', () => {
  it('returns undefined for an unregistered archetype', () => {
    const registry = new ArchetypeRegistry();
    expect(registry.get('nonexistent')).toBeUndefined();
  });

  it('registers and retrieves an archetype by name', () => {
    const registry = new ArchetypeRegistry();
    const archetype: Archetype = {
      name: 'test-archetype',
      traits: ['trait-a'],
      preferredStrategies: ['loss-aversion'],
    };

    registry.register(archetype);
    expect(registry.get('test-archetype')).toEqual(archetype);
  });

  it('overwrites an archetype when re-registered with the same name', () => {
    const registry = new ArchetypeRegistry();
    const v1: Archetype = {
      name: 'evolving',
      traits: ['old-trait'],
      preferredStrategies: ['loss-aversion'],
    };
    const v2: Archetype = {
      name: 'evolving',
      traits: ['new-trait'],
      preferredStrategies: ['peak-end-rule'],
    };

    registry.register(v1);
    registry.register(v2);
    expect(registry.get('evolving')).toEqual(v2);
  });

  it('supports multiple distinct archetypes', () => {
    const registry = new ArchetypeRegistry();
    const a: Archetype = {
      name: 'alpha',
      traits: ['a'],
      preferredStrategies: ['loss-aversion'],
    };
    const b: Archetype = {
      name: 'beta',
      traits: ['b'],
      preferredStrategies: ['peak-end-rule'],
    };

    registry.register(a);
    registry.register(b);
    expect(registry.get('alpha')).toEqual(a);
    expect(registry.get('beta')).toEqual(b);
  });
});

describe('SQUEEZED_SAVER_ARCHETYPE', () => {
  it('has the correct default definition', () => {
    expect(SQUEEZED_SAVER_ARCHETYPE).toEqual({
      name: 'squeezed-saver',
      traits: ['cost-conscious', 'deal-seeking', 'fee-averse'],
      preferredStrategies: ['loss-aversion', 'peak-end-rule', 'identity-reinforcement'],
    });
  });
});

describe('VALUE_SEEKER_ARCHETYPE', () => {
  it('has the correct default definition', () => {
    expect(VALUE_SEEKER_ARCHETYPE).toEqual({
      name: 'value-seeker',
      traits: ['optimization-driven', 'data-responsive', 'exclusivity-motivated'],
      preferredStrategies: ['identity-reinforcement', 'loss-aversion', 'peak-end-rule'],
    });
  });

  it('has name "value-seeker"', () => {
    expect(VALUE_SEEKER_ARCHETYPE.name).toBe('value-seeker');
  });

  it('prioritizes identity-reinforcement as the first preferred strategy', () => {
    expect(VALUE_SEEKER_ARCHETYPE.preferredStrategies[0]).toBe('identity-reinforcement');
  });
});

describe('createDefaultRegistry', () => {
  it('returns a registry pre-loaded with the squeezed-saver archetype', () => {
    const registry = createDefaultRegistry();
    expect(registry.get('squeezed-saver')).toEqual(SQUEEZED_SAVER_ARCHETYPE);
  });

  it('returns a registry pre-loaded with the value-seeker archetype', () => {
    const registry = createDefaultRegistry();
    expect(registry.get('value-seeker')).toEqual(VALUE_SEEKER_ARCHETYPE);
  });

  it('contains both squeezed-saver and value-seeker archetypes', () => {
    const registry = createDefaultRegistry();
    const squeezedSaver = registry.get('squeezed-saver');
    const valueSeeker = registry.get('value-seeker');

    expect(squeezedSaver).toBeDefined();
    expect(valueSeeker).toBeDefined();
    expect(squeezedSaver).toEqual(SQUEEZED_SAVER_ARCHETYPE);
    expect(valueSeeker).toEqual(VALUE_SEEKER_ARCHETYPE);
  });

  it('retrieving one archetype does not affect the other', () => {
    const registry = createDefaultRegistry();

    // Retrieve value-seeker first
    const valueSeeker = registry.get('value-seeker');
    expect(valueSeeker).toEqual(VALUE_SEEKER_ARCHETYPE);

    // Squeezed-saver should still be intact
    const squeezedSaver = registry.get('squeezed-saver');
    expect(squeezedSaver).toEqual(SQUEEZED_SAVER_ARCHETYPE);

    // And they should be distinct archetypes
    expect(squeezedSaver!.name).not.toBe(valueSeeker!.name);
  });

  it('allows registering additional archetypes without modifying defaults', () => {
    const registry = createDefaultRegistry();
    const custom: Archetype = {
      name: 'custom',
      traits: ['curious'],
      preferredStrategies: ['identity-reinforcement'],
    };

    registry.register(custom);
    expect(registry.get('custom')).toEqual(custom);
    expect(registry.get('squeezed-saver')).toEqual(SQUEEZED_SAVER_ARCHETYPE);
    expect(registry.get('value-seeker')).toEqual(VALUE_SEEKER_ARCHETYPE);
  });
});
