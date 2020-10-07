This contains general base image assets for docs and such.

- `logo.svg` is the logo source file, the base asset. It's an Inkscape SVG file, complete with relevant metadata.
- `github-logo.png` is the logo export used for the GitHub profile picture.
- `gitter-logo.png` is the logo export used for the Gitter avatar picture.
- `open-collective-logo.png` is the logo export used for Open Collective. Unlike the GitHub and Gitter logos, this one has a transparent background.
- `16.png`, `32.png`, and `48.png` are the logo exports used for the favicon. They are generated separately by Inkscape as ImageMagick's output is horrendously blurry. (I don't get how such a powerful image manipulation library can be so bad at rasterizing an SVG file, but apparently it's possible.)

In the docs, some of the logos are stored there directly rather than being first generated here.

- `docs/logo.svg` is just the `logo.svg` here, but size-optimized with metadata and Inkscape-specific stuff such stripped. I generated this from Inkscape as it's easier than installing npm modules and there's little point in installing a whole development dependency just to minify one (already small) SVG file.
- `docs/favicon.ico` is `16.png`, `32.png`, and `48.png` from here combined into a single `.ico` file.

The other favicon file, `docs/favicon.png`, is simply copied from `32.png` directly.

### Generating

If you want to generate all these yourself from the originals and replicate everything for yourself:

1. Open `assets/logo.svg` in Inkscape.

1. Save an optimized SVG copy to `docs/logo.svg` with the following settings (irrelevant ones omitted):

	- "Options" tab:
		- Shorten color values: checked
		- Convert CSS attributes to XML attributes: checked
		- Collapse groups: checked
		- Create groups for similar attributes: checked
		- Keep editor data: unchecked
		- Keep unreferenced definitions: unchecked
		- Work around renderer bugs: checked
	- "SVG Output" tab:
		- Remove the XML declaration: unchecked
		- Remove metadata: checked
		- Remove comments: checked
		- Embed raster images: checked
		- Enable viewboxing: unchecked
		- Format output with line-breaks and indentation: unchecked
		- Strip the "xml:space" attribute from the root SVG element: checked
	- "IDs" tab:
		- Remove unused IDs: checked

1. Export as a PNG to `assets/github-logo.png` with the following settings:

	- Export area: page
	- Image width: 500 pixels
	- Image height: 500 pixels

1. Export as a PNG to `assets/gitter-logo.png` with the following settings:

	- Export area: page
	- Image width: 96 pixels
	- Image height: 96 pixels

1. Export as a PNG to `assets/open-collective-logo.png` with the following settings:

	- Export area: page
	- Image width: 256 pixels
	- Image height: 256 pixels

1. Export as a PNG to `assets/16.png` with the following settings:

	- Export area: page
	- Image width: 16 pixels
	- Image height: 16 pixels

1. Export as a PNG to `assets/32.png` with the following settings:

	- Export area: page
	- Image width: 32 pixels
	- Image height: 32 pixels

1. Export as a PNG to `assets/48.png` with the following settings:

	- Export area: page
	- Image width: 48 pixels
	- Image height: 48 pixels

1. Run the following ImageMagick commands from the repo's root:

	```sh
	magick convert assets/github-logo.png -background white -flatten assets/github-logo.png
	magick convert assets/gitter-logo.png -background white -flatten assets/gitter-logo.png
	magick convert -background none assets/16.png assets/32.png assets/48.png docs/favicon.ico
	```

1. Verify the icon has the expected sizes contained within it by running the following ImageMagick command from the root:

	```sh
	magick identify docs/favicon.ico
	```

	This should print something along the lines of this:

	```
	docs/favicon.ico[0] ICO 16x16 16x16+0+0 8-bit sRGB 0.000u 0:00.000
	docs/favicon.ico[1] ICO 32x32 32x32+0+0 8-bit sRGB 0.000u 0:00.006
	docs/favicon.ico[2] ICO 48x48 48x48+0+0 8-bit sRGB 15086B 0.000u 0:00.008
	```

1. Copy `assets/32.png` to `docs/favicon.png`.
