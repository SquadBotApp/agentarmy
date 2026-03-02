import { renderHook, act } from '@testing-library/react';
import { useBoostConsumer } from './useBoostConsumer';
import { usePricingStore, BoostId } from './pricingStore';

// Mock the pricingStore module (sibling path)
jest.mock('./pricingStore');

// Type assertion for the mocked store hook
const mockedUsePricingStore = usePricingStore as unknown as jest.Mock;

describe('useBoostConsumer', () => {
  const mockToolFunction = jest.fn((...args: any[]) => `tool executed with ${args.join(', ')}`);
  const mockConsumeBoost = jest.fn();
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

  beforeEach(() => {
    mockToolFunction.mockClear();
    mockConsumeBoost.mockClear();
    mockedUsePricingStore.mockClear();
    consoleSpy.mockClear();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  // ---------------------------------------------------------------
  // Core behavior
  // ---------------------------------------------------------------

  it('should NOT consume the boost when it is not active, but still call the tool', () => {
    mockedUsePricingStore.mockImplementation((selector: any) =>
      selector({
        hasActiveBoost: (_id: BoostId) => false,
        consumeBoost: mockConsumeBoost,
      }),
    );

    const { result } = renderHook(() => useBoostConsumer('tool_swarm', mockToolFunction));

    act(() => {
      result.current('arg1', 2);
    });

    expect(mockConsumeBoost).not.toHaveBeenCalled();
    expect(mockToolFunction).toHaveBeenCalledTimes(1);
    expect(mockToolFunction).toHaveBeenCalledWith('arg1', 2);
  });

  it('should consume the boost AND call the tool when the boost is active', () => {
    mockedUsePricingStore.mockImplementation((selector: any) =>
      selector({
        hasActiveBoost: (id: BoostId) => id === 'tool_swarm',
        consumeBoost: mockConsumeBoost,
      }),
    );

    const { result } = renderHook(() => useBoostConsumer('tool_swarm', mockToolFunction));

    act(() => {
      result.current('arg1', 2);
    });

    expect(mockConsumeBoost).toHaveBeenCalledTimes(1);
    expect(mockConsumeBoost).toHaveBeenCalledWith('tool_swarm');
    expect(mockToolFunction).toHaveBeenCalledTimes(1);
    expect(mockToolFunction).toHaveBeenCalledWith('arg1', 2);
  });

  it('should pass through arguments and return the result of the original function', () => {
    mockedUsePricingStore.mockImplementation((selector: any) =>
      selector({ hasActiveBoost: () => true, consumeBoost: mockConsumeBoost }),
    );

    // Use a fresh fn with explicit return to avoid mockClear side-effects
    const returningFn = jest.fn((...args: any[]) => `result: ${args.join('+')}`);
    const { result } = renderHook(() => useBoostConsumer('tool_swarm', returningFn));

    const toolResult = result.current('hello', 'world');

    expect(returningFn).toHaveBeenCalledWith('hello', 'world');
    expect(toolResult).toBe('result: hello+world');
  });

  // ---------------------------------------------------------------
  // Boost-ID specificity
  // ---------------------------------------------------------------

  it('should only consume the exact boostId passed to the hook', () => {
    // hasActiveBoost returns true for parallelism_surge but NOT tool_swarm
    mockedUsePricingStore.mockImplementation((selector: any) =>
      selector({
        hasActiveBoost: (id: BoostId) => id === 'parallelism_surge',
        consumeBoost: mockConsumeBoost,
      }),
    );

    const { result } = renderHook(() => useBoostConsumer('tool_swarm', mockToolFunction));

    act(() => {
      result.current();
    });

    // tool_swarm is not active → should NOT consume
    expect(mockConsumeBoost).not.toHaveBeenCalled();
    expect(mockToolFunction).toHaveBeenCalledTimes(1);
  });

  it('should consume parallelism_surge when that specific boost is active', () => {
    mockedUsePricingStore.mockImplementation((selector: any) =>
      selector({
        hasActiveBoost: (id: BoostId) => id === 'parallelism_surge',
        consumeBoost: mockConsumeBoost,
      }),
    );

    const { result } = renderHook(() =>
      useBoostConsumer('parallelism_surge', mockToolFunction),
    );

    act(() => {
      result.current();
    });

    expect(mockConsumeBoost).toHaveBeenCalledWith('parallelism_surge');
    expect(mockToolFunction).toHaveBeenCalledTimes(1);
  });

  // ---------------------------------------------------------------
  // Console logging
  // ---------------------------------------------------------------

  it('should log a message when a boost is consumed', () => {
    mockedUsePricingStore.mockImplementation((selector: any) =>
      selector({
        hasActiveBoost: () => true,
        consumeBoost: mockConsumeBoost,
      }),
    );

    const { result } = renderHook(() => useBoostConsumer('tool_swarm', mockToolFunction));

    act(() => {
      result.current();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Consumed single-use boost: tool_swarm');
  });

  it('should NOT log when the boost is not active', () => {
    mockedUsePricingStore.mockImplementation((selector: any) =>
      selector({
        hasActiveBoost: () => false,
        consumeBoost: mockConsumeBoost,
      }),
    );

    const { result } = renderHook(() => useBoostConsumer('memory_burst', mockToolFunction));

    act(() => {
      result.current();
    });

    expect(consoleSpy).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------
  // Zero-arg and multi-arg functions
  // ---------------------------------------------------------------

  it('should work with a zero-argument tool function', () => {
    const noArgFn = jest.fn(() => 42);
    mockedUsePricingStore.mockImplementation((selector: any) =>
      selector({ hasActiveBoost: () => false, consumeBoost: mockConsumeBoost }),
    );

    const { result } = renderHook(() => useBoostConsumer('tool_swarm', noArgFn));

    let ret: number | undefined;
    act(() => {
      ret = result.current();
    });

    expect(noArgFn).toHaveBeenCalledTimes(1);
    expect(ret).toBe(42);
  });

  // ---------------------------------------------------------------
  // Multiple invocations
  // ---------------------------------------------------------------

  it('should consume the boost on every call while the boost remains active', () => {
    mockedUsePricingStore.mockImplementation((selector: any) =>
      selector({
        hasActiveBoost: () => true,
        consumeBoost: mockConsumeBoost,
      }),
    );

    const { result } = renderHook(() => useBoostConsumer('tool_swarm', mockToolFunction));

    act(() => {
      result.current('a');
      result.current('b');
      result.current('c');
    });

    expect(mockConsumeBoost).toHaveBeenCalledTimes(3);
    expect(mockToolFunction).toHaveBeenCalledTimes(3);
  });

  // ---------------------------------------------------------------
  // Referential stability
  // ---------------------------------------------------------------

  it('should return a function that behaves identically across re-renders', () => {
    mockedUsePricingStore.mockImplementation((selector: any) =>
      selector({ hasActiveBoost: () => false, consumeBoost: mockConsumeBoost }),
    );

    const { result, rerender } = renderHook(() =>
      useBoostConsumer('tool_swarm', mockToolFunction),
    );

    const firstResult = result.current('test');
    rerender();
    const secondResult = result.current('test');

    // Both invocations should delegate to the same underlying tool
    expect(firstResult).toBe(secondResult);
    expect(mockToolFunction).toHaveBeenCalledTimes(2);
  });
});