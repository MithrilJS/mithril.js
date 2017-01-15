# Releasing

Releasing new builds of mithril is mostly automated via `npm version`

## Publishing to NPM

1. `npm version <major|minor|patch|semver> -m "v%s"`

All further steps are automated and run as follows:

2. Tests are run
3. Linting is run (but doesn't fail build)
4. Version number in package.json is incremented
5. New bundles are generated using updated version
6. `git add` called on bundle output
7. `package.json` and updated bundles are committed to git
8. previous commit is tagged using new version number
9. `git push --follow-tags` pushes up new version commit & tag to github
10. Travis sees new release, starts build
11. Travis generates new bundles before running tests
12. Travis runs tests
13. Travis lints files (but can't fail build)
14. If build fails, abort
15. Build succeeded, so travis will commit back any changes to the repo (but there won't be any)
16. Travis sees that this commit has a tag associated with it
17. Travis will use the encrypted npm creds in `.travis.yml` to publish a new version to npm

## Publishing a GitHub release

**TODO**

## Updating `docs/change-log.md`

**TODO**
