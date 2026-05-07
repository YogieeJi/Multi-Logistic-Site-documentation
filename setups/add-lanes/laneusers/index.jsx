
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Helmet } from 'react-helmet';
import { Toast } from 'primereact/toast';
import { useDispatch, useSelector } from 'react-redux';
import { removeData } from "../../../../store/formMessage.slice"
import { ItemConversionService } from '../../../../service/setups/ItemConversionService';
import { Badge } from 'primereact/badge';
import { Dialog } from 'primereact/dialog';
import { FileUpload } from 'primereact/fileupload';
import { LanesSetupService } from '../../../../service/setups/LanesSetupService';
import { Dropdown } from 'primereact/dropdown';
import { UserSettingService } from '../../../../service/settings/UserSettingService';
import { addData } from '../../../../store/formMessage.slice';

export default function UserLanesSetup() {
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [lanes, setLanes] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedLanes, setSelectedLanes] = useState(null);
    const [displayConfirmation, setDisplayConfirmation] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [users, setUsers] = useState(null);
    const [removeData, setRemoveData] = useState(null);
    const currentUrl = window.location.pathname;
    const segments = currentUrl.split('/');
    const lane = segments[segments.length - 1];
    const laneId = segments[segments.length - 2];
   
    
    const selectedUserTemplate = (option, props) => {
        if (option) {
            return (
                <div className="flex align-items-center">
                    <div>{option.usr_Login}</div>
                </div>
            );
        }

        return <span>{props.placeholder}</span>;
    };

    const userOptionTemplate = (option) => {
        return (
            <div className="flex align-items-center">
                <div>{option.usr_Login}</div>
            </div>
        );
    };
    useEffect(() => {
        UserSettingService.getAllUsers().then((data) => {
            setUsers(data.data);
        });
    }, []);
   
    const toast = useRef();
    let fileRef = useRef();
    const navigate = useNavigate();
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 1,
        lane_id: laneId,
        sortField: "",
        sortOrder: "",
        filters: {
            usr_Login: { value: null, matchMode: 'contains' },
        }
    });

    const formMessageDetail = useSelector((state) => state.formMessage.detail)
    const formMessageSeverity = useSelector((state) => state.formMessage.severity)
    const formMessageSummary = useSelector((state) => state.formMessage.summary)
    
    const dispatch = useDispatch()


    const items = [{ label: 'Lane Users' }, { label: 'List'}];
    const home = { icon: 'pi pi-home', url: '/' }

    let networkTimeout = null;
  
    useEffect(() => {
        if(formMessageDetail != ''){
            toast.current.show({ severity: formMessageSeverity, summary: formMessageSummary, detail: formMessageDetail});
            dispatch(removeData());
        }
        loadLazyData();
    }, [lazyState]);

    const loadLazyData = () => {
        setLoading(true);

        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }

        networkTimeout = setTimeout(() => {
            LanesSetupService.getUserToLane( (lazyState) ).then((data) => {
                setTotalRecords(data.totalRecords);
                setLanes(data.data);
                setLoading(false);
            });
        }, Math.random() * 100 + 250);
    };

    const onPage = (event) => {
        setlazyState(event);
    };

    const onSort = (event) => {
        setlazyState(event);
    };

    const onFilter = (event) => {
        event['first'] = 0;
        setlazyState(event);
    };

    const onSelectionChange = (event) => {
        const value = event.value;

        setSelectedLanes(value);
        setSelectAll(value.length === totalRecords);
    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;

        if (selectAll) {
            LanesSetupService.getGrid().then((data) => {
                setSelectAll(true);
                setSelectedLanes(data.shipments);
            });
        } else {
            setSelectAll(false);
            setSelectedLanes([]);
        }
    };

    const laneBodyTemplate = (rowData) => {
        return (
            <div className='pl-4'>{rowData.usr_Login}</div>
        );
    };

    const is_activeBodyTemplate = (rowData) => {
        return (
            <Button icon="pi pi-times" size="small" rounded severity="danger" aria-label="Remove" onClick={() => confirmationBox(rowData) } />
        );
    };
    const usersLaneBodyTemplate = (rowData) => {
        return (
            <Link to={`${rowData.lane}`}>Manage Users</Link>
        );
    };
    const addLaneUser = () => {
        const data = {
            user_id: selectedUser.usr_ID,
            lane_id: laneId,
        }
       
        setLoading(true);
        LanesSetupService.addUserToLane( (data) ).then((data) => {
            setLoading(false);
            if(data.error == 0){
                setSelectedUser('');
                toast.current.show({ severity: 'success', summary: 'User Added to Lane', detail: data.message});
                dispatch(addData({severity: 'success', detail: data.message, summary: 'User Added to Lane'}));
                loadLazyData();
            } 
            else{
                toast.current.show({ severity: 'error', summary: 'Error while adding user to lane', detail: data.message});
            }
        });
    };
    const confirmationBox = (rowData) => {
        setRemoveData(rowData);
        
        setDisplayConfirmation(true);
    }
    const removeUser = () => {
        setDisplayConfirmation(false);
        const data = {
            user_id: removeData.usr_ID,
            lane_id: laneId,
        }
       
        setLoading(true);
        LanesSetupService.removeUserToLane( (data) ).then((data) => {
            setLoading(false);
            if(data.error == 0){
                setRemoveData(null);
                toast.current.show({ severity: 'success', summary: 'User remove from Lane', detail: data.message});
                dispatch(addData({severity: 'success', detail: data.message, summary: 'User remove from Lane'}));
                loadLazyData();
            } 
            else{
                toast.current.show({ severity: 'error', summary: 'Error while removing user from lane', detail: data.message});
            }
        });
    };
    
    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center" style={{ 'padding-bottom': '35px',
    'padding-top': '35px' }}>
            <span className="block mt-4 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <div className="p-inputgroup">
                    <Dropdown value={selectedUser} onChange={(e) => setSelectedUser(e.value)} options={users} optionLabel="usr_Login" placeholder="Select User" 
                    filter valueTemplate={selectedUserTemplate} itemTemplate={userOptionTemplate} className="w-full md:w-24rem" />
                    <Button label="Add User" icon="pi pi-plus" severity="sucess" onClick={() => addLaneUser()} />
                </div>
            </span>
        </div>
    );


    const confirmationDialogFooter = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => removeUser()} className="p-button-text" autoFocus />
        </>
    );

    return (
        <>
        <Helmet>
            <title>Lanes User Setup | Sagis</title>
        </Helmet>
        <Toast ref={toast} />
        <BreadCrumb model={items} home={home} />
        <Dialog header="Confirmation" visible={displayConfirmation} onHide={() => setDisplayConfirmation(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to proceed?</span>
                </div>
        </Dialog>
        <h1></h1>
        <div className="card">
            <h3>{lane}</h3>
            <DataTable 
                value={lanes} 
                lazy 
                filterDisplay="row" 
                dataKey="sku_mantis" 
                paginator
                showGridlines
                first={lazyState.first} 
                rows={lazyState.rows} 
                totalRecords={totalRecords} 
                onPage={onPage}
                onSort={onSort} 
                size={'small'}
                sortField={lazyState.sortField}    
                className="datatable-responsive"
                sortOrder={lazyState.sortOrder}
                onFilter={onFilter} 
                filters={lazyState.filters} 
                rowsPerPageOptions={[10, 25, 50, 100]}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                loading={loading} 
                tableStyle={{ minWidth: '75rem' }}
                emptyMessage="No records found."
                selection={selectedLanes} 
                onSelectionChange={onSelectionChange} 
                selectAll={selectAll} 
                onSelectAllChange={onSelectAllChange}
                header={header}
                scrollable 
                scrollHeight="600px"
                removableSort
            >
                <Column field="lane" header="Lane" body={laneBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="" header="Action" body={is_activeBodyTemplate} />

            </DataTable>
        </div>
        </>
        
    );
}
        