// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Provide a minimal mock for canvas getContext to avoid jsdom not-implemented errors
// Tests that rely on rendering will still work; rendering code should guard against null contexts.
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
	value: function () { return null; },
});
