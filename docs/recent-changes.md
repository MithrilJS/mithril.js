
# Release v2.3.8

### Patch Changes

#### [refactor execSelector (@kfule)](https://github.com/MithrilJS/mithril.js/pull/3056)


#### [Make `vnode.domSize` assignment consistent between create and update. (@kfule)](https://github.com/MithrilJS/mithril.js/pull/3055)

This PR makes the code and behavior of create and update processes more consistent.
#### [Bump rimraf from 6.0.1 to 6.1.0 in the normal group (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/3054)

Bumps the normal group with 1 update: [rimraf](https://github.com/isaacs/rimraf).  Updates `rimraf` from 6.0.1 to 6.1.0.  Changelog.  Sourced from rimraf's changelog.
#### [Fix URI decoder bug and reduce bundle size through module tailoring and cleanup (@kfule)](https://github.com/MithrilJS/mithril.js/pull/3050)

This fixes the URI decoder used in the Router to decode more strictly.
#### [refactor `Vnode.normalizeChildren` (@kfule)](https://github.com/MithrilJS/mithril.js/pull/3052)

`Vnode.normalizeChildren` now preallocates the array length and performs key-consistency checks after normalization.
#### [Bump actions/setup-node from 5 to 6 in the normal group (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/3053)

Bumps the normal group with 1 update: [actions/setup-node](https://github.com/actions/setup-node).  Updates `actions/setup-node` from 5 to 6.  Release notes.
#### [Bump actions/setup-node from 4 to 5 in the normal group (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/3047)

Bumps the normal group with 1 update: [actions/setup-node](https://github.com/actions/setup-node).  Updates `actions/setup-node` from 4 to 5.  Release notes.
#### [docs: edited the link to the build badge (@Olexandr88)](https://github.com/MithrilJS/mithril.js/pull/3045)

# Release v2.3.7

### Patch Changes

#### [Make the attrs of non-element vnodes always non-null. (@kfule)](https://github.com/MithrilJS/mithril.js/pull/3042)

In #3041, it seemed that the case of non-element vnodes was not fully considered in terms of not breaking existing behavior.

# Release v2.3.6

### Patch Changes

#### [Make the attrs of non-element vnodes always non-null. (@kfule)](https://github.com/MithrilJS/mithril.js/pull/3042)

In #3041, it seemed that the case of non-element vnodes was not fully considered in terms of not breaking existing behavior.

# Release v2.3.5

### Patch Changes

#### [Assorted Performance Improvements (@kfule)](https://github.com/MithrilJS/mithril.js/pull/3041)

This PR improves performance through the following changes: Adoption of the spread syntax, which can be optimized in modern browsers.
#### [Bump actions/checkout from 4 to 5 in the normal group (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/3039)

Bumps the normal group with 1 update: [actions/checkout](https://github.com/actions/checkout).  Updates `actions/checkout` from 4 to 5.  Release notes.

# Release v2.3.4

### Patch Changes

#### [Fix the error message selection condition (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/3037)

The previous condition was basically "if this is non-nullish or a boolean".  That "or a boolean" is very obviously redundant.
#### [bundler: fix mangled comments and double suffixes (@kfule)](https://github.com/MithrilJS/mithril.js/pull/3032)

This PR removes unnecessary suffixes from comments in the bundle file.  It also fixes the strange double suffix (`mountRedraw00`).

# Release v2.3.3

### Patch Changes

#### [router: delay mounting RouterRoot until the first route is resolved (fixes #2621) (@kfule)](https://github.com/MithrilJS/mithril.js/pull/3030)

This PR delays the initial mounting of the router component until after the route has been resolved.
#### [Bump glob from 11.0.2 to 11.0.3 in the normal group (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/3029)

Bumps the normal group with 1 update: [glob](https://github.com/isaacs/node-glob).  Updates `glob` from 11.0.2 to 11.0.3.  Commits.  af2e7ce 11.0.3.

# Release v2.3.2

### Patch Changes

#### [Refactor router, fixes #2505 and #2778 (@kfule)](https://github.com/MithrilJS/mithril.js/pull/3027)

This PR refactors the router code to fix two issues (#2505 and #2778).

# Release v2.3.1

### Patch Changes

#### [set trailing slash optional in route matching (@touletan)](https://github.com/MithrilJS/mithril.js/pull/3025)

Regexp has been updated to set trailing slash as optional in route matching.  link to issue 3024.  New test has been added.

# Release v2.3.0

### Minor Changes

#### [feat: Make redraws when Promises returned by event handlers are completed (@kfule)](https://github.com/MithrilJS/mithril.js/pull/3020)

This PR allows redraw on completion of the async event handler.  This PR makes redraws when Promises returned by event handlers are completed.
   
### Patch Changes

#### [Allow additional async redraw even if the first redraw is skipped (@kfule)](https://github.com/MithrilJS/mithril.js/pull/3021)

This PR allows asynchronous redraw processing even if the first redraw is skipped by setting `event.redraw=false` before await in the async function.
#### [Bump glob from 11.0.1 to 11.0.2 in the normal group (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/3019)

Bumps the normal group with 1 update: [glob](https://github.com/isaacs/node-glob).  Updates `glob` from 11.0.1 to 11.0.2.  Commits.  fd61f24 11.0.2.
#### [Fix badge for build status (@kfule)](https://github.com/MithrilJS/mithril.js/pull/3015)

The URL for the Shields.io badge for build status has been corrected.

# Release v2.2.15

### Patch Changes

#### [[refactor] Limit the condition of the option tag to `selected` attribute in isFormAttribute() (@kfule)](https://github.com/MithrilJS/mithril.js/pull/3011)

This PR limits the evaluation of whether a tag is `option` to only when setting the `selected` attribute.
#### [test-perf: Load Benckmark.js first in Node.js (@kfule)](https://github.com/MithrilJS/mithril.js/pull/3008)

Since Node21, global.navigator has been implemented, and together with browserMock, Benchmark.js incorrectly identifies the execution environment as a browser.

# Release v2.2.14

### Patch Changes

#### [Improve handling of is-elements and Fix tiny bugs of setAttr()/updateStyle() (@kfule)](https://github.com/MithrilJS/mithril.js/pull/2988)

Fixes a few tiny bugs in attributes and style properties updates, and improves handling of is-elements in updateNode().
#### [domFor: always get generation from delayedRemoval instead of parameter (@kfule)](https://github.com/MithrilJS/mithril.js/pull/3007)

The `generation` of domFor is no longer passed as a parameter.  This allows domFor to work well in onbeforeremove and onremove and reduces the amount of code.
#### [render: wrap stateResult and attrsResult in Promise.resolve(), fix #2592 (@kfule)](https://github.com/MithrilJS/mithril.js/pull/3005)

This PR wraps the return value of onbeforeremove in Promise.resolve().  This ensures that thenable objects are also always processed asynchronously.  fix #2592.

# Release v2.2.13

### Patch Changes

#### [Fix form checkValidity(), remove vnode.dom === .activeElement from setAttr() (Continued from #2257) (@kfule)](https://github.com/MithrilJS/mithril.js/pull/3002)

Remove vnode.dom === activeElement(vnode.dom) from setAttribute() to fix validityCheck(), to fix https://github.com/MithrilJS/mithril.js/issues/2256.
#### [Bump glob from 11.0.0 to 11.0.1 in the normal group (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/3001)

Bumps the normal group with 1 update: [glob](https://github.com/isaacs/node-glob).  Updates `glob` from 11.0.0 to 11.0.1.  Commits.  148ef61 11.0.1.

# Release v2.2.12

### Patch Changes

#### [disable Terser's "reduce_funcs" option for performance (@kfule)](https://github.com/MithrilJS/mithril.js/pull/3000)

Terser's  “reduce_funcs” option seems to degrade performance.  So, disable it.
#### [Bump chokidar from 4.0.1 to 4.0.3 in the normal group across 1 directory (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2998)

Bumps the normal group with 1 update in the / directory: [chokidar](https://github.com/paulmillr/chokidar).  Updates `chokidar` from 4.0.1 to 4.0.3.  Release notes.

# Release v2.2.11

### Patch Changes

#### [Use new pr-release prerelease hook (Fixes #2987) (@JAForbes)](https://github.com/MithrilJS/mithril.js/pull/2996)

Per @dead-claudia's suggestion, pr-release now allows you to invoke a custom command before creating the github release.
#### [updateStyle(): use setProperty() when css vars and dashed-properties, fixes #2989 (@kfule)](https://github.com/MithrilJS/mithril.js/pull/2991)

This PR changes updateStyle() to use setProperty() for dashed-properties.  This PR maybe fixes #2989.
#### [Delete .github/ISSUE_TEMPLATE/0-docs.yml (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/2993)

Do a much better job discouraging filing docs bugs here.

# Release v2.2.10

### Patch Changes

#### [[refactor] Performance improvement of updateStyle() (@kfule)](https://github.com/MithrilJS/mithril.js/pull/2985)

This is a refactoring to improve the performance of `updateStyle()`.

# Release v2.2.9

### Patch Changes

#### [[refactor] Refactoring of hyperscript.js and render.js, including performance improvements (@kfule)](https://github.com/MithrilJS/mithril.js/pull/2983)

Refactor hyperscript.js and render.js.  In particular, the replacement of fix #2622 appears to have significantly improved the performance regression.

# Release v2.2.8

### Patch Changes

#### [m.domFor(): workaround for unintentional mangling. Fix #2842 (@kfule)](https://github.com/MithrilJS/mithril.js/pull/2981)

Refactoring of domFor() for the internal bundler.  https://github.com/MithrilJS/mithril.js/blob/cfa890f68571df1ab8543097f7fa61c34ee93683/mithril.js#L157.
#### [Drop Istanbul to kill install warnings (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/2979)

Title's pretty self-explanatory.  Also, this isn't really used much in practice.  From a local run: ```.  $ npm ci.

# Release v2.2.7

### Patch Changes

#### [m.domFor(): workaround for unintentional mangling. Fix #2842 (@kfule)](https://github.com/MithrilJS/mithril.js/pull/2981)

Refactoring of domFor() for the internal bundler.  https://github.com/MithrilJS/mithril.js/blob/cfa890f68571df1ab8543097f7fa61c34ee93683/mithril.js#L157.
#### [Drop Istanbul to kill install warnings (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/2979)

Title's pretty self-explanatory.  Also, this isn't really used much in practice.  From a local run: ```.  $ npm ci.

# Release v2.2.6

### Patch Changes

#### [m.domFor(): workaround for unintentional mangling. Fix #2842 (@kfule)](https://github.com/MithrilJS/mithril.js/pull/2981)

Refactoring of domFor() for the internal bundler.  https://github.com/MithrilJS/mithril.js/blob/cfa890f68571df1ab8543097f7fa61c34ee93683/mithril.js#L157.
#### [Drop Istanbul to kill install warnings (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/2979)

Title's pretty self-explanatory.  Also, this isn't really used much in practice.  From a local run: ```.  $ npm ci.

# Release v2.2.5

### Patch Changes

#### [Bump the normal group across 1 directory with 2 updates (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2976)

Bumps the normal group with 2 updates in the / directory: [chokidar](https://github.com/paulmillr/chokidar) and [eslint](https://github.com/eslint/eslint).
#### [Cleaning up code by making vnode.attrs always non-null (@kfule)](https://github.com/MithrilJS/mithril.js/pull/2977)

Commit f9e5163 made vnode.attrs always non-null, so there is no need for code to make vnode.attrs null or assume vnode.attrs is null.

# Release v2.2.4

### Patch Changes

#### [Bump gh-pages from 2.1.1 to 5.0.0 (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2890)

Bumps [gh-pages](https://github.com/tschaub/gh-pages) from 2.1.1 to 5.0.0.  Release notes.  Sourced from gh-pages's releases.  v5.0.0.
#### [Bump @babel/parser from 7.7.5 to 7.25.6 (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2959)

Bumps [@babel/parser](https://github.com/babel/babel/tree/HEAD/packages/babel-parser) from 7.7.5 to 7.25.6.  Release notes.  Sourced from @​babel/parser's releases.
#### [Bump minimatch from 3.0.4 to 3.1.2 (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2816)

Bumps [minimatch](https://github.com/isaacs/minimatch) from 3.0.4 to 3.1.2.  Commits.  699c459 3.1.2.  2f2b5ff fix: trim pattern.  25d7c0d 3.1.1.
#### [Bump yaml and lint-staged (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2830)

Bumps [yaml](https://github.com/eemeli/yaml) to 2.2.2 and updates ancestor dependency [lint-staged](https://github.com/okonet/lint-staged).
#### [Bump gh-pages from 5.0.0 to 6.1.1 (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2958)

Bumps [gh-pages](https://github.com/tschaub/gh-pages) from 5.0.0 to 6.1.1.  Release notes.  Sourced from gh-pages's releases.  v6.1.1.  Fixes.
#### [Bump glob from 7.1.4 to 11.0.0 (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2957)

Bumps [glob](https://github.com/isaacs/node-glob) from 7.1.4 to 11.0.0.  Changelog.  Sourced from glob's changelog.  changeglob.  11.0.  Drop support for node before v20.
#### [Bump rimraf from 3.0.2 to 6.0.1 (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2960)

Bumps [rimraf](https://github.com/isaacs/rimraf) from 3.0.2 to 6.0.1.  Changelog.  Sourced from rimraf's changelog.  6.0.  Drop support for nodes before v20.
#### [Bump lint-staged from 13.2.1 to 15.2.10 (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2961)

[//]: # (dependabot-start).  ⚠️  **Dependabot is rebasing this PR** ⚠️.  Rebasing might not happen immediately, so don't worry if this takes some time.
#### [Revise issue templates (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/2955)


#### [Update ospec and a few other dependencies (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/2907)

1.  Update ospec to the version I just published.  2.
#### [Fix some outstanding bugs in the docs linter. (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/2906)

Missed an edge case in the task queue, and I also wanted to fully dedupe network requests.  Locally it passes.
#### [Rewrite docs linter, ease JSFiddle request debugging (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/2904)

I'll defer to the commit descriptions.  They're self-descriptive.  The first diff is quite large.
#### [Update vnodes.md (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/2903)

Fix a broken link.  Did some further digging (it's been a while since I've played with the scripts) and found that the JSFiddle errors are just warnings.
#### [Migrate to Node 20, clean up workflows (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/2902)

**Note: ignore the commits.  It's a mess.  Just read the combined diff - the PR itself is the standalone unit.  I plan to squash this as I merge anyways.**.
#### [Remove dependance on global window and document (@KoryNunn)](https://github.com/MithrilJS/mithril.js/pull/2897)

Use window and document from render target instead of using globals.  This makes unit and intergration testing much easier.
#### [Bump braces from 3.0.2 to 3.0.3 (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2896)

Bumps [braces](https://github.com/micromatch/braces) from 3.0.2 to 3.0.3.  Commits.  74b2db2 3.0.3.  88f1429 update eslint.  lint, fix unit tests.
#### [Tweak docs with warning to fix #2508 (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/2895)

[z] Documentation change.  [z] My change requires a change to the documentation.  [z] I have updated the documentation accordingly.
#### [Bump qs from 6.5.2 to 6.5.3 (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2807)

Bumps [qs](https://github.com/ljharb/qs) from 6.5.2 to 6.5.3.  Changelog.  Sourced from qs's changelog.  6.5.3.  [Fix] parse: ignore __proto__ keys (#428).
#### [Temporarily host REM on fly to fix the docs (@JAForbes)](https://github.com/MithrilJS/mithril.js/pull/2893)

Fixes REM examples in the docs.  The documentation currently has a dead link as REM is no longer hosted on heroku.
#### [Move from individual code owners to just pinging all collaborators (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/2844)

Most collaborators have commit access, and it'd make it a little easier (and more likely) for pull requests to get reviewed.
#### [docs: absolute url in version selector to avoid 404 errors (2 of 2) (@tbreuss)](https://github.com/MithrilJS/mithril.js/pull/2839)

Fixes #2832 (2 of 2 pull requests).  See my comment at https://github.com/MithrilJS/mithril.js/pull/2835#issuecomment-1535657892.
#### [fix markdown editor example, bump marked.js version up (@tbreuss)](https://github.com/MithrilJS/mithril.js/pull/2848)

Fixes the strange behavior of markdown editor example.  Using newest version of marked.js, fixed strange behavior of markdown editor example.  See #2845.
#### [Bump word-wrap from 1.2.3 to 1.2.4 (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2856)

Bumps [word-wrap](https://github.com/jonschlinkert/word-wrap) from 1.2.3 to 1.2.4.  Release notes.  Sourced from word-wrap's releases.  1.2.4.  What's Changed.
#### [Add missing `m.censor` to API navigation (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/2843)

Not sure how I forgot about this when I added the method.
#### [docs: fix regex for parsing page title (@tbreuss)](https://github.com/MithrilJS/mithril.js/pull/2837)

Fixes https://github.com/MithrilJS/mithril.js/issues/2833.  I tested the generated documentation on my dev machine successfully.
#### [docs: fix broken anchor link on github/npm (@tbreuss)](https://github.com/MithrilJS/mithril.js/pull/2838)

Fixed a not working anchor link on github and npm by removing the question mark.
#### [hyperscript: handles shared empty attrs, fixes #2821 (@kfule)](https://github.com/MithrilJS/mithril.js/pull/2822)

Whenever there are selector-derived attrs, the attrs object will be regenerated and not shared.
#### [Fix typos in `stream()` docs (@mtsknn)](https://github.com/MithrilJS/mithril.js/pull/2825)

Noticed these typos while reading through the page.
#### [Bump async from 2.6.3 to 2.6.4 (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2815)

Bumps [async](https://github.com/caolan/async) from 2.6.3 to 2.6.4.  Changelog.  Sourced from async's changelog.  v2.6.4.

# Release v2.2.3

### Patch Changes

#### [Use markdown for the README badges (@pygy)](https://github.com/MithrilJS/mithril.js/pull/2773)

Use markdown for the README badges.

# Release v2.2.2

### Patch Changes

#### [Use markdown for the README badges (@pygy)](https://github.com/MithrilJS/mithril.js/pull/2773)

Use markdown for the README badges.

# Release v2.2.1

### Patch Changes

#### [Move the chat to Zulip (@pygy)](https://github.com/MithrilJS/mithril.js/pull/2771)

This updates the documentation to link to the new Zulip chat room.

# Release v2.2.0

### Minor Changes

#### [m.censor: work around a bunder bug (@kfule)](https://github.com/MithrilJS/mithril.js/pull/2752)

The internal bundler sometimes mangles the words in RegExp literals incorrectly.  Please see below.
#### [Warn about reusing mutated attrs object - fixes #2719 (@StephanHoyer)](https://github.com/MithrilJS/mithril.js/pull/2722)


#### [Send URLSearchParams as request body without extra configuration (@Coteh)](https://github.com/MithrilJS/mithril.js/pull/2695)

This PR fixes an oddity I noticed in the way `m.request` handles `URLSearchParams` object.  It now handles it in the same sort of way XHR and Fetch do it.
#### [Add `params:` to `m.route.Link`, fix docs (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/2537)

Add `params:` to `m.route.Link`.  Minor fix to docs to reflect reality with `m.route.Link`'s `disabled:` attribute.
#### [Allow Mithril to be loaded in non-browser environments without modification (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/2633)

Recast the global reads to all be guarded with `typeof`, so that if they aren't defined, they're just `null`.
#### [Add a `m.Fragment = "["` utility for JSX users. (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/2744)

The title says it all, and the diff's obvious.  Resolves https://github.com/MithrilJS/mithril.js/issues/2640 and probably others.
   
### Patch Changes

#### [Enable --minimize-semver-change for pr-release (@JAForbes)](https://github.com/MithrilJS/mithril.js/pull/2769)

Minimizes semver changes on release to the minimum required version bump to satisfy major/minor/patch semver ranges.  Minimizes the semver change so that.
#### [Clean up m.route.Link (@barneycarroll)](https://github.com/MithrilJS/mithril.js/pull/2768)

An attempt at better demonstrating `m.route.Link` with less text.  Fixes #2767.
#### [Runtime-deprecate ospec, change `change-log` to `changelog`, fix a few assorted bugs (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/2578)

This PR is in two parts: 1.  Revise the build system and some of the local dev setup.  Fully split ospec from the repo, and add it as a dependency.
#### [Add meta description to docs (@StephanHoyer)](https://github.com/MithrilJS/mithril.js/pull/2316)

rework of #2149.  added a meta description parser and meta descriptions to all docs pages.  because google.  built the docs, inspected the output manually.
#### [Fixed badges, consistent naming of Mithril.js (@tbreuss)](https://github.com/MithrilJS/mithril.js/pull/2750)

use consistent naming of Mithril.js.  fix badges in README.  Fixes issue #2749.
#### [Catch malformed URI Components (@jdiderik)](https://github.com/MithrilJS/mithril.js/pull/2711)

Fix for error thrown when a value contains non-valid / malformed URI Component.  Example: test=%c5%a1%e8ZM%80%82H.  will throw "URI malformed".
#### [Correctly handle invalid escapes in routes based on 0a5ead31c9fbd7b153c521c7f9d3df7bf826ce6c (@StephanHoyer)](https://github.com/MithrilJS/mithril.js/pull/2743)

fixes #2061.  @dead-claudia I just redid your change but slightly different in order to handle a mix of wrong and right encodings properly.
#### [Standardise vnode text representation (@barneycarroll)](https://github.com/MithrilJS/mithril.js/pull/2670)

This addresses the crucial feature of #2669: text is always represented as virtual text nodes, never as a `vnode.text`.
#### [Issue 2624 no content 204 parse (@Evoke-PHP)](https://github.com/MithrilJS/mithril.js/pull/2641)

Added guard so that JSON.parse does not fail on IE11 with no content empty string being parsed.  Fixes https://github.com/MithrilJS/mithril.js/issues/2624.
#### [[m.request] work around a bundler bug, fix #2647 (@pygy)](https://github.com/MithrilJS/mithril.js/pull/2655)

The bundler mangles identifier-like strings within RegExps, this works around the problem by not using such RegExps.
#### [Reject request on XHR timeout (@kevinfiol)](https://github.com/MithrilJS/mithril.js/pull/2646)

Derived from PR #2581.  Allows requests to properly reject on event of a timeout.
#### [Remove extra isLifecycleMethod call from removeAttr (@ZeikJT)](https://github.com/MithrilJS/mithril.js/pull/2594)

Removing an extra isLifecycleMethod in the removeAttr method, it isn't needed since it's already checked on the previous line.
#### [Fix #2601 (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/2603)

Fix issue where ending a stream in the middle of a stream callback would result in erroneous parent stream state for the rest of that emit.  Fixes #2601.
#### [Add streams to releases again, include minified bundle, drop internal stuff from npm (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/2539)

Add `stream/stream.js` to releases again.  Add `stream/stream.min.js` now that the process is remotely sane now.
#### [Make errors and their messages more accurate and helpful (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/2536)

I updated error messages to be much more helpful.
#### [Fix assertion descriptions (@soulofmischief)](https://github.com/MithrilJS/mithril.js/pull/2405)

I moved the return statement to the end of define() so that it returns even if the comparison fails.
#### [Fix branch target (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/2765)

https://github.com/MithrilJS/mithril.js/runs/6199543939?check_suite_focus=true.
#### [Automate mithril's release workflow (@JAForbes)](https://github.com/MithrilJS/mithril.js/pull/2760)

Automated releases, pre-releases, (code) rollbacks and recovery, npm publishing, change log management just by using normal github flow.
#### [rework jsx docs (@StephanHoyer)](https://github.com/MithrilJS/mithril.js/pull/2758)


#### [Add Simple Application Flems Supporting v2.0.4 and up (@tbreuss)](https://github.com/MithrilJS/mithril.js/pull/2751)

Added Flems for Simple Application supporting v2.0.4 of Mithril.js.  Fixes Issue #2710.
#### [Make example work with webpack v5.69.1 (@StephanHoyer)](https://github.com/MithrilJS/mithril.js/pull/2757)

fixes #2634.
#### [2604: correct and move text about statements in view method (@kevinfiol)](https://github.com/MithrilJS/mithril.js/pull/2748)

Addresses #2604.
#### [Fix lint errors (@StephanHoyer)](https://github.com/MithrilJS/mithril.js/pull/2745)


#### [WIP: Update modularisation details in Installation docs (@orbitbot)](https://github.com/MithrilJS/mithril.js/pull/2620)

added link to flems.io as an easier way to just try out the framework.  -.  Documentation has grown a bit stale.
#### [Added power support for the travis.yml file with ppc64le (@sreekanth370)](https://github.com/MithrilJS/mithril.js/pull/2644)

Added power support for the travis.yml file with ppc64le.  This is part of the Ubuntu distribution for ppc64le.
#### [Updated babel/webpack docs to work with latest versions (@pereriksson)](https://github.com/MithrilJS/mithril.js/pull/2649)

As a developer I tried setting up Mithril with Babel and Webpack but failed because of a variety of errors.
#### [[docs] route redirection using the history API (@pygy)](https://github.com/MithrilJS/mithril.js/pull/1767)

This is an attempt at fixing #1759, but there may be more to be added.  Feedback welcome.  ping @dontwork.
#### [Bump path-parse from 1.0.6 to 1.0.7 (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2718)

Bumps [path-parse](https://github.com/jbgutierrez/path-parse) from 1.0.6 to 1.0.7.  Commits.  See full diff in compare view.
#### [Bump glob-parent from 5.1.0 to 5.1.2 (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2693)

Bumps [glob-parent](https://github.com/gulpjs/glob-parent) from 5.1.0 to 5.1.2.  Release notes.  Sourced from glob-parent's releases.  v5.1.2.  Bug Fixes.
#### [Bump ajv from 6.10.2 to 6.12.6 (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2741)

Bumps [ajv](https://github.com/ajv-validator/ajv) from 6.10.2 to 6.12.6.  Release notes.  Sourced from ajv's releases.  v6.12.6.  Fix performance issue of "url" format.
#### [Update standalone usage (@ghost)](https://github.com/MithrilJS/mithril.js/pull/2651)


#### [Avoid double encoding of function signatures - fixes #2720 (@StephanHoyer)](https://github.com/MithrilJS/mithril.js/pull/2721)


#### [Show previous versions (@mike-ward)](https://github.com/MithrilJS/mithril.js/pull/2353)

Add Dropdown that shows links to archived versions of the documentation.
#### [docs: improve m.request return value description (@GAumala)](https://github.com/MithrilJS/mithril.js/pull/2206)

In the m.request return value description, add a line informing that error status codes cause the promise to reject.
#### [A note on JSX events (@pereriksson)](https://github.com/MithrilJS/mithril.js/pull/2648)

Naming JSX events according to their documentation produces unexpected results with incorrectly named events when using JSX with Mithril.
#### [Document route resolution cancellation, fixes #1759 (@barneycarroll)](https://github.com/MithrilJS/mithril.js/pull/2672)

Also fixes a broken internal link.
#### [Bump marked from 0.7.0 to 4.0.10 (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2717)

Bumps [marked](https://github.com/markedjs/marked) from 0.7.0 to 4.0.10.  Release notes.  Sourced from marked's releases.  v4.0.10.  4.0.10 (2022-01-13).  Bug Fixes.
#### [Flems in docs (#2348) [skip ci] (@porsager)](https://github.com/MithrilJS/mithril.js/pull/2348)

Added flems instead of the current codepen samples.
#### [Remove old TOC link (@ArthurClemens)](https://github.com/MithrilJS/mithril.js/pull/2698)

Content was moved some time ago and linked section no longer exists.
#### [Cavemansspa patch 1 (@cavemansspa)](https://github.com/MithrilJS/mithril.js/pull/2696)

Documentation update.
#### [Bump hosted-git-info from 2.8.4 to 2.8.9 (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2684)

Bumps [hosted-git-info](https://github.com/npm/hosted-git-info) from 2.8.4 to 2.8.9.  Changelog.  Sourced from hosted-git-info's changelog.  2.8.9 (2021-04-07).
#### [Bump lodash from 4.17.20 to 4.17.21 (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2680)

Bumps [lodash](https://github.com/lodash/lodash) from 4.17.20 to 4.17.21.  Commits.  f299b52 Bump to v4.17.21.
#### [Bump handlebars from 4.7.6 to 4.7.7 (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2679)

Bumps [handlebars](https://github.com/wycats/handlebars.js) from 4.7.6 to 4.7.7.  Changelog.  Sourced from handlebars's changelog.  v4.7.7 - February 15th, 2021.
#### [Remove unreachable keyed node logic, fixes #2597 (@barneycarroll)](https://github.com/MithrilJS/mithril.js/pull/2673)


#### [Delete test-utils/README.md (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/2674)

We don't expose this publicly anymore, so there's literally no justification for this file's existence.
#### [simple-application.md: consistent use of type=submit (@danbst)](https://github.com/MithrilJS/mithril.js/pull/2657)

When following tutorial and typing everything in, I was confused that Save button didn't work.
#### [Fix inconsistent capitalizations of "JavaScript" (@mtsknn)](https://github.com/MithrilJS/mithril.js/pull/2639)

"Javascript"/"javascript" → "JavaScript".  Fixes #2398, or at least I can't find any more incorrect capitalizations.
#### [fix some typos (@osban)](https://github.com/MithrilJS/mithril.js/pull/2487)

Found some typos.  Mainly unescaped `|` in tables, but also a few other irregularities.  Not all problems are visible in the website docs.
#### [Replace mocha by ospec in testing page (@gamtiq)](https://github.com/MithrilJS/mithril.js/pull/2585)

Fixed a typo in testing doc page.  Currently there is reference to `mocha` in the page whereas `opsec` is used.
#### [Bump acorn from 7.1.0 to 7.4.0 (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2630)

Bumps [acorn](https://github.com/acornjs/acorn) from 7.1.0 to 7.4.0.  Commits.  54efb62 Mark version 7.4.0.
#### [Bump handlebars from 4.4.2 to 4.7.6 (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2629)

Bumps [handlebars](https://github.com/wycats/handlebars.js) from 4.4.2 to 4.7.6.  Changelog.  Sourced from handlebars's changelog.  v4.7.6 - April 3rd, 2020.
#### [Bump lodash from 4.17.15 to 4.17.20 (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2628)

Bumps [lodash](https://github.com/lodash/lodash) from 4.17.15 to 4.17.20.  Commits.  ded9bc6 Bump to v4.17.20.  63150ef Documentation fixes.
#### [Bump minimist from 1.2.0 to 1.2.3 (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2627)

Bumps [minimist](https://github.com/substack/minimist) from 1.2.0 to 1.2.3.  Commits.  6457d74 1.2.3.  38a4d1c even more aggressive checks for protocol pollution.
#### [Update installation.md (@purefan)](https://github.com/MithrilJS/mithril.js/pull/2608)

Offer to install mithril as a webpack plugin.  Just makes my life easier by not having to include mithril in every one of my js files.
#### [replace slave label with replica (@stephanos)](https://github.com/MithrilJS/mithril.js/pull/2605)

One of the example is using the antiquated word "slave" for a database replica.  I updated the language and tested the change.
#### [ES6 and m.trust docs patch (@kczx3)](https://github.com/MithrilJS/mithril.js/pull/2593)

While reading through some of the documentation I saw some issues with both the ES6 and `m.trust` pages.
#### [docs: Fix simple typo, subsequece -> subsequence (@timgates42)](https://github.com/MithrilJS/mithril.js/pull/2582)

There is a small typo in mithril.js, render/render.js.  Should read `subsequence` rather than `subsequece`.
#### [change link to go to ospec instead of mocha (@akessner)](https://github.com/MithrilJS/mithril.js/pull/2576)

Change the link to point to ospec docs in github.  ospec link went to mochajs.  [issue 2575](https://github.com/MithrilJS/mithril.js/issues/2575).  N/A.  N/A.  N/A.
#### [updated to the Vimeo showcase (@CreaturesInUnitards)](https://github.com/MithrilJS/mithril.js/pull/2573)

The scrimba version of Mithril 0-60 was built on their beta platform, and doesn't really even work anymore.
#### [adding more community examples (@boazblake)](https://github.com/MithrilJS/mithril.js/pull/2567)


#### [Exclude archive of previous docs (@cztomsik)](https://github.com/MithrilJS/mithril.js/pull/2561)

update .npmignore so that archives are not included in the resulting package.  space/bandwidth savings.  fix #2552.
#### [Pimp the docs linter (and assorted changes) (@pygy)](https://github.com/MithrilJS/mithril.js/pull/2553)

Add an optional cache for faster runs.  Add a final report.  Don't return anything from `exec()`.  Cover more files.  Look for a "--cache" option.
#### [Recast key docs to be much clearer and more accurate (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/2540)

Recast key docs to be much clearer and more accurate, including a few Flems examples to help intuitively explain things.
#### [Add `m.censor`, adjust `m.route.Link` to use it (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/2538)

Add `m.censor`.  Adjust `m.route.Link` to use it.  Restructure a few things for better code reuse.  Fixes #2472.
#### [Update fetch() browser support in docs (@qgustavor)](https://github.com/MithrilJS/mithril.js/pull/2522)

As [Can I use](https://caniuse.com/#feat=fetch) shows `fetch()` supported since Safari 10.1 and iOS Safari 10.3.
#### [docs: Add release dates to all change-log files (@maranomynet)](https://github.com/MithrilJS/mithril.js/pull/2513)

I'd like to introduce release dates to the change log files.  Release dates are human-friendly and add a bit of historical perspective to change-log files.

# Release v2.1.0

### Minor Changes

#### [m.censor: work around a bunder bug (@kfule)](https://github.com/MithrilJS/mithril.js/pull/2752)

The internal bundler sometimes mangles the words in RegExp literals incorrectly.  Please see below.
#### [Warn about reusing mutated attrs object - fixes #2719 (@StephanHoyer)](https://github.com/MithrilJS/mithril.js/pull/2722)


#### [Send URLSearchParams as request body without extra configuration (@Coteh)](https://github.com/MithrilJS/mithril.js/pull/2695)

This PR fixes an oddity I noticed in the way `m.request` handles `URLSearchParams` object.  It now handles it in the same sort of way XHR and Fetch do it.
#### [Add `params:` to `m.route.Link`, fix docs (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/2537)

Add `params:` to `m.route.Link`.  Minor fix to docs to reflect reality with `m.route.Link`'s `disabled:` attribute.
#### [Allow Mithril to be loaded in non-browser environments without modification (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/2633)

Recast the global reads to all be guarded with `typeof`, so that if they aren't defined, they're just `null`.
#### [Add a `m.Fragment = "["` utility for JSX users. (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/2744)

The title says it all, and the diff's obvious.  Resolves https://github.com/MithrilJS/mithril.js/issues/2640 and probably others.
   
### Patch Changes

#### [Enable --minimize-semver-change for pr-release (@JAForbes)](https://github.com/MithrilJS/mithril.js/pull/2769)

Minimizes semver changes on release to the minimum required version bump to satisfy major/minor/patch semver ranges.  Minimizes the semver change so that.
#### [Clean up m.route.Link (@barneycarroll)](https://github.com/MithrilJS/mithril.js/pull/2768)

An attempt at better demonstrating `m.route.Link` with less text.  Fixes #2767.
#### [Runtime-deprecate ospec, change `change-log` to `changelog`, fix a few assorted bugs (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/2578)

This PR is in two parts: 1.  Revise the build system and some of the local dev setup.  Fully split ospec from the repo, and add it as a dependency.
#### [Add meta description to docs (@StephanHoyer)](https://github.com/MithrilJS/mithril.js/pull/2316)

rework of #2149.  added a meta description parser and meta descriptions to all docs pages.  because google.  built the docs, inspected the output manually.
#### [Fixed badges, consistent naming of Mithril.js (@tbreuss)](https://github.com/MithrilJS/mithril.js/pull/2750)

use consistent naming of Mithril.js.  fix badges in README.  Fixes issue #2749.
#### [Catch malformed URI Components (@jdiderik)](https://github.com/MithrilJS/mithril.js/pull/2711)

Fix for error thrown when a value contains non-valid / malformed URI Component.  Example: test=%c5%a1%e8ZM%80%82H.  will throw "URI malformed".
#### [Correctly handle invalid escapes in routes based on 0a5ead31c9fbd7b153c521c7f9d3df7bf826ce6c (@StephanHoyer)](https://github.com/MithrilJS/mithril.js/pull/2743)

fixes #2061.  @dead-claudia I just redid your change but slightly different in order to handle a mix of wrong and right encodings properly.
#### [Standardise vnode text representation (@barneycarroll)](https://github.com/MithrilJS/mithril.js/pull/2670)

This addresses the crucial feature of #2669: text is always represented as virtual text nodes, never as a `vnode.text`.
#### [Issue 2624 no content 204 parse (@Evoke-PHP)](https://github.com/MithrilJS/mithril.js/pull/2641)

Added guard so that JSON.parse does not fail on IE11 with no content empty string being parsed.  Fixes https://github.com/MithrilJS/mithril.js/issues/2624.
#### [[m.request] work around a bundler bug, fix #2647 (@pygy)](https://github.com/MithrilJS/mithril.js/pull/2655)

The bundler mangles identifier-like strings within RegExps, this works around the problem by not using such RegExps.
#### [Reject request on XHR timeout (@kevinfiol)](https://github.com/MithrilJS/mithril.js/pull/2646)

Derived from PR #2581.  Allows requests to properly reject on event of a timeout.
#### [Remove extra isLifecycleMethod call from removeAttr (@ZeikJT)](https://github.com/MithrilJS/mithril.js/pull/2594)

Removing an extra isLifecycleMethod in the removeAttr method, it isn't needed since it's already checked on the previous line.
#### [Fix #2601 (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/2603)

Fix issue where ending a stream in the middle of a stream callback would result in erroneous parent stream state for the rest of that emit.  Fixes #2601.
#### [Add streams to releases again, include minified bundle, drop internal stuff from npm (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/2539)

Add `stream/stream.js` to releases again.  Add `stream/stream.min.js` now that the process is remotely sane now.
#### [Make errors and their messages more accurate and helpful (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/2536)

I updated error messages to be much more helpful.
#### [Fix assertion descriptions (@soulofmischief)](https://github.com/MithrilJS/mithril.js/pull/2405)

I moved the return statement to the end of define() so that it returns even if the comparison fails.
#### [Fix branch target (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/2765)

https://github.com/MithrilJS/mithril.js/runs/6199543939?check_suite_focus=true.
#### [Automate mithril's release workflow (@JAForbes)](https://github.com/MithrilJS/mithril.js/pull/2760)

Automated releases, pre-releases, (code) rollbacks and recovery, npm publishing, change log management just by using normal github flow.
#### [rework jsx docs (@StephanHoyer)](https://github.com/MithrilJS/mithril.js/pull/2758)


#### [Add Simple Application Flems Supporting v2.0.4 and up (@tbreuss)](https://github.com/MithrilJS/mithril.js/pull/2751)

Added Flems for Simple Application supporting v2.0.4 of Mithril.js.  Fixes Issue #2710.
#### [Make example work with webpack v5.69.1 (@StephanHoyer)](https://github.com/MithrilJS/mithril.js/pull/2757)

fixes #2634.
#### [2604: correct and move text about statements in view method (@kevinfiol)](https://github.com/MithrilJS/mithril.js/pull/2748)

Addresses #2604.
#### [Fix lint errors (@StephanHoyer)](https://github.com/MithrilJS/mithril.js/pull/2745)


#### [WIP: Update modularisation details in Installation docs (@orbitbot)](https://github.com/MithrilJS/mithril.js/pull/2620)

added link to flems.io as an easier way to just try out the framework.  -.  Documentation has grown a bit stale.
#### [Added power support for the travis.yml file with ppc64le (@sreekanth370)](https://github.com/MithrilJS/mithril.js/pull/2644)

Added power support for the travis.yml file with ppc64le.  This is part of the Ubuntu distribution for ppc64le.
#### [Updated babel/webpack docs to work with latest versions (@pereriksson)](https://github.com/MithrilJS/mithril.js/pull/2649)

As a developer I tried setting up Mithril with Babel and Webpack but failed because of a variety of errors.
#### [[docs] route redirection using the history API (@pygy)](https://github.com/MithrilJS/mithril.js/pull/1767)

This is an attempt at fixing #1759, but there may be more to be added.  Feedback welcome.  ping @dontwork.
#### [Bump path-parse from 1.0.6 to 1.0.7 (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2718)

Bumps [path-parse](https://github.com/jbgutierrez/path-parse) from 1.0.6 to 1.0.7.  Commits.  See full diff in compare view.
#### [Bump glob-parent from 5.1.0 to 5.1.2 (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2693)

Bumps [glob-parent](https://github.com/gulpjs/glob-parent) from 5.1.0 to 5.1.2.  Release notes.  Sourced from glob-parent's releases.  v5.1.2.  Bug Fixes.
#### [Bump ajv from 6.10.2 to 6.12.6 (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2741)

Bumps [ajv](https://github.com/ajv-validator/ajv) from 6.10.2 to 6.12.6.  Release notes.  Sourced from ajv's releases.  v6.12.6.  Fix performance issue of "url" format.
#### [Update standalone usage (@ghost)](https://github.com/MithrilJS/mithril.js/pull/2651)


#### [Avoid double encoding of function signatures - fixes #2720 (@StephanHoyer)](https://github.com/MithrilJS/mithril.js/pull/2721)


#### [Show previous versions (@mike-ward)](https://github.com/MithrilJS/mithril.js/pull/2353)

Add Dropdown that shows links to archived versions of the documentation.
#### [docs: improve m.request return value description (@GAumala)](https://github.com/MithrilJS/mithril.js/pull/2206)

In the m.request return value description, add a line informing that error status codes cause the promise to reject.
#### [A note on JSX events (@pereriksson)](https://github.com/MithrilJS/mithril.js/pull/2648)

Naming JSX events according to their documentation produces unexpected results with incorrectly named events when using JSX with Mithril.
#### [Document route resolution cancellation, fixes #1759 (@barneycarroll)](https://github.com/MithrilJS/mithril.js/pull/2672)

Also fixes a broken internal link.
#### [Bump marked from 0.7.0 to 4.0.10 (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2717)

Bumps [marked](https://github.com/markedjs/marked) from 0.7.0 to 4.0.10.  Release notes.  Sourced from marked's releases.  v4.0.10.  4.0.10 (2022-01-13).  Bug Fixes.
#### [Flems in docs (#2348) [skip ci] (@porsager)](https://github.com/MithrilJS/mithril.js/pull/2348)

Added flems instead of the current codepen samples.
#### [Remove old TOC link (@ArthurClemens)](https://github.com/MithrilJS/mithril.js/pull/2698)

Content was moved some time ago and linked section no longer exists.
#### [Cavemansspa patch 1 (@cavemansspa)](https://github.com/MithrilJS/mithril.js/pull/2696)

Documentation update.
#### [Bump hosted-git-info from 2.8.4 to 2.8.9 (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2684)

Bumps [hosted-git-info](https://github.com/npm/hosted-git-info) from 2.8.4 to 2.8.9.  Changelog.  Sourced from hosted-git-info's changelog.  2.8.9 (2021-04-07).
#### [Bump lodash from 4.17.20 to 4.17.21 (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2680)

Bumps [lodash](https://github.com/lodash/lodash) from 4.17.20 to 4.17.21.  Commits.  f299b52 Bump to v4.17.21.
#### [Bump handlebars from 4.7.6 to 4.7.7 (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2679)

Bumps [handlebars](https://github.com/wycats/handlebars.js) from 4.7.6 to 4.7.7.  Changelog.  Sourced from handlebars's changelog.  v4.7.7 - February 15th, 2021.
#### [Remove unreachable keyed node logic, fixes #2597 (@barneycarroll)](https://github.com/MithrilJS/mithril.js/pull/2673)


#### [Delete test-utils/README.md (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/2674)

We don't expose this publicly anymore, so there's literally no justification for this file's existence.
#### [simple-application.md: consistent use of type=submit (@danbst)](https://github.com/MithrilJS/mithril.js/pull/2657)

When following tutorial and typing everything in, I was confused that Save button didn't work.
#### [Fix inconsistent capitalizations of "JavaScript" (@mtsknn)](https://github.com/MithrilJS/mithril.js/pull/2639)

"Javascript"/"javascript" → "JavaScript".  Fixes #2398, or at least I can't find any more incorrect capitalizations.
#### [fix some typos (@osban)](https://github.com/MithrilJS/mithril.js/pull/2487)

Found some typos.  Mainly unescaped `|` in tables, but also a few other irregularities.  Not all problems are visible in the website docs.
#### [Replace mocha by ospec in testing page (@gamtiq)](https://github.com/MithrilJS/mithril.js/pull/2585)

Fixed a typo in testing doc page.  Currently there is reference to `mocha` in the page whereas `opsec` is used.
#### [Bump acorn from 7.1.0 to 7.4.0 (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2630)

Bumps [acorn](https://github.com/acornjs/acorn) from 7.1.0 to 7.4.0.  Commits.  54efb62 Mark version 7.4.0.
#### [Bump handlebars from 4.4.2 to 4.7.6 (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2629)

Bumps [handlebars](https://github.com/wycats/handlebars.js) from 4.4.2 to 4.7.6.  Changelog.  Sourced from handlebars's changelog.  v4.7.6 - April 3rd, 2020.
#### [Bump lodash from 4.17.15 to 4.17.20 (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2628)

Bumps [lodash](https://github.com/lodash/lodash) from 4.17.15 to 4.17.20.  Commits.  ded9bc6 Bump to v4.17.20.  63150ef Documentation fixes.
#### [Bump minimist from 1.2.0 to 1.2.3 (@dependabot[bot])](https://github.com/MithrilJS/mithril.js/pull/2627)

Bumps [minimist](https://github.com/substack/minimist) from 1.2.0 to 1.2.3.  Commits.  6457d74 1.2.3.  38a4d1c even more aggressive checks for protocol pollution.
#### [Update installation.md (@purefan)](https://github.com/MithrilJS/mithril.js/pull/2608)

Offer to install mithril as a webpack plugin.  Just makes my life easier by not having to include mithril in every one of my js files.
#### [replace slave label with replica (@stephanos)](https://github.com/MithrilJS/mithril.js/pull/2605)

One of the example is using the antiquated word "slave" for a database replica.  I updated the language and tested the change.
#### [ES6 and m.trust docs patch (@kczx3)](https://github.com/MithrilJS/mithril.js/pull/2593)

While reading through some of the documentation I saw some issues with both the ES6 and `m.trust` pages.
#### [docs: Fix simple typo, subsequece -> subsequence (@timgates42)](https://github.com/MithrilJS/mithril.js/pull/2582)

There is a small typo in mithril.js, render/render.js.  Should read `subsequence` rather than `subsequece`.
#### [change link to go to ospec instead of mocha (@akessner)](https://github.com/MithrilJS/mithril.js/pull/2576)

Change the link to point to ospec docs in github.  ospec link went to mochajs.  [issue 2575](https://github.com/MithrilJS/mithril.js/issues/2575).  N/A.  N/A.  N/A.
#### [updated to the Vimeo showcase (@CreaturesInUnitards)](https://github.com/MithrilJS/mithril.js/pull/2573)

The scrimba version of Mithril 0-60 was built on their beta platform, and doesn't really even work anymore.
#### [adding more community examples (@boazblake)](https://github.com/MithrilJS/mithril.js/pull/2567)


#### [Exclude archive of previous docs (@cztomsik)](https://github.com/MithrilJS/mithril.js/pull/2561)

update .npmignore so that archives are not included in the resulting package.  space/bandwidth savings.  fix #2552.
#### [Pimp the docs linter (and assorted changes) (@pygy)](https://github.com/MithrilJS/mithril.js/pull/2553)

Add an optional cache for faster runs.  Add a final report.  Don't return anything from `exec()`.  Cover more files.  Look for a "--cache" option.
#### [Recast key docs to be much clearer and more accurate (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/2540)

Recast key docs to be much clearer and more accurate, including a few Flems examples to help intuitively explain things.
#### [Add `m.censor`, adjust `m.route.Link` to use it (@dead-claudia)](https://github.com/MithrilJS/mithril.js/pull/2538)

Add `m.censor`.  Adjust `m.route.Link` to use it.  Restructure a few things for better code reuse.  Fixes #2472.
#### [Update fetch() browser support in docs (@qgustavor)](https://github.com/MithrilJS/mithril.js/pull/2522)

As [Can I use](https://caniuse.com/#feat=fetch) shows `fetch()` supported since Safari 10.1 and iOS Safari 10.3.
#### [docs: Add release dates to all change-log files (@maranomynet)](https://github.com/MithrilJS/mithril.js/pull/2513)

I'd like to introduce release dates to the change log files.  Release dates are human-friendly and add a bit of historical perspective to change-log files.
