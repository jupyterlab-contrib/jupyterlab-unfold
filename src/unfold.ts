/* eslint-disable @typescript-eslint/ban-ts-comment */

import { IDragEvent } from '@lumino/dragdrop';

import { ArrayExt, toArray } from '@lumino/algorithm';

import { ElementExt } from '@lumino/domutils';

import { PromiseDelegate, ReadonlyJSONObject } from '@lumino/coreutils';

import { Signal } from '@lumino/signaling';

import { DOMUtils, showErrorMessage } from '@jupyterlab/apputils';

import { JupyterFrontEnd } from '@jupyterlab/application';

import { Contents } from '@jupyterlab/services';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { renameFile } from '@jupyterlab/docmanager';

import { PathExt, IChangedArgs } from '@jupyterlab/coreutils';

import {
  DirListing,
  FileBrowser,
  FilterFileBrowserModel
} from '@jupyterlab/filebrowser';

import { ITranslator } from '@jupyterlab/translation';

import { LabIcon } from '@jupyterlab/ui-components';

import { IStateDB } from '@jupyterlab/statedb';

// @ts-ignore
import folderOpenSvgstr from '../style/icons/folder-open.svg';

/**
 * The class name added to drop targets.
 */
const DROP_TARGET_CLASS = 'jp-mod-dropTarget';

/**
 * The mime type for a contents drag object.
 */
const CONTENTS_MIME = 'application/x-jupyter-icontents';

export const folderOpenIcon = new LabIcon({
  name: 'ui-components:folder-open',
  svgstr: folderOpenSvgstr
});

/**
 * The namespace for the `FileTreeBrowser` class statics.
 */
export namespace FileTreeBrowser {
  /**
   * An options object for initializing a file tree browser widget.
   */
  export interface IOptions extends FileBrowser.IOptions {
    /**
     * A file browser model instance.
     */
    model: FilterFileTreeBrowserModel;

    /**
     * The JupyterFrontEnd app.
     */
    app: JupyterFrontEnd;
  }
}

/**
 * The namespace for the `DirTreeListing` class statics.
 */
export namespace DirTreeListing {
  /**
   * An options object for initializing a file tree listing widget.
   */
  export interface IOptions extends DirListing.IOptions {
    /**
     * A file browser model instance.
     */
    model: FilterFileTreeBrowserModel;
  }
}

/**
 * The namespace for the `FileTreeBrowser` class statics.
 */
export namespace FileTreeBrowser {
  /**
   * An options object for initializing a file tree browser widget.
   */
  export interface IOptions extends FileBrowser.IOptions {
    /**
     * A file browser model instance.
     */
    model: FilterFileTreeBrowserModel;
  }
}

/**
 * A filetree renderer.
 */
export class FileTreeRenderer extends DirListing.Renderer {
  constructor(model: FilterFileTreeBrowserModel) {
    super();

    this.model = model;
  }

  /**
   * Create the DOM node for a dir listing.
   */
  createNode(): HTMLElement {
    const node = document.createElement('div');
    const content = document.createElement('ul');
    content.className = 'jp-DirListing-content';
    node.appendChild(content);
    node.tabIndex = 1;
    return node;
  }

  populateHeaderNode(
    node: HTMLElement,
    translator?: ITranslator,
    hiddenColumns?: Set<DirListing.ToggleableColumn>
  ): void {
    // No-op we don't want any header
  }

  handleHeaderClick(
    node: HTMLElement,
    event: MouseEvent
  ): DirListing.ISortState | null {
    return null;
  }

  updateItemNode(
    node: HTMLElement,
    model: Contents.IModel,
    fileType?: DocumentRegistry.IFileType,
    translator?: ITranslator,
    hiddenColumns?: Set<DirListing.ToggleableColumn>,
    selected?: boolean
  ): void {
    super.updateItemNode(
      node,
      model,
      fileType,
      translator,
      hiddenColumns,
      selected
    );

    if (model.type === 'directory' && this.model.isOpen(model.path)) {
      const iconContainer = DOMUtils.findElement(
        node,
        'jp-DirListing-itemIcon'
      );

      folderOpenIcon.element({
        container: iconContainer,
        className: 'jp-DirListing-itemIcon',
        stylesheet: 'listing'
      });
    }

    // Removing old vbars
    while (
      node.firstChild !== null &&
      (node.firstChild as HTMLElement).classList.contains('jp-DirListing-vbar')
    ) {
      node.removeChild(node.firstChild);
    }

    // Adding vbars for subdirs
    for (let n = 0; n < model.path.split('/').length - 1; n++) {
      const vbar = document.createElement('div');
      vbar.classList.add('jp-DirListing-vbar');
      node.insertBefore(vbar, node.firstChild);
    }
  }

  private model: FilterFileTreeBrowserModel;
}

/**
 * A widget which hosts a filetree.
 */
// @ts-ignore: _onPathChanged is private upstream, need to change this
export class DirTreeListing extends DirListing {
  constructor(options: DirTreeListing.IOptions) {
    super({ ...options, renderer: new FileTreeRenderer(options.model) });
  }

  set singleClickToUnfold(value: boolean) {
    this._singleClickToUnfold = value;
  }

  get headerNode(): HTMLElement {
    return document.createElement('div');
  }

  sort(state: DirListing.ISortState): void {
    // @ts-ignore
    this._sortedItems = toArray(this.model.items());
    // @ts-ignore
    this._sortState = state;
    this.update();
  }

  get model(): FilterFileTreeBrowserModel {
    // @ts-ignore
    return this._model;
  }

  private async _eventDblClick(event: MouseEvent): Promise<void> {
    const entry = this.modelForClick(event);

    if (entry?.type === 'directory') {
      if (!this._singleClickToUnfold) {
        this.model.toggle(entry.path);
      }
    } else {
      super.handleEvent(event);
    }
  }

  _onPathChanged(): void {
    // It's a no-op to overwrite the base class behavior
  }

  private _eventDragEnter(event: IDragEvent): void {
    if (event.mimeData.hasData(CONTENTS_MIME)) {
      // @ts-ignore
      const index = this._hitTestNodes(this._items, event);

      let target: HTMLElement;
      if (index !== -1) {
        // @ts-ignore
        target = this._items[index];
      } else {
        target = event.target as HTMLElement;
      }
      target.classList.add(DROP_TARGET_CLASS);
      event.preventDefault();
      event.stopPropagation();
    }
  }

  private _eventDragOver(event: IDragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    event.dropAction = event.proposedAction;

    const dropTarget = DOMUtils.findElement(this.node, DROP_TARGET_CLASS);
    if (dropTarget) {
      dropTarget.classList.remove(DROP_TARGET_CLASS);
    }

    // @ts-ignore
    const index = this._hitTestNodes(this._items, event);

    let target: HTMLElement;
    if (index !== -1) {
      // @ts-ignore
      target = this._items[index];
    } else {
      target = event.target as HTMLElement;
    }
    target.classList.add(DROP_TARGET_CLASS);
  }

  private _eventDrop(event: IDragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    // @ts-ignore
    clearTimeout(this._selectTimer);
    if (event.proposedAction === 'none') {
      event.dropAction = 'none';
      return;
    }
    if (!event.mimeData.hasData(CONTENTS_MIME)) {
      return;
    }

    let target = event.target as HTMLElement;
    while (target && target.parentElement) {
      if (target.classList.contains(DROP_TARGET_CLASS)) {
        target.classList.remove(DROP_TARGET_CLASS);
        break;
      }
      target = target.parentElement;
    }

    // Get the path based on the target node.
    // @ts-ignore
    const index = ArrayExt.firstIndexOf(this._items, target);
    let newDir: string;

    if (index !== -1) {
      const item = toArray(this.model.items())[index];

      if (item.type === 'directory') {
        newDir = item.path;
      } else {
        newDir = PathExt.dirname(item.path);
      }
    } else {
      newDir = '';
    }

    // @ts-ignore
    const manager = this._manager;

    // Handle the items.
    const promises: Promise<Contents.IModel | null>[] = [];
    const paths = event.mimeData.getData(CONTENTS_MIME) as string[];

    if (event.ctrlKey && event.proposedAction === 'move') {
      event.dropAction = 'copy';
    } else {
      event.dropAction = event.proposedAction;
    }
    for (const path of paths) {
      const localPath = manager.services.contents.localPath(path);
      const name = PathExt.basename(localPath);
      const newPath = PathExt.join(newDir, name);
      // Skip files that are not moving.
      if (newPath === path) {
        continue;
      }

      if (event.dropAction === 'copy') {
        promises.push(manager.copy(path, newDir));
      } else {
        promises.push(renameFile(manager, path, newPath));
      }
    }
    Promise.all(promises).catch(error => {
      void showErrorMessage(
        // @ts-ignore
        this._trans._p('showErrorMessage', 'Error while copying/moving files'),
        error
      );
    });
  }

  /**
   * Handle 'mousedown' event
   *
   * Note: This allow to change the path to the root and clear selection when the user
   * is clicking on an empty space.
   */
  private _eventMouseDown(event: MouseEvent): void {
    const entry = this.modelForClick(event);

    if (entry) {
      if (entry.type === 'directory') {
        this.model.path = '/' + entry.path;

        if (this._singleClickToUnfold && event.button === 0) {
          this.model.toggle(entry.path);
        }
      } else {
        this.model.path = '/' + PathExt.dirname(entry.path);
      }
    } else {
      // TODO Upstream this logic to JupyterLab (clearing selection when clicking the empty space)?
      this.clearSelectedItems();
      this.update();

      this.model.path = this.model.rootPath;
    }
  }

  private _hitTestNodes(nodes: HTMLElement[], event: MouseEvent): number {
    return ArrayExt.findFirstIndex(
      nodes,
      node =>
        ElementExt.hitTest(node, event.clientX, event.clientY) ||
        event.target === node
    );
  }

  handleEvent(event: Event): void {
    switch (event.type) {
      case 'dblclick':
        this._eventDblClick(event as MouseEvent);
        break;
      case 'lm-dragenter':
        this._eventDragEnter(event as IDragEvent);
        break;
      case 'lm-dragover':
        this._eventDragOver(event as IDragEvent);
        break;
      case 'lm-drop':
        this._eventDrop(event as IDragEvent);
        break;
      case 'mousedown':
        super.handleEvent(event);
        this._eventMouseDown(event as MouseEvent);
        break;
      default:
        super.handleEvent(event);
        break;
    }
  }

  private _singleClickToUnfold = true;
}

/**
 * Filetree browser model with optional filter on element.
 */
export class FilterFileTreeBrowserModel extends FilterFileBrowserModel {
  constructor(options: FilterFileBrowserModel.IOptions) {
    super(options);

    this.contentManager = this.manager.services.contents;

    this._savedState = options.state || null;

    this._path = this.rootPath;
  }

  get path(): string {
    return this._path;
  }

  set path(value: string) {
    let needsToEmit = false;

    if (this._path !== value) {
      needsToEmit = true;
    }

    this._path = value;

    if (needsToEmit) {
      const pathChanged = this.pathChanged as Signal<
        this,
        IChangedArgs<string>
      >;

      pathChanged.emit({
        name: 'path',
        oldValue: this._path,
        newValue: PathExt.dirname(this._path)
      });
    }
  }

  /**
   * Change directory.
   *
   * @param path - The path to the file or directory.
   *
   * @returns A promise with the contents of the directory.
   */
  async cd(pathToUpdate = this.rootPath): Promise<void> {
    const result = await this.fetchContent(this.rootPath, pathToUpdate);

    // @ts-ignore
    this.handleContents({
      name: this.rootPath,
      path: this.rootPath,
      type: 'directory',
      content: result
    });

    if (this._savedState && this._stateKey) {
      void this._savedState.save(this._stateKey, { openState: this.openState });
    }

    this.onRunningChanged(
      this.manager.services.sessions,
      this.manager.services.sessions.running()
    );
  }

  /**
   * A promise that resolves when the model is first restored.
   */
  get restored(): Promise<void> {
    return this._isRestored.promise;
  }

  /**
   * Restore the state of the file browser.
   *
   * @param id - The unique ID that is used to construct a state database key.
   *
   * @param populate - If `false`, the restoration ID will be set but the file
   * browser state will not be fetched from the state database.
   *
   * @returns A promise when restoration is complete.
   *
   * #### Notes
   * This function will only restore the model *once*. If it is called multiple
   * times, all subsequent invocations are no-ops.
   */
  async restore(id: string, populate = true): Promise<void> {
    const { manager } = this;
    const key = `file-browser-${id}:openState`;
    const state = this._savedState;
    const restored = !!this._stateKey;

    if (restored) {
      return;
    }

    // Set the file browser key for state database fetch/save.
    this._stateKey = key;

    if (!populate || !state) {
      this._isRestored.resolve(undefined);
      return;
    }

    await manager.services.ready;

    try {
      const value = await state.fetch(key);

      if (!value) {
        await this.cd(this.rootPath);
        this._isRestored.resolve(undefined);
        return;
      }

      this.openState = (value as ReadonlyJSONObject)['openState'] as {
        [path: string]: boolean;
      };
      await this.cd(this.rootPath);
    } catch (error) {
      await this.cd(this.rootPath);
      await state.remove(key);
    }

    this._isRestored.resolve(undefined);
  }

  /**
   * Open/close directories to discover/hide a given path.
   *
   * @param pathToToggle - The path to discover/hide.
   */
  async toggle(pathToToggle = this.rootPath): Promise<void> {
    this.openState[pathToToggle] = !this.openState[pathToToggle];

    // Refresh
    this.cd(this.rootPath);
  }

  /**
   * Check whether a directory path is opened or not.
   *
   * @param path - The given path
   *
   * @returns Whether the directory is opened or not.
   *
   */
  isOpen(path: string): boolean {
    return !!this.openState[path];
  }

  private async fetchContent(
    path: string,
    pathToUpdate?: string
  ): Promise<Contents.IModel[]> {
    const result = await this.contentManager.get(path);

    if (!result.content) {
      return [];
    }

    let items: Contents.IModel[] = [];

    const sortedContent = this.sortContents(result.content);

    this.openState[path] = true;

    for (const entry of sortedContent) {
      items.push(entry);

      if (entry.type !== 'directory') {
        continue;
      }

      const isOpen =
        (pathToUpdate && pathToUpdate.startsWith('/' + entry.path)) ||
        this.isOpen(entry.path);

      if (isOpen) {
        const subEntryContent = await this.fetchContent(
          entry.path,
          pathToUpdate
        );

        items = items.concat(subEntryContent);
      } else {
        this.openState[entry.path] = false;
      }
    }

    return items;
  }

  /**
   * Sort the entries
   *
   * @param data: The entries to sort
   * @returns the sorted entries
   */
  private sortContents(data: Contents.IModel[]): Contents.IModel[] {
    const directories = data.filter(value => value.type === 'directory');
    const files = data.filter(value => value.type !== 'directory');

    const sortedDirectories = directories.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    const sortedFiles = files.sort((a, b) => a.name.localeCompare(b.name));

    return sortedDirectories.concat(sortedFiles);
  }

  protected onFileChanged(
    sender: Contents.IManager,
    change: Contents.IChangedArgs
  ): void {
    this.refresh();
  }

  private _isRestored = new PromiseDelegate<void>();
  private _savedState: IStateDB | null = null;
  private _stateKey: string | null = null;
  private _path: string;
  private contentManager: Contents.IManager;
  private openState: { [path: string]: boolean } = {};
}

/**
 * The filetree browser.
 */
export class FileTreeBrowser extends FileBrowser {
  constructor(options: FileTreeBrowser.IOptions) {
    super(options);

    this.mainPanel.layout?.removeWidget(this.crumbs);

    this.showLastModifiedColumn = false;
    this.showFileCheckboxes = false;
  }

  get showFileCheckboxes(): boolean {
    return false;
  }

  set showFileCheckboxes(value: boolean) {
    if (this.listing.setColumnVisibility) {
      this.listing.setColumnVisibility('is_selected', false);
      // @ts-ignore
      this._showFileCheckboxes = false;
    }
  }

  get showLastModifiedColumn(): boolean {
    return false;
  }

  set showLastModifiedColumn(value: boolean) {
    if (this.listing.setColumnVisibility) {
      this.listing.setColumnVisibility('last_modified', false);
    }
  }

  protected createDirListing(options: DirListing.IOptions): DirListing {
    // @ts-ignore: _onPathChanged is private upstream, need to change this
    return new DirTreeListing({
      model: this.model,
      translator: this.translator
    });
  }

  set useFuzzyFilter(value: boolean) {
    // No-op
  }

  model: FilterFileTreeBrowserModel;

  // @ts-ignore: _onPathChanged is private upstream, need to change this
  listing: DirTreeListing;
}
