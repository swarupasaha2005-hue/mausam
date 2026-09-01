import { createElement } from 'react';
import { act, create } from 'react-test-renderer';
import { PersonalizationError, PERSONAS } from '@cloud6/shared';
import Profile from '../../../app/profile';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/profile',
}));

jest.mock('../../hooks/usePersonalization', () => ({
  usePersonalization: jest.fn(),
}));

import { usePersonalization } from '../../hooks/usePersonalization';

const mockedUsePersonalization = jest.mocked(usePersonalization);

function emptyHookResult(overrides: Partial<ReturnType<typeof usePersonalization>> = {}) {
  return {
    persona: 'runner' as const,
    preferredTimeOfDay: 'flexible' as const,
    activities: [],
    context: {
      persona: 'runner' as const,
      activities: [],
      preferredTimeOfDay: 'flexible' as const,
      weatherPriorities: ['temperature', 'uv'] as const,
    },
    loading: false,
    error: null,
    setPersona: jest.fn(),
    setPreferredTimeOfDay: jest.fn(),
    setActivities: jest.fn(),
    ...overrides,
  } as ReturnType<typeof usePersonalization>;
}

function renderJson() {
  let root: ReturnType<typeof create>;
  act(() => {
    root = create(createElement(Profile));
  });
  return root!;
}

function collectStrings(json: unknown, out: string[]): void {
  if (json == null) return;
  if (typeof json === 'string' || typeof json === 'number') {
    out.push(String(json));
    return;
  }
  if (Array.isArray(json)) {
    json.forEach((child) => collectStrings(child, out));
    return;
  }
  if (typeof json === 'object' && 'children' in (json as Record<string, unknown>)) {
    collectStrings((json as { children: unknown }).children, out);
  }
}

function textContains(root: ReturnType<typeof create>, needle: string): boolean {
  const strings: string[] = [];
  collectStrings(root.toJSON(), strings);
  return strings.join('').includes(needle) || strings.some((s) => s.includes(needle));
}

function instanceText(instance: import('react-test-renderer').ReactTestInstance): string {
  const parts: string[] = [];
  const walk = (node: import('react-test-renderer').ReactTestInstance | string) => {
    if (typeof node === 'string') {
      parts.push(node);
      return;
    }
    node.children.forEach(walk);
  };
  walk(instance);
  return parts.join('');
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Profile screen', () => {
  it('renders without crashing', () => {
    mockedUsePersonalization.mockReturnValue(emptyHookResult());
    const root = renderJson();
    expect(textContains(root, 'Profile')).toBe(true);
  });

  it('renders the profile header', () => {
    mockedUsePersonalization.mockReturnValue(emptyHookResult());
    const root = renderJson();
    expect(textContains(root, 'Make CLOUD6 work for you.')).toBe(true);
  });

  it('renders all personas from the shared PERSONAS enumeration', () => {
    mockedUsePersonalization.mockReturnValue(emptyHookResult());
    const root = renderJson();
    for (const persona of PERSONAS) {
      expect(() => root.root.findByProps({ accessibilityLabel: `${labelFor(persona)} persona` })).not.toThrow();
    }
  });

  it('selecting a persona calls setPersona', () => {
    const setPersona = jest.fn();
    mockedUsePersonalization.mockReturnValue(emptyHookResult({ setPersona }));
    const root = renderJson();
    const option = root.root.findByProps({ accessibilityLabel: 'Commuter persona' });
    act(() => {
      option.props.onPress();
    });
    expect(setPersona).toHaveBeenCalledWith('commuter');
  });

  it('shows the selected persona as selected', () => {
    mockedUsePersonalization.mockReturnValue(emptyHookResult({ persona: 'commuter' }));
    const root = renderJson();
    const option = root.root.findByProps({ accessibilityLabel: 'Commuter persona' });
    expect(option.props.accessibilityState.selected).toBe(true);
  });

  it('renders the selected persona description', () => {
    mockedUsePersonalization.mockReturnValue(emptyHookResult({ persona: 'runner' }));
    const root = renderJson();
    expect(textContains(root, 'Get insights about heat, rain, UV')).toBe(true);
  });

  it('renders time-of-day options', () => {
    mockedUsePersonalization.mockReturnValue(emptyHookResult());
    const root = renderJson();
    expect(() => root.root.findByProps({ accessibilityLabel: 'Morning time of day' })).not.toThrow();
    expect(() => root.root.findByProps({ accessibilityLabel: 'Flexible time of day' })).not.toThrow();
  });

  it('selecting a time of day calls setPreferredTimeOfDay', () => {
    const setPreferredTimeOfDay = jest.fn();
    mockedUsePersonalization.mockReturnValue(emptyHookResult({ setPreferredTimeOfDay }));
    const root = renderJson();
    const option = root.root.findByProps({ accessibilityLabel: 'Morning time of day' });
    act(() => {
      option.props.onPress();
    });
    expect(setPreferredTimeOfDay).toHaveBeenCalledWith('morning');
  });

  it('renders activity options', () => {
    mockedUsePersonalization.mockReturnValue(emptyHookResult());
    const root = renderJson();
    expect(() => root.root.findByProps({ accessibilityLabel: 'Running activity' })).not.toThrow();
  });

  it('selecting an activity calls setActivities', () => {
    const setActivities = jest.fn();
    mockedUsePersonalization.mockReturnValue(emptyHookResult({ setActivities, activities: [] }));
    const root = renderJson();
    const option = root.root.findByProps({ accessibilityLabel: 'Running activity' });
    act(() => {
      option.props.onPress();
    });
    expect(setActivities).toHaveBeenCalledWith(['running']);
  });

  it('renders weather priorities from the UserContext', () => {
    mockedUsePersonalization.mockReturnValue(
      emptyHookResult({
        context: {
          persona: 'runner',
          activities: [],
          preferredTimeOfDay: 'flexible',
          weatherPriorities: ['temperature', 'uv'],
        },
      }),
    );
    const root = renderJson();
    expect(textContains(root, 'Temperature')).toBe(true);
    expect(textContains(root, 'UV')).toBe(true);
  });

  it('shows the loading state', () => {
    mockedUsePersonalization.mockReturnValue(emptyHookResult({ loading: true }));
    const root = renderJson();
    expect(textContains(root, 'Loading your preferences...')).toBe(true);
  });

  it('shows the error state', () => {
    mockedUsePersonalization.mockReturnValue(
      emptyHookResult({ error: new PersonalizationError('PERSONA_INVALID'), context: null }),
    );
    const root = renderJson();
    expect(textContains(root, "Couldn't update your preferences.")).toBe(true);
  });

  it('shows a subtle success state after an update', () => {
    mockedUsePersonalization.mockReturnValue(emptyHookResult());
    const root = renderJson();
    expect(textContains(root, 'Preferences updated')).toBe(true);
  });

  it('navigates to /journey when the Journey CTA is pressed', () => {
    mockedUsePersonalization.mockReturnValue(emptyHookResult());
    const root = renderJson();
    const button = root.root.findAll(
      (node) => typeof node.props.onPress === 'function' && instanceText(node).includes('Plan a Journey'),
    )[0];
    act(() => {
      button.props.onPress();
    });
    expect(mockPush).toHaveBeenCalledWith('/journey');
  });

  it('renders the bottom navigation with Profile active', () => {
    mockedUsePersonalization.mockReturnValue(emptyHookResult());
    const root = renderJson();
    expect(() => root.root.findByProps({ accessibilityLabel: 'Home tab' })).not.toThrow();
    expect(() => root.root.findByProps({ accessibilityLabel: 'Journey tab' })).not.toThrow();
    expect(() => root.root.findByProps({ accessibilityLabel: 'Weather tab' })).not.toThrow();
    expect(() => root.root.findByProps({ accessibilityLabel: 'Profile tab' })).not.toThrow();
  });

  it('renders the About CLOUD6 section', () => {
    mockedUsePersonalization.mockReturnValue(emptyHookResult());
    const root = renderJson();
    expect(textContains(root, 'ABOUT CLOUD6')).toBe(true);
    expect(textContains(root, 'Version 1.0 · Prototype')).toBe(true);
  });
});

function labelFor(persona: string): string {
  return persona
    .split('_')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');
}
