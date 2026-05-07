import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Helmet } from 'react-helmet';
import { Toast } from 'primereact/toast';
import { useDispatch, useSelector } from 'react-redux';
import { removeData } from "../../../../store/formMessage.slice";
import { Dialog } from 'primereact/dialog';
import { Badge } from 'primereact/badge';
import { ManageTrucksService } from '../../../../service/setups/ManageTrucksService';
import { useAuth } from '../../../../store/useAuth';

export default function AllUsers() {
    const [showbutton, setShowbutton] = useState(false);
    const [buttonLabel, setButtonLabel] = useState(null);
    const [buttonStatus, setButtonStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [users, setUsers] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState(null);
    const [displayConfirmation, setDisplayConfirmation] = useState(false);

    const toast = useRef();
    const navigate = useNavigate();
    
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 25,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {
            usr_Login: { value: null, matchMode: 'contains' },
            usr_Name: { value: null, matchMode: 'contains' },
            usr_Address: { value: null, matchMode: 'contains' },
            LogisticSite: { value: null, matchMode: 'contains' },
        }
    });
     const {hasActionAccess} = useAuth();
         const PAGE_KEY = "admin_user";
    const formMessageDetail = useSelector((state) => state.formMessage.detail)
    const formMessageSeverity = useSelector((state) => state.formMessage.severity)
    const formMessageSummary = useSelector((state) => state.formMessage.summary)

    const dispatch = useDispatch()

    const items = [{ label: 'Manage Users' }, { label: 'List'}];
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
            ManageTrucksService.getMantisAllUsers(lazyState).then((data) => {
                setTotalRecords(data.totalRecords);
                setUsers(data.data);
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
        setSelectedUsers(value);
        setSelectAll(value.length === totalRecords);
    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;
        
        if (selectAll) {
            setSelectAll(true);
            setSelectedUsers(users);
        } else {
            setSelectAll(false);
            setSelectedUsers([]);
        }
    };

    const loginBodyTemplate = (rowData) => {
        return <>{rowData.usr_Login}</>;
    };

    const nameBodyTemplate = (rowData) => {
        return <>{rowData.usr_Name}</>;
    };
    const addressBodyTemplate = (rowData) => {
        return <>{rowData.usr_Address}</>;
    };

    const logisticSiteBodyTemplate = (rowData) => {
        return <>{rowData.LogisticSite}</>;
    };

    const statusBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.usr_InactiveLED === "1" ? 
                    <Badge value="Inactive" severity="danger"></Badge> : 
                    <Badge value="Active" severity="success"></Badge>
                }
            </>
        );
    };

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                 {hasActionAccess(PAGE_KEY, "add_user") &&(<Button label="Add User" icon="pi pi-plus" severity="primary" onClick={() => navigate("/users/adminusers/add")} />)}
            </span>
        </div>
    );

    return (
        <>
            <Helmet>
                <title>Manage Users | Sagis</title>
            </Helmet>
            <Toast ref={toast} />
            <BreadCrumb model={items} home={home} />
            
            <div className="card">
                <h3>Manage Users</h3>
                <DataTable 
                    value={users} 
                    lazy 
                    filterDisplay="row" 
                    dataKey="usr_ID" 
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
                    rowsPerPageOptions={[25, 50, 100, 500, 1000]}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                    loading={loading} 
                    tableStyle={{ minWidth: '75rem' }}
                    emptyMessage="No users found."
                    selection={selectedUsers} 
                    onSelectionChange={onSelectionChange} 
                    selectAll={selectAll} 
                    onSelectAllChange={onSelectAllChange}
                    header={header}
                    scrollable 
                    scrollHeight="600px"
                    removableSort
                >
                   
                    <Column field="usr_Name" sortable header="Name" body={nameBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="usr_Address" sortable header="Address" body={addressBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="usr_Login" sortable header="Login" body={loginBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="LogisticSite" sortable header="Logistic Site" body={logisticSiteBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="usr_InactiveLED" sortable header="Status" body={statusBodyTemplate} showFilterMenu={false} />
                </DataTable>
            </div>
        </>
    );
}