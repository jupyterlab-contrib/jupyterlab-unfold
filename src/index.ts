import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { IFileBrowserFactory } from '@jupyterlab/filebrowser';

import { IDocumentManager } from '@jupyterlab/docmanager';

import {
  WidgetTracker,
  createToolbarFactory,
  IToolbarWidgetRegistry,
  setToolbar
} from '@jupyterlab/apputils';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { ITranslator } from '@jupyterlab/translation';

import { IStateDB } from '@jupyterlab/statedb';

import { FileTreeBrowser, FilterFileTreeBrowserModel } from './unfold';

import { DriveIcon } from './icons';

import { addJupyterLabThemeChangeListener } from '@jupyter/web-components';

//import { Dialog, showDialog } from '@jupyterlab/apputils';

//import { Drive } from './contents';

//import { DriveListModel, DriveListView } from './drivelistmanager';

const SETTINGS_ID = 'jupyterlab-unfold:jupyterlab-unfold-settings';

const FILE_BROWSER_FACTORY = 'FileBrowser';
const FILE_BROWSER_PLUGIN_ID = 'jupyterlab-unfold:plugin';

namespace CommandIDs {
  export const openDrivesDialog = 'jupyterlab-unfold:open-drives-dialog';
  export const openPath = 'filebrowser:open-path';
}

/**
 * The file browser namespace token.
 */
const namespace = 'filebrowser';

const fileBrowserFactory: JupyterFrontEndPlugin<IFileBrowserFactory> = {
  id: 'jupyterlab-unfold:FileBrowserFactory',
  provides: IFileBrowserFactory,
  requires: [IDocumentManager, ITranslator, ISettingRegistry],
  optional: [IStateDB],
  activate: async (
    app: JupyterFrontEnd,
    docManager: IDocumentManager,
    translator: ITranslator,
    settings: ISettingRegistry,
    state: IStateDB | null
  ): Promise<IFileBrowserFactory> => {
    const setting = await settings.load(SETTINGS_ID);

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

      widget.listing.singleClickToUnfold = setting.get('singleClickToUnfold')
        .composite as boolean;

      setting.changed.connect(() => {
        widget.listing.singleClickToUnfold = setting.get('singleClickToUnfold')
          .composite as boolean;
      });

      // Track the newly created file browser.
      void tracker.add(widget);

      return widget;
    };

    return { createFileBrowser, tracker };
  }
};

const addDrives: JupyterFrontEndPlugin<void> = {
  id: 'jupyterlab-unfold:AddDrives',
  description: 'Open a dialog to select drives to be added in the filebrowser.',
  requires: [
    IDocumentManager,
    IToolbarWidgetRegistry,
    ITranslator,
    ILayoutRestorer,
    ISettingRegistry
  ],
  autoStart: true,
  activate: activateAddDrivesPlugin
};

export async function activateAddDrivesPlugin(
  app: JupyterFrontEnd,
  docManager: IDocumentManager,
  toolbarRegistry: IToolbarWidgetRegistry,
  translator: ITranslator,
  restorer: ILayoutRestorer | null,
  settings: ISettingRegistry,
  state: IStateDB | null
) {
  const trans = translator.load('jupyterlab_unfold');
  console.log('AddDrives plugin is activated!');
  const { commands } = app;

  const model = new FilterFileTreeBrowserModel({
    translator: translator,
    auto: true,
    manager: docManager,
    driveName: '',
    refreshInterval: 35000,
    state: undefined
  });
  const panel = new FileTreeBrowser({
    id: 'default',
    model,
    restore: true,
    translator,
    app
  });
  panel.title.icon = DriveIcon;
  panel.title.iconClass = 'jp-SideBar-tabIcon';
  panel.title.caption = 'Browse Drives';
  panel.id = 'panel-file-browser';
  if (restorer) {
    restorer.add(panel, 'drive-browser');
  }
  app.shell.add(panel, 'left', { rank: 102 });
  setToolbar(
    panel,
    createToolbarFactory(
      toolbarRegistry,
      settings,
      FILE_BROWSER_FACTORY,
      FILE_BROWSER_PLUGIN_ID,
      translator
    )
  );

  addJupyterLabThemeChangeListener();

  commands.addCommand(CommandIDs.openDrivesDialog, {
    execute: async args => {
      console.log('You have clicked on D button');
    },

    icon: DriveIcon.bindprops({ stylesheet: 'menuItem' }),
    caption: trans.__('Add drives to filebrowser.'),
    label: trans.__('Add Drives To Filebrowser')
  });
}

export * from './unfold';

const plugins: JupyterFrontEndPlugin<any>[] = [fileBrowserFactory, addDrives];
export default plugins;
