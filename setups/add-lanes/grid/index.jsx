
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
import { useLazySort } from '../../../../components/useLazySort';
import { useAuth } from '../../../../store/useAuth';


export default function LanesSetup() {
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [lanes, setLanes] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedLanes, setSelectedLanes] = useState(null);
    const [displayConfirmation, setDisplayConfirmation] = useState(false);
    const toast = useRef();
    let fileRef = useRef();
    const navigate = useNavigate();
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 25,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {
            title: { value: null, matchMode: 'contains' },
            is_active: { value: null, matchMode: 'contains' },
        }
    });
     const { hasActionAccess, hasPageAccess } = useAuth();
         const PAGE_KEY = "operations_employeeColor";
         const Detail_PAGE_KEY = "Employee_Color_details";
    const { onSort } = useLazySort(setlazyState);
    const formMessageDetail = useSelector((state) => state.formMessage.detail)
    const formMessageSeverity = useSelector((state) => state.formMessage.severity)
    const formMessageSummary = useSelector((state) => state.formMessage.summary)

    const dispatch = useDispatch()


    const items = [{ label: 'Conveyor' }, { label: 'Lanes'}];
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
            LanesSetupService.getGrid( (lazyState) ).then((data) => {
                setTotalRecords(data.totalRecords);
                setLanes(data.data);
                setLoading(false);
            });
        }, Math.random() * 100 + 250);
    };

    const onPage = (event) => {
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
            <Link to={`/operations/conveyor-lanes/${rowData.id}`}>{rowData.title}</Link>
        );
    };

    const is_activeBodyTemplate = (rowData) => {
        return (
            rowData.is_active
        );
    };
    const usersLaneBodyTemplate = (rowData) => {
        return (
            <Button label="Lane Users" outlined  size="small" raised onClick={() => navigate(`laneusers/${rowData.id}/${rowData.title}`)}/>
        );
    };
   
  

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            {/* <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <Button label="Add Lane" icon="pi pi-plus" severity="success" onClick={() => navigate("/setup/lanes/add")}  />
            </span> */}
            {/* <span className="block mt-2 md:mt-0 p-input-icon-left">
                <Button label="Upload" icon="pi pi-upload" severity="secondary" onClick={() => setDisplayConfirmation(true)} />
            </span> */}
        </div>
    );


    const confirmationDialogFooter = (
        <>
            
            <Button type="button" label="Close" icon="pi pi-times" onClick={() => setDisplayConfirmation(false)} className="p-button-text" />
        </>
    );



    return (
        <>
        <Helmet>
            <title>Lane to Users Setup | Sagis</title>
        </Helmet>
        <Toast ref={toast} />
        <BreadCrumb model={items} home={home} />
      
        <h1></h1>
        <div className="card">
            <h3>Lane to Users Setup</h3>
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
                rowsPerPageOptions={[25, 50, 100, 500, 1000]}
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
            >
                <Column field="title" sortable header="Lane" body={laneBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column   header="Lane Users" body={usersLaneBodyTemplate} />
                {/* <Column field="is_active" sortable header="Is Active" body={is_activeBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" /> */}

            </DataTable>
        </div>
        </>
        
    );
}
        