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

Contributors should create their feature branch targetting the default branch `next`.  When this branch is merged `pr-release` will either generate or update a release PR from `next` to `main`.

The description and title will be managed by [pr-release], including the semver version.

Contributors who have permissions should add the correct semver label to their PR (`major` | `minor` | `patch`).  If no label is set, `patch` is assumed.

If you do not have permissions, the maintainer will set the label on your behalf.

## Changelog

There are two changelogs in the Mithril.js project

- `docs/changelog.md` a hand written curated reflection of changes to the codebase
- `docs/release.md` an automatically prepended log of changes, managed by pr-release

In future we may collapse these into a single file, the separation is due to the fact the `changelog.md` predates the `release.md` file.

## For maintainers

Whenever a new feature branch is opened, a reviewing maintainer should add the correct semver label to their PR (`major` | `minor` | `patch`).  If no label is set, `patch` is assumed.

If a `major` or `minor` feature branch is merged but no labels were set, you can still go back and edit the semver labels.  On label change the release pr will automatically be regenerated and will recalculate the semver version.

## Updating mithril.js.org

Fixes to documentation can land whenever, updates to the site are built and published via `scripts/update-docs.js`.

```bash
# These steps assume that MithrilJS/mithril.js is a git remote named "mithriljs"

# Ensure your next branch is up to date
$ git checkout next
$ git pull mithriljs next

# Splat the docs folder from next onto master
$ git checkout master
$ git checkout next -- ./docs

# Manually ensure that no new feature docs were added

$ node scripts/update-docs
```

After the docs build completes, the updated docs should appear on https://mithril.js.org in a few minutes.

**Note:** When updating the stable version with a release candidate out, ***make sure to update the index + navigation to point to the new stable version!!!***

[pr-release]: https://pr-release.org/
