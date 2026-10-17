# React Review Checklist

- Hooks run unconditionally at component top level. Effects synchronize with external
  systems; derived values stay in render and user actions stay in event handlers.
- Dependency arrays reflect actual captured values; subscriptions, timers and requests
  clean up correctly. Async results cannot overwrite newer state after a race/unmount.
- State updates preserve immutability and use functional updates when based on prior
  state. List keys represent stable identity; component definitions preserve identity.
- Server/client boundaries and browser-only APIs match the framework. Authorization
  occurs on the server; caches cannot leak one user's data into another user's view.
- Forms have labels, controls have names, focus is visible, and native interactive
  elements support keyboard use. Loading, empty, error and disabled states work.
- TypeScript types describe real inputs and outputs. Check nullability and avoid
  assertions or broad any types that conceal a mismatched contract.
- Independent requests run concurrently when safe. Avoid unnecessary client JavaScript,
  subscriptions and serial work. Add memoization only for a demonstrated cost or stable
  identity contract. Preserve the project's styling/component system.
- Run relevant type/build/tests and inspect the actual changed user flow. A clean
  static checklist alone is not browser verification or a performance measurement.
