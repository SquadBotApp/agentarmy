import { useCallback } from 'react';
import { usePricingStore, BoostId } from '../store/pricingStore';

/**
 * A React hook that wraps a function (e.g., a tool execution) to consume a
 * single-use boost before execution.
 *
 * This is useful for boosts like 'tool_swarm' which are consumed on use.
 *
 * @param boostId The ID of the boost to consume.
 * @param toolFunction The function to execute after consuming the boost.
 * @returns A wrapped function that will consume the boost if it's active and then run the original function.
 */
export function useBoostConsumer<T extends (...args: any[]) => any>(
  boostId: BoostId,
  toolFunction: T
): (...args: Parameters<T>) => ReturnType<T> {
  const { hasActiveBoost, consumeBoost } = usePricingStore(
    (state) => ({
      hasActiveBoost: state.hasActiveBoost,
      consumeBoost: state.consumeBoost,
    }),
  );

  const wrappedFunction = useCallback(
    (...args: Parameters<T>): ReturnType<T> => {
      // Check for the boost and consume it if active
      if (hasActiveBoost(boostId)) {
        consumeBoost(boostId);
        console.log(`Consumed single-use boost: ${boostId}`);
      }

      // Execute the original tool function
      return toolFunction(...args);
    },
    [boostId, toolFunction, hasActiveBoost, consumeBoost]
  );

  return wrappedFunction;
}