# Mithril Release Processes

## Releasing a new Mithril version

### Prepare the release

1. Determine patch level of the change
2. Update information in `docs/change-log.md` to match reality & the new version that will be released

### Merge from `next` to `master`

3. Switch to `master` and merge `next` on top of it

```bash
$ git co master
$ git merge next
```

4. Clean & update npm dependencies and ensure the tests are passing.

```bash
$ npm prune
$ npm i
$ npm test
```

### Publish the release

5. `npm run release <major|minor|patch|semver>`, see the docs for [`npm version`](https://docs.npmjs.com/cli/version)
6. Travis will push the new release to npm & create a GitHub release

### Update the GitHub release

7. The GitHub Release will require a manual description & title to be added. I suggest coming up with a fun title & then copying the `docs/change-log.md` entry for the build.

## Updating mithril.js.org

Fixes to documentation can land whenever, updates to the site are published via Travis.

```bash
# These steps assume that lhorie/mithril.js is a git remote named "lhorie"

# Ensure your next branch is up to date
$ git co next
$ git pull lhorie next

# Splat the docs folder from next onto master
$ git co master
$ git co next -- ./docs

# Manually ensure that no new feature docs were added

$ git push lhorie
```

After the Travis build completes the updated docs should appear on https://mithril.js.org in a few minutes.
