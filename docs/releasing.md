<!--meta-description
Describes how we do releases of Mithril.js
-->

# Mithril.js Release Processes

Mithril.js' release process is automated by [pr-release].  pr-release is maintained by a long time Mithril.js community member [@JAForbes](https://github.com/JAForbes).

pr-release handles the following:

- Generating changelog entries
- Automating the semver version
- Publishing releases and pre-releases to npm
- Creating github releases
- Rollbacks

## For contributors

Contributors should create their feature branch targetting the default branch `main`.  When this branch is merged `pr-release` will either generate or update a release PR from `main` to `release`.

The description and title will be managed by [pr-release], including the semver version.

Contributors who have permissions should add the correct semver label to their PR (`major` | `minor` | `patch`).  If no label is set, `patch` is assumed.

If you do not have permissions, the maintainer will set the label on your behalf.

## Changelog

Currently, `docs/recent-changes.md` holds an automatically prepended log of changes, managed by pr-release. Ideally, I want to get rid of this and just have pr-release somehow push to https://github.com/MithrilJS/docs automatically, but that may take some work.

## For maintainers

Whenever a new feature branch is opened, a reviewing maintainer should add the correct semver label to their PR (`major` | `minor` | `patch`).  If no label is set, `patch` is assumed.

If a `major` or `minor` feature branch is merged but no labels were set, you can still go back and edit the semver labels.  On label change the release pr will automatically be regenerated and will recalculate the semver version.

[pr-release]: https://pr-release.org/
