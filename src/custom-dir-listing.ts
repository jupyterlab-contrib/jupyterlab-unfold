//@ts-nocheck
/* eslint-disable @typescript-eslint/ban-ts-comment */

import { ArrayExt } from '@lumino/algorithm';

import { DirListing } from '@jupyterlab/filebrowser';

import { PathExt } from '@jupyterlab/coreutils';

import { renameFile, isValidFileName } from '@jupyterlab/docmanager';


/**
 * Customised DirListing for tree view
*/
export class CustomDirListing extends DirListing {
  rename(): Promise<string> {
    return this._doTreeRename();
  }

  private _doTreeRename(): Promise<string> {
    this._inRename = true;
    const items = this._sortedItems;
    const path = Object.keys(this.selection)[0];
    const index = ArrayExt.findFirstIndex(items, value => value.path === path);
    const row = this._items[index];
    const item = items[index];
    const nameNode = this.renderer.getNameNode(row);
    const original = item.name;
    this._editNode.value = original;
    this._selectItem(index, false);

    return Private.doRename(nameNode, this._editNode, original).then(
      newName => {
        this.node.focus();
        if (!newName || newName === original) {
          this._inRename = false;
          return original;
        }
        if (!isValidFileName(newName)) {
          void showErrorMessage(
            this._trans.__('Rename Error'),
            Error(
              this._trans._p(
                'showErrorMessage',
                '"%1" is not a valid name for a file. Names must have nonzero length, and cannot include "/", "\\", or ":"',
                newName
              )
            )
          );
          this._inRename = false;
          return original;
        }

        if (this.isDisposed) {
          this._inRename = false;
          throw new Error('File browser is disposed.');
        }

        const manager = this._manager;

        const oldModelPath = this._model.path;
        let modelPath = oldModelPath;
        // @ts-ignore
        // If item is directory, change the modelPath to the parent path, instead of the complete path for rename to work as expected
        if (item.type === 'directory' && this.model.path === '/' + item.path) {
          modelPath = '/' + PathExt.dirname(item.path);
        }

        const oldPath = PathExt.join(modelPath, original);
        const newPath = PathExt.join(modelPath, newName);
        const promise = renameFile(manager, oldPath, newPath);
        return promise
          .catch(error => {
            if (error !== 'File not renamed') {
              void showErrorMessage(
                this._trans._p('showErrorMessage', 'Rename Error'),
                error
              );
            }
            this._inRename = false;
            return original;
          })
          .then(() => {
            if (this.isDisposed) {
              this._inRename = false;
              throw new Error('File browser is disposed.');
            }
            if (this._inRename) {
              // No need to catch because `newName` will always exit.
              void this.selectItemByName(newName);
            }
            this._inRename = false;
            return newName;
          });
      }
    );
  }
}

/**
 * The namespace for the listing private data.
 */
namespace Private {
  /**
   * Handle editing text on a node.
   *
   * @returns Boolean indicating whether the name changed.
   */
  export function doRename(
    text: HTMLElement,
    edit: HTMLInputElement,
    original: string
  ): Promise<string> {
    const parent = text.parentElement as HTMLElement;
    parent.replaceChild(edit, text);
    edit.focus();
    const index = edit.value.lastIndexOf('.');
    if (index === -1) {
      edit.setSelectionRange(0, edit.value.length);
    } else {
      edit.setSelectionRange(0, index);
    }

    return new Promise<string>((resolve, reject) => {
      edit.onblur = () => {
        parent.replaceChild(text, edit);
        resolve(edit.value);
      };
      edit.onkeydown = (event: KeyboardEvent) => {
        switch (event.keyCode) {
          case 13: // Enter
            event.stopPropagation();
            event.preventDefault();
            edit.blur();
            break;
          case 27: // Escape
            event.stopPropagation();
            event.preventDefault();
            edit.value = original;
            edit.blur();
            break;
          case 38: // Up arrow
            event.stopPropagation();
            event.preventDefault();
            if (edit.selectionStart !== edit.selectionEnd) {
              edit.selectionStart = edit.selectionEnd = 0;
            }
            break;
          case 40: // Down arrow
            event.stopPropagation();
            event.preventDefault();
            if (edit.selectionStart !== edit.selectionEnd) {
              edit.selectionStart = edit.selectionEnd = edit.value.length;
            }
            break;
          default:
            break;
        }
      };
    });
  }

  /**
   * Sort a list of items by sort state as a new array.
   */
  export function sort(
    items: IIterator<Contents.IModel>,
    state: DirListing.ISortState
  ): Contents.IModel[] {
    const copy = toArray(items);
    const reverse = state.direction === 'descending' ? 1 : -1;

    if (state.key === 'last_modified') {
      // Sort by last modified (grouping directories first)
      copy.sort((a, b) => {
        const t1 = a.type === 'directory' ? 0 : 1;
        const t2 = b.type === 'directory' ? 0 : 1;

        const valA = new Date(a.last_modified).getTime();
        const valB = new Date(b.last_modified).getTime();

        return t1 - t2 || (valA - valB) * reverse;
      });
    } else {
      // Sort by name (grouping directories first)
      copy.sort((a, b) => {
        const t1 = a.type === 'directory' ? 0 : 1;
        const t2 = b.type === 'directory' ? 0 : 1;

        return t1 - t2 || b.name.localeCompare(a.name) * reverse;
      });
    }
    return copy;
  }

  /**
   * Get the index of the node at a client position, or `-1`.
   */
  export function hitTestNodes(
    nodes: HTMLElement[],
    event: MouseEvent
  ): number {
    return ArrayExt.findFirstIndex(
      nodes,
      node =>
        ElementExt.hitTest(node, event.clientX, event.clientY) ||
        event.target === node
    );
  }

  /**
   * Format bytes to human readable string.
   */
  export function formatFileSize(
    bytes: number,
    decimalPoint: number,
    k: number
  ): string {
    // https://www.codexworld.com/how-to/convert-file-size-bytes-kb-mb-gb-javascript/
    if (bytes === 0) {
      return '0 Bytes';
    }
    const dm = decimalPoint || 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    if (i >= 0 && i < sizes.length) {
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    } else {
      return String(bytes);
    }
  }

  /**
   * Update an inline svg caret icon in a node.
   */
  export function updateCaret(
    container: HTMLElement,
    float: 'left' | 'right',
    state?: 'down' | 'up' | undefined
  ): void {
    if (state) {
      (state === 'down' ? caretDownIcon : caretUpIcon).element({
        container,
        tag: 'span',
        stylesheet: 'listingHeaderItem',

        float
      });
    } else {
      LabIcon.remove(container);
      container.className = HEADER_ITEM_ICON_CLASS;
    }
  }
}
