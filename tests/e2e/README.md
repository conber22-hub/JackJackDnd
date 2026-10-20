# Browser tests

Use Node 20 or newer. Install dependencies and Chromium once:

```sh
npm ci
npx playwright install chromium
```

On a Linux CI image without browser system libraries, use
`npx playwright install --with-deps chromium` instead.

```sh
npm run e2e
```

Playwright runs `npm run build`, then serves **only the built
`dread-delve.html`** at `http://127.0.0.1:4173/dread-delve.html`. It also starts
a local PeerJS signalling server on port 9000. Both ports must be free.
The multiplayer test uses two isolated browser contexts and real PeerJS/WebRTC
data channels; it does not need a public PeerJS relay or mock the transport.
Playwright stops both servers when the run ends.

The tests cover DM startup, adding heroes, party following, a bent mini drag,
an opportunity attack answered with Strike and resumed walking, Dash and Undo
move, hosting/joining and movement synchronisation, and all five Castle Ravenloft
floors. Setup uses `window.DreadDelve` to import a small, repeatable arena.
Position assertions poll for `DreadDelve.busy() === false` and the expected
positions together, including delayed followers and opportunity-attack
continuations. Pointer coordinates are projected through the app's camera.

Chromium runs at low graphics quality with software WebGL support for headless
machines. Tests use fresh browser storage, one worker, and no automatic retries.
External Google Fonts requests are blocked; the app uses its fallback fonts.
Uncaught browser errors fail the tests.
This suite checks behaviour, not pixel-perfect rendering or public-relay/NAT
connectivity.

Useful commands:

```sh
npm run e2e -- --headed
npm run e2e -- --grep "Strike"
npx playwright show-report
```

Failures retain screenshots and traces in `test-results/`; the HTML report is in
`playwright-report/`. Both are ignored by Git. The build may update
`dread-delve.html`; do not include it in test PRs.
