# Page Topology

## Global layers

1. Dala header, navigation, and mobile menu.
2. Dala site loader and navigation transition mask.
3. `[asscroll-container] > main` with Ming Ma's content mapped into the original section hooks.
4. One fixed Dala WebGL canvas rendering the native robot and all later shapes.

## Section order

| Order | Original Dala structure | Ming Ma content |
| --- | --- | --- |
| 1 | Landing | Politics / public services / AI, portrait, affiliation, ERC project, research statement |
| 2 | Introduction | Detailed biography, technology, institutions, decisions, and contestability |
| 3 | Problem narrative | Administrative encounters → AI decisions → cross-border narratives |
| 4 | Manifesto | AI in public life and administrative service encounters |
| 5 | Manifesto | Authoritarian narratives, generative AI, and methods |
| 6 | Team carousel | Three current research projects |
| 7 | Investors grid | Five short publication labels with WebGL pyramids |
| 8 | Collapsed archive | Seven complete article titles, book chapter, and working paper |
| 9 | Footer | Email, CV, social link, copyright |

The original seven `.js-section` runtime boundaries remain intact so Dala's hard-coded particle transition thresholds continue to match the scroll narrative.
