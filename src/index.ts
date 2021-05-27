import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { IFileBrowserFactory } from '@jupyterlab/filebrowser';

import { IDocumentManager } from '@jupyterlab/docmanager';

import { addIcon } from '@jupyterlab/ui-components';

import { WidgetTracker, ToolbarButton } from '@jupyterlab/apputils';

import { ITranslator } from '@jupyterlab/translation';

import { IStateDB } from '@jupyterlab/statedb';

import { FileTreeBrowser, FilterFileTreeBrowserModel } from './unfold';

/**
 * The extension ID.
 */
const EXTENSION_ID = 'jupyterlab-unfold';

/**
 * The file browser namespace token.
 */
const namespace = 'filebrowser';


const extension: JupyterFrontEndPlugin<IFileBrowserFactory> = {
  id: EXTENSION_ID,
  provides: IFileBrowserFactory,
  requires: [IDocumentManager, ITranslator],
  optional: [IStateDB],
  activate: async (
    app: JupyterFrontEnd,
    docManager: IDocumentManager,
    translator: ITranslator,
    state: IStateDB | null
  ): Promise<IFileBrowserFactory> => {
    const tracker = new WidgetTracker<FileTreeBrowser>({ namespace });
    const createFileBrowser = (
      id: string,
      options: IFileBrowserFactory.IOptions = {}
    ) => {
      const model = new FilterFileTreeBrowserModel({
        translator: translator,
        auto: options.auto ?? true,
        manager: docManager,
        driveName: options.driveName || '',
        refreshInterval: options.refreshInterval,
        app,
        state:
          options.state === null
            ? undefined
            : options.state || state || undefined
      });
      const widget = new FileTreeBrowser({
        id,
        model,
        restore: true,
        translator,
        app
      });

      // Track the newly created file browser.
      void tracker.add(widget);

      return widget;
    };

    // Manually restore and load the default file browser.
    const defaultBrowser = createFileBrowser(EXTENSION_ID, {
      auto: false,
      restore: false
    });

    // TODO Remove this! Why is this needed?
    // The @jupyterlab/filebrowser-extension:launcher-toolbar-button extension should take care of this
    const { commands } = app;
    const trans = translator.load('jupyterlab');

    // Add a launcher toolbar item.
    const launcher = new ToolbarButton({
      icon: addIcon,
      onClick: () => {
        if (commands.hasCommand('launcher:create')) {
          return commands.execute('launcher:create');
        }
      },
      tooltip: trans.__('New Launcher'),
      actualOnClick: true
    });
    defaultBrowser.toolbar.insertItem(0, 'launch', launcher);

    return { createFileBrowser, defaultBrowser, tracker };
  }
};

export default extension;
