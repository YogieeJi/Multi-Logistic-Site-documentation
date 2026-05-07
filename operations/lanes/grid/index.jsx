
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Helmet } from 'react-helmet';
import { Toast } from 'primereact/toast';
import { ZoneService } from '../../../../service/operations/ZoneService';
import { LanesService } from '../../../../service/operations/LanesService';
import { Dialog } from 'primereact/dialog';
import { useAuth } from '../../../../store/useAuth';



export default function LanesOperation() {
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [lanes, setLanes] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedLanes, setSelectedLanes] = useState(null);
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
            lane: { value: null, matchMode: 'contains' },
            slots_count: { value: null, matchMode: 'contains' },
        }
    });
    const {hasActionAccess} = useAuth();
    const PAGE_KEY = "operations_lanes";
    const items = [{ label: 'Conveyor' }, { label: 'Lanes'}];
    const home = { icon: 'pi pi-home', url: '/' }

    let networkTimeout = null;
  
    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    const loadLazyData = () => {
        setLoading(true);

        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }

        networkTimeout = setTimeout(() => {
            LanesService.getOccupiedLanesGrid( (lazyState) ).then((data) => {
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
            LanesService.getOccupiedLanesGrid().then((data) => {
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
            <>{rowData.lane}</>
        );
    };

    const slots_countBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.slots_count}
            </>
        );
    };

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <Button label="Free Lanes" icon="pi pi-delete-left" severity="sucess" onClick={() => {
                    if(selectedLanes != null && selectedLanes.length > 0){
                        setDisplayConfirmation(true)
                    } else{
                        toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 lane' });
                    }
                }} />
            </span>
        </div>
    );

    const confirmationDialogFooter = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => freeLanes()} className="p-button-text" autoFocus />
        </>
    );

    const freeLanes = () => {
        setDisplayConfirmation(false)
        setLoading(true);
        
        LanesService.freeLanes(selectedLanes).then((data) => {
            setLoading(false);
            if(data.error == 0){
                loadLazyData();
                setSelectAll(false);
                setSelectedLanes([]);
                toast.current.show({ severity: 'success', summary: 'Success Message', detail: data.message, life: 3000 });
            } else{
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
        });
    }

    return (
        <>
        <Helmet>
            <title>Lanes Operations | Sagis</title>
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
            <h3>Occupied Lanes</h3>
            <DataTable 
                value={lanes} 
                lazy 
                filterDisplay="row" 
                dataKey="lane" 
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
                removableSort
            >
                <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />

                <Column field="lane" sortable header="Lane" body={laneBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="slots_count" header="Assigned Slots Count" body={slots_countBodyTemplate}  />
            </DataTable>
        </div>
        </>
        
    );
}
        