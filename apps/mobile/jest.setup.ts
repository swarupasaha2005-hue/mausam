// jest-expo doesn't configure the React 19 concurrent act() environment by
// default; @testing-library/react-native needs it set explicitly.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
