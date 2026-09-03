import { createElement } from 'react';
import { act, create } from 'react-test-renderer';
import { DestinationResult } from './DestinationResult';

describe('DestinationResult', () => {
  it('wires its Pressable to onPressIn, not onPress', () => {
    const onPress = jest.fn();
    let root: ReturnType<typeof create>;
    act(() => {
      root = create(createElement(DestinationResult, { label: 'Salt Lake, Kolkata', onPress }));
    });

    // Found via its accessibilityRole rather than findByType(Pressable) —
    // react-native-web's Pressable renders through internal wrapper
    // layers, so matching by the prop we actually care about is more
    // reliable than matching by component reference.
    const [pressable] = root!.root.findAll(
      (node) => node.props.accessibilityRole === 'button' && typeof node.props.style === 'function',
    );
    // On web, clicking this row while the search TextInput still has
    // focus blurs it on mousedown, before mouseup/click completes —
    // onPress (which only fires on a matched press-in/press-out pair)
    // can silently never fire. onPressIn fires at press-start, before
    // that race window opens, so selection must go through it instead.
    expect(typeof pressable.props.onPressIn).toBe('function');
    expect(pressable.props.onPress).toBeUndefined();

    act(() => {
      pressable.props.onPressIn();
    });
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
