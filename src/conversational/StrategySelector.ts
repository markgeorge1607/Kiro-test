import { Archetype, BehavioralStrategyName, UserContext } from '../types/index';

/**
 * Selects the best behavioral strategy for a given archetype and context.
 *
 * The selector returns the first (highest-priority) strategy from the
 * archetype's preferredStrategies list. For the Squeezed Saver archetype,
 * loss-aversion is naturally first in the list, satisfying Req 2.2.
 *
 * Returns undefined when the archetype has no preferred strategies,
 * signalling that no nudge should be emitted for this context.
 *
 * The Conversational Layer never throws — this function always returns
 * a valid strategy name or undefined.
 */
export class StrategySelector {
  /**
   * Select a behavioral strategy based on archetype preferences and context.
   *
   * - Req 1.2: Selects a strategy based on archetype and context.
   * - Req 2.2: Squeezed Saver prioritises loss-aversion (first in list).
   * - Req 2.3: Uses the archetype's preferred strategy for tone/content.
   */
  select(archetype: Archetype, _context: UserContext): BehavioralStrategyName | undefined {
    if (archetype.preferredStrategies.length === 0) {
      return undefined;
    }

    return archetype.preferredStrategies[0];
  }
}
