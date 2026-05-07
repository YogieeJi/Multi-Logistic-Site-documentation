
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Helmet } from 'react-helmet';
import titles from '../../../titles';
import { Tag } from 'primereact/tag';
import { ContainersService } from '../../../../service/inbound/ContainerService';
import { Badge } from 'primereact/badge';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';


export default function Containers() {
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [containers, setContainers] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedContainers, setSelectedContainers] = useState(null);
    const [dates, setDates] = useState(null);
    const [displayConfirmation, setDisplayConfirmation] = useState(false);
    const toast = useRef();
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {
            ctrnum: { value: null, matchMode: 'contains' },
            fcy: { value: null, matchMode: 'contains' },
            bpsnum: { value: null, matchMode: 'contains' },
            shipnum: { value: null, matchMode: 'contains' },
            create_dat_tim: { value: null, matchMode: 'contains' },
            conveyable: { value: null, matchMode: 'contains' },
            extrcpdat: { value: null, matchMode: 'contains' },
            status: { value: null, matchMode: 'contains' },
        }
    });

    const items = [{ label: 'Other' }, { label: 'Containers'}];
    const home = { icon: 'pi pi-home', url: '/' }

    let networkTimeout = null;

    const getStatusSeverity = (status) => {
       if(status){
            if(status.includes('1-')){
                return 'primary';
            } else if(status.includes('3-')){
                return 'success';
            } else{
                return 'info';
            }
        }
    };

    const getSeverity = (status) => {
      
        switch (status) {
            case 1:
                return 'info';

            case 2:
                return 'warning';

            case 3:
                return 'success';

            case 4:
                return 'danger';
        }
    };


    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    const loadLazyData = () => {
        setLoading(true);

        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }

        //imitate delay of a backend call
        networkTimeout = setTimeout(() => {
            ContainersService.getContainersGrid( (lazyState) ).then((data) => {
                console.log(data);
                setTotalRecords(data.totalRecords);
                setContainers(data.data);
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

        setSelectedShipments(value);
        setSelectAll(value.length === totalRecords);
    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;

        if (selectAll) {
            ContainersService.getContainersGrid().then((data) => {
                setSelectAll(true);
                setSelectedContainers(data.shipments);
            });
        } else {
            setSelectAll(false);
            setSelectedContainers([]);
        }
    };

    const ctrnumBodyTemplate = (rowData) => {
        return (
            <Link to={`${rowData.id}`}>{rowData.ctrnum}</Link>
        );
    };

    const fcyBodyTemplate = (rowData) => {
        return (
            <>
            {rowData.fcy}
            </>
        );
    };

    const bpsnumBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.bpsnum}
            </>
        );
    };

    const shipnumBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.shipnum}
            </>
        );
    };

    const createdattimBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.create_dat_tim}
            </>
        );
    };

    const conveyableBodyTemplate = (rowData) => {
        let conveyableValue;
        let conveyableStatus;

        if(rowData.conveyable == 0){
            conveyableValue = 'Non Conveyable';
            conveyableStatus = 4;
        } else if(rowData.conveyable == 1){
            conveyableValue = 'Conveyable';
            conveyableStatus = 3;
        } else{
            conveyableValue = 'Mix';
            conveyableStatus = 2;
        }
        return (
            <>
                <Tag value={conveyableValue} severity={getSeverity(conveyableStatus)} />
            </>
        );
    };

    const extrcpdatBodyTemplate = (rowData) => {
        return (
            <>
            {rowData.extrcpdat}
            </>
        );
    };

    const statusBodyTemplate = (rowData) => {
        
        return (
            <Tag value={rowData.status} severity={getStatusSeverity(rowData.status)} />
        );
    };
    

    const syncDetails = () => {
        setDisplayConfirmation(false)
        setLoading(true);
        ContainersService.syncData().then((data) => {
            setLoading(false);
            if(data.error == 0){
                loadLazyData();
                toast.current.show({ severity: 'success', summary: 'Success Message', detail: data.message, life: 3000 });
            } else{
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
        });
    };

    const confirmationDialogFooter = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => syncDetails()} className="p-button-text" autoFocus />
        </>
    );

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <Button label="Sync Details" icon="pi pi-sync" severity="sucess" onClick={() => setDisplayConfirmation(true)} />
            </span>
        </div>
    );

    const representativeRowFilterTemplate = (options) => {
        return (
            <Calendar value={dates} onChange={(e) => setDates(e.value)} selectionMode="range" readOnlyInput />

        );
    };

    return (
        <>
        <Helmet>
            <title>{titles.Containers}</title>
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
            <h3>Containers</h3>
            <DataTable 
                value={containers} 
                lazy 
                filterDisplay="row" 
                dataKey="id" 
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
                emptyMessage="No data found."
                selection={selectedContainers} 
                onSelectionChange={onSelectionChange} 
                selectAll={selectAll} 
                onSelectAllChange={onSelectAllChange}
                header={header}
                scrollable 
                scrollHeight="600px"
                removableSort
            >
                <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
           
                <Column field="ctrnum" header="Container #" body={ctrnumBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                <Column field="fcy" sortable header="FCY" body={fcyBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="bpsnum" sortable filter header="Supplier" body={bpsnumBodyTemplate} showFilterMenu={false} filterPlaceholder="Search" />
                <Column field="shipnum" header="Shipment #" body={shipnumBodyTemplate} sortable showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="create_dat_tim" header="Created At" body={createdattimBodyTemplate} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                <Column field="conveyable" sortable header="Conveyable" body={conveyableBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="extrcpdat" sortable filter header="Expected At" body={extrcpdatBodyTemplate} showFilterMenu={false} filterPlaceholder="Search" />
                <Column field="status" header="Status" body={statusBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />

            </DataTable>
        </div>
        </>
        
    );
}
        