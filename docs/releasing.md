# Releasing

## Publishing to NPM

Releasing new builds of mithril to NPM is mostly automated via `npm run release`

1. Update information in `docs/change-log.md` to match reality & the new version that will be released
2. `npm run release <major|minor|patch|semver>`

All further steps are automated and run as follows:

3. New bundles are generated using updated version
4. Tests are run
5. Linting is run (but doesn't fail build)
6. Version number in package.json is incremented
7. `git add` called on bundle output
8. `package.json` and updated bundles are committed to git
9. previous commit is tagged using new version number
10. `git push --follow-tags` pushes up new version commit & tag to github
11. Travis sees new release, starts build
12. Travis generates new bundles before running tests
13. Travis runs tests
14. Travis lints files (but can't fail build)
15. If build fails, abort
16. Build succeeded, so travis will commit back any changes to the repo (but there won't be any)
17. Travis sees that this commit has a tag associated with it
18. Travis will use the encrypted npm creds in `.travis.yml` to publish a new version to npm

## Publishing a GitHub release

Happens automatically as part of the [Publishing to NPM](#publishing-to-npm) process described above.

Does require a manual description to be added though, as the auto-generated one isn't very interesting. I suggest coming up with a fun title & then copying the `docs/change-log.md` entry for the build.

## Updating `docs/change-log.md`

This is still a manual process, I'm sorry.

## Updating docs (outside of a new version)

Fixes to documentation can land whenever, updates to the site are published via Travis.

1. `git co next`
2. `git pull lhorie next`
3. `git co master`
4. `git co next -- ./docs`
5. Ensure that no new features are added
6. `git push lhorie`
7. After the Travis build completes new docs should appear in ~3 minutes
