import { PersonalizationError } from '@cloud6/shared';
import { usePersonalization } from './usePersonalization';
import { personalizationService } from '../services/personalization';
import { act, flush, renderHook } from '../test-utils/renderHook';

jest.mock('../services/personalization', () => ({
  personalizationService: {
    createUserContext: jest.fn(),
  },
}));

const mockedService = jest.mocked(personalizationService);

beforeEach(() => {
  jest.clearAllMocks();
});

describe('usePersonalization', () => {
  it('fetches a context for the default persona/time on mount', async () => {
    mockedService.createUserContext.mockResolvedValue({
      persona: 'runner',
      activities: ['running'],
      preferredTimeOfDay: 'flexible',
      weatherPriorities: ['temperature'],
    });

    const { result } = renderHook(() => usePersonalization());
    await flush();

    expect(mockedService.createUserContext).toHaveBeenCalledWith({
      persona: 'runner',
      preferredTimeOfDay: 'flexible',
    });
    expect(result.current.context?.persona).toBe('runner');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('refetches the context when the persona changes', async () => {
    mockedService.createUserContext.mockResolvedValue({
      persona: 'commuter',
      activities: ['commuting'],
      preferredTimeOfDay: 'flexible',
      weatherPriorities: ['wind'],
    });

    const { result } = renderHook(() => usePersonalization());
    await flush();

    act(() => {
      result.current.setPersona('commuter');
    });
    await flush();

    expect(mockedService.createUserContext).toHaveBeenCalledWith({
      persona: 'commuter',
      preferredTimeOfDay: 'flexible',
    });
    expect(result.current.context?.weatherPriorities).toEqual(['wind']);
  });

  it('refetches the context when preferred time changes', async () => {
    mockedService.createUserContext.mockResolvedValue({
      persona: 'runner',
      activities: ['running'],
      preferredTimeOfDay: 'morning',
      weatherPriorities: ['temperature'],
    });

    const { result } = renderHook(() => usePersonalization());
    await flush();

    act(() => {
      result.current.setPreferredTimeOfDay('morning');
    });
    await flush();

    expect(mockedService.createUserContext).toHaveBeenLastCalledWith({
      persona: 'runner',
      preferredTimeOfDay: 'morning',
    });
  });

  it('surfaces a PersonalizationError without crashing', async () => {
    mockedService.createUserContext.mockRejectedValue(new PersonalizationError('PERSONA_INVALID'));

    const { result } = renderHook(() => usePersonalization());
    await flush();

    expect(result.current.loading).toBe(false);
    expect(result.current.context).toBeNull();
    expect(result.current.error).toBeInstanceOf(PersonalizationError);
  });
});
