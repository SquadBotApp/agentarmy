import { usePlanStore } from '../store/planStore';

describe('planStore', () => {
  beforeEach(() => {
    // Reset store state and timers before each test
    usePlanStore.setState({
      usage: {
        tasksToday: 0,
        tasksThisMonth: 0,
        toolsUsed: [],
        peakConcurrency: 0,
        totalOrchestrations: 0,
        timeSavedMinutes: 0,
        lastActiveDate: '2023-01-01',
      },
    });
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    localStorage.clear();
  });

  it('increments tasks correctly on the same day', () => {
    jest.setSystemTime(new Date('2023-01-01T12:00:00Z'));
    
    usePlanStore.getState().recordTaskUsage();
    expect(usePlanStore.getState().usage.tasksToday).toBe(1);
    expect(usePlanStore.getState().usage.tasksThisMonth).toBe(1);

    usePlanStore.getState().recordTaskUsage();
    expect(usePlanStore.getState().usage.tasksToday).toBe(2);
    expect(usePlanStore.getState().usage.tasksThisMonth).toBe(2);
  });

  it('resets daily tasks when date changes', () => {
    jest.setSystemTime(new Date('2023-01-01T12:00:00Z'));
    usePlanStore.getState().recordTaskUsage();
    expect(usePlanStore.getState().usage.tasksToday).toBe(1);

    // Advance to next day
    jest.setSystemTime(new Date('2023-01-02T12:00:00Z'));
    
    usePlanStore.getState().recordTaskUsage();
    
    // Daily count should reset to 1 (0 + 1 for the new task)
    expect(usePlanStore.getState().usage.tasksToday).toBe(1);
    // Monthly count should accumulate
    expect(usePlanStore.getState().usage.tasksThisMonth).toBe(2);
    expect(usePlanStore.getState().usage.lastActiveDate).toBe('2023-01-02');
  });

  it('resets monthly tasks when month changes', () => {
    jest.setSystemTime(new Date('2023-01-31T12:00:00Z'));
    usePlanStore.getState().recordTaskUsage();
    expect(usePlanStore.getState().usage.tasksToday).toBe(1);
    expect(usePlanStore.getState().usage.tasksThisMonth).toBe(1);

    // Advance to next month
    jest.setSystemTime(new Date('2023-02-01T12:00:00Z'));
    
    usePlanStore.getState().recordTaskUsage();
    
    expect(usePlanStore.getState().usage.tasksToday).toBe(1);
    expect(usePlanStore.getState().usage.tasksThisMonth).toBe(1);
    expect(usePlanStore.getState().usage.lastActiveDate).toBe('2023-02-01');
  });
});