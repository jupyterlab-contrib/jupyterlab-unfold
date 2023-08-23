# jupyterlab-unfold

[![Extension status](https://img.shields.io/badge/status-ready-success "ready to be used")](https://jupyterlab-contrib.github.io/)
[![Github Actions Status](https://github.com/jupyterlab-contrib/jupyterlab-unfold/actions/workflows/build.yml/badge.svg)](https://github.com/jupyterlab-contrib/jupyterlab-unfold/actions?query=workflow%3ATests)
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/jupyterlab-contrib/jupyterlab-unfold/master?urlpath=lab)
[![PyPI](https://img.shields.io/pypi/v/jupyterlab-unfold)](https://pypi.org/project/jupyterlab-unfold/)
[![Conda (channel only)](https://img.shields.io/conda/vn/conda-forge/jupyterlab-unfold)](https://anaconda.org/conda-forge/jupyterlab-unfold)

An IDE-like file browser

![jupyterlab-unfold](https://raw.githubusercontent.com/jupyterlab-contrib/jupyterlab-unfold/master/images/screenshot.png)

## Requirements

* JupyterLab >= 3.1.0,<4.0

## Install

To install the extension, execute:

```bash
pip install jupyterlab-unfold
```

## Uninstall

To remove the extension, execute:

```bash
pip uninstall jupyterlab-unfold
```


## Contributing

### Development install

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the jupyterlab-unfold directory
# Install package in development mode
pip install -e .
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Rebuild extension Typescript source after making changes
jlpm run build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm run watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm run build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

### Development uninstall

```bash
pip uninstall jupyterlab-unfold
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `jupyterlab-unfold` within that folder.


## Acknowledgement

This extension was inspired from https://github.com/youngthejames/jupyterlab_filetree, but the code reuses the core-JupyterLab filebrowser and replaces it by default.
