# Mithril Release Processes

**Note** These steps all assume that `MithrilJS/mithril.js` is a git remote named `mithriljs`, adjust accordingly if that doesn't match your setup.

## Releasing a new Mithril version

### Prepare the release

1. Ensure your local branch is up to date

```bash
$ git co next
$ git pull --rebase mithriljs next
```

2. Determine patch level of the change
3. Update information in `docs/change-log.md` to match reality of the new version being prepared for release
4. Commit changes to `next`

```
$ git add .
$ git commit -m "Preparing for release"

# Push to your branch
$ git push

# Push to MithrilJS/mithril.js
$ git push mithriljs next
```

### Merge from `next` to `master`

5. Switch to `master` and make sure it's up to date

```bash
$ git co master
$ git pull --rebase mithriljs master
```

6. merge `next` on top of it

```bash
$ git merge next
```

7. Clean & update npm dependencies and ensure the tests are passing.

```bash
$ npm prune
$ npm i
$ npm test
```

### Publish the release

8. `npm run release <major|minor|patch|semver>`, see the docs for [`npm version`](https://docs.npmjs.com/cli/version)
9. The changes will be automatically pushed to your fork
10. Push the changes to `MithrilJS/mithril.js`

```bash
$ git push mithriljs master
```

11. Travis will push the new release to npm & create a GitHub release

### Merge `master` back into `next`

This helps to ensure that the `version` field of `package.json` doesn't get out of date.

12. Switch to `next` and make sure it's up to date

```bash
$ git co next
$ git pull --rebase mithriljs next
```

13. Merge `master` back onto `next`

```bash
$ git merge master
```

14. Push the changes to your fork & `MithrilJS/mithril.js`

```bash
$ git push
$ git push mithriljs next
```

### Update the GitHub release

15. The GitHub Release will require a manual description & title to be added. I suggest coming up with a fun title & then copying the `docs/change-log.md` entry for the build.

## Updating mithril.js.org

Fixes to documentation can land whenever, updates to the site are published via Travis.

```bash
# These steps assume that MithrilJS/mithril.js is a git remote named "mithriljs"

# Ensure your next branch is up to date
$ git co next
$ git pull mithriljs next

# Splat the docs folder from next onto master
$ git co master
$ git co next -- ./docs

# Manually ensure that no new feature docs were added

$ git push mithriljs
```

After the Travis build completes the updated docs should appear on https://mithril.js.org in a few minutes.
