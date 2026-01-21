import * as React from 'react';
//import { requestAPI } from './handler';
import { VDomModel, VDomRenderer } from '@jupyterlab/ui-components';
import {
  Button,
  DataGrid,
  DataGridCell,
  DataGridRow,
  Search
} from '@jupyter/react-components';
import { useState } from 'react';
import { Drive } from './contents';
import { DocumentRegistry } from '@jupyterlab/docregistry';

interface IProps {
  model: DriveListModel;
  docRegistry: DocumentRegistry;
}
export interface IDriveInputProps {
  isName: boolean;
  value: string;
  getValue: (event: any) => void;
  updateSelectedDrives: (item: string, isName: boolean) => void;
}
export function DriveInputComponent(props: IDriveInputProps) {
  return (
    <div>
      <div className="row">
        <div className="column">
          <Search className="drive-search-input" onInput={props.getValue} />
        </div>
        <div className="column"></div>
        <Button
          className="input-add-drive-button"
          onClick={() => {
            props.updateSelectedDrives(props.value, props.isName);
          }}
        >
          add drive
        </Button>
      </div>
    </div>
  );
}

interface ISearchListProps {
  isName: boolean;
  value: string;
  filteredList: Array<string>;
  filter: (value: any) => void;
  updateSelectedDrives: (item: string, isName: boolean) => void;
}

export function DriveSearchListComponent(props: ISearchListProps) {
  return (
    <div className="drive-search-list">
      <div className="row">
        <div className="column">
          <Search className="drive-search-input" onInput={props.filter} />
        </div>
        <div className="column"></div>
      </div>
      {props.filteredList.map((item, index) => (
        <li key={item}>
          <div className="row">
            <div className="column">
              <div>{item} </div>
            </div>
            <div className="column">
              <Button
                className="search-add-drive-button"
                onClick={() => {
                  props.updateSelectedDrives(item, true);
                }}
              >
                add drive
              </Button>
            </div>
          </div>
        </li>
      ))}
    </div>
  );
}
interface IDriveDataGridProps {
  drives: Drive[];
}

export function DriveDataGridComponent(props: IDriveDataGridProps) {
  return (
    <div className="drive-data-grid">
      <DataGrid grid-template-columns="1f 1fr">
        <DataGridRow row-type="header">
          <DataGridCell className="data-grid-cell" grid-column="1">
            <b> name </b>
          </DataGridCell>
          <DataGridCell className="data-grid-cell" grid-column="2">
            <b> url </b>
          </DataGridCell>
        </DataGridRow>

        {props.drives.map((item, index) => (
          <DataGridRow key={item.name} row-type="default">
            <DataGridCell className="data-grid-cell" grid-column="1">
              {item.name}
            </DataGridCell>
            <DataGridCell className="data-grid-cell" grid-column="2">
              {item.baseUrl}
            </DataGridCell>
          </DataGridRow>
        ))}
      </DataGrid>
    </div>
  );
}

export function DriveListManagerComponent(props: IProps) {
  const [driveUrl, setDriveUrl] = useState('');
  const [driveName, setDriveName] = useState('');
  let updatedSelectedDrives = [...props.model.selectedDrives];
  const [selectedDrives, setSelectedDrives] = useState(updatedSelectedDrives);

  const nameList: Array<string> = [];

  for (const item of props.model.availableDrives) {
    if (item.name !== '') {
      nameList.push(item.name);
    }
  }
  const [nameFilteredList, setNameFilteredList] = useState(nameList);

  const isDriveAlreadySelected = (pickedDrive: Drive, driveList: Drive[]) => {
    const isbyNameIncluded: boolean[] = [];
    const isbyUrlIncluded: boolean[] = [];
    let isIncluded: boolean = false;
    driveList.forEach(item => {
      if (pickedDrive.name !== '' && pickedDrive.name === item.name) {
        isbyNameIncluded.push(true);
      } else {
        isbyNameIncluded.push(false);
      }
      if (pickedDrive.baseUrl !== '' && pickedDrive.baseUrl === item.baseUrl) {
        isbyUrlIncluded.push(true);
      } else {
        isbyUrlIncluded.push(false);
      }
    });

    if (isbyNameIncluded.includes(true) || isbyUrlIncluded.includes(true)) {
      isIncluded = true;
    }

    return isIncluded;
  };

  const updateSelectedDrives = (item: string, isName: boolean) => {
    updatedSelectedDrives = [...props.model.selectedDrives];
    let pickedDrive = new Drive(props.docRegistry);

    props.model.availableDrives.forEach(drive => {
      if (isName) {
        if (item === drive.name) {
          pickedDrive = drive;
        }
      } else {
        if (item !== driveUrl) {
          setDriveUrl(item);
        }
        pickedDrive.baseUrl = driveUrl;
      }
    });

    const checkDrive = isDriveAlreadySelected(
      pickedDrive,
      updatedSelectedDrives
    );
    if (checkDrive === false) {
      updatedSelectedDrives.push(pickedDrive);
    } else {
      console.warn('The selected drive is already in the list');
    }

    setSelectedDrives(updatedSelectedDrives);
    props.model.setSelectedDrives(updatedSelectedDrives);
    props.model.stateChanged.emit();
  };

  const getValue = (event: any) => {
    setDriveUrl(event.target.value);
  };

  const filter = (event: any) => {
    const query = event.target.value;
    let updatedList: Array<string>;

    updatedList = [...nameList];
    updatedList = updatedList.filter(item => {
      return item.toLowerCase().indexOf(query.toLowerCase()) !== -1;
    });
    setNameFilteredList(updatedList);
    if (nameFilteredList.length === 1 && nameFilteredList[0] !== '') {
      setDriveName(nameFilteredList[0]);
      setDriveUrl('');
    }
  };

  return (
    <>
      <div className="drive-list-manager">
        <div>
          <h3> Select drive(s) to be added to your filebrowser </h3>
        </div>
        <div className="row">
          <div className="column">
            <div> Enter a drive URL</div>
            <DriveInputComponent
              isName={false}
              value={driveUrl}
              getValue={getValue}
              updateSelectedDrives={(value, isName) =>
                updateSelectedDrives(value, isName)
              }
            />

            <div> Select drive(s) from list</div>
            <DriveSearchListComponent
              isName={true}
              value={driveName}
              filteredList={nameFilteredList}
              filter={filter}
              updateSelectedDrives={(value, isName) =>
                updateSelectedDrives(value, isName)
              }
            />
          </div>

          <div className="column">
            <div className="jp-custom-datagrid">
              <label> Selected drives </label>
              <label> </label>
              <DriveDataGridComponent drives={selectedDrives} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export class DriveListModel extends VDomModel {
  public availableDrives: Drive[];
  public selectedDrives: Drive[];

  constructor(availableDrives: Drive[], selectedDrives: Drive[]) {
    super();

    this.availableDrives = availableDrives;
    this.selectedDrives = selectedDrives;
  }
  setSelectedDrives(selectedDrives: Drive[]) {
    this.selectedDrives = selectedDrives;
  }
  async sendConnectionRequest(selectedDrives: Drive[]): Promise<boolean> {
    console.log(
      'Sending a request to connect to drive ',
      selectedDrives[selectedDrives.length - 1].name
    );
    const response = true;
    /*requestAPI('send_connectionRequest', {
      method: 'POST'
    })
      .then(data => {
        console.log('data:', data);
        return data;
      })
      .catch(reason => {
        console.error(
          `The jupyter_drive server extension appears to be missing.\n${reason}`
        );
        return;
      });*/
    return response;
  }
}

export class DriveListView extends VDomRenderer<DriveListModel> {
  constructor(model: DriveListModel, docRegistry: DocumentRegistry) {
    super(model);
    this.model = model;
    this.docRegistry = docRegistry;
  }
  render() {
    return (
      <>
        <DriveListManagerComponent
          model={this.model}
          docRegistry={this.docRegistry}
        />
      </>
    );
  }
  private docRegistry: DocumentRegistry;
}
