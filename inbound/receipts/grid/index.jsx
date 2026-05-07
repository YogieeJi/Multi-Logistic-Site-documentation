
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ShipmentsService } from '../../../../service/inbound/ShipmentService';
import { Link } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Badge } from 'primereact/badge';
import { Helmet } from 'react-helmet';
import titles from '../../../titles';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { ReceiptsService } from '../../../../service/inbound/ReceiptService';



export default function Receipts() {
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [receipts, setReceipts] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedReceipts, setSelectedReceipts] = useState(null);
    const [dates, setDates] = useState(null);
    const [displayConfirmation, setDisplayConfirmation] = useState(false);
    const toast = useRef();
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 25,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {
            rct_Code: { value: null, matchMode: 'contains' },
            status: { value: null, matchMode: 'contains' },

        }
    });
    const rowClassName = (rowData) => {
     
        return {
            'row-red': parseInt(rowData.exp_qty) != parseInt(rowData.act_qty),
            'row-success': parseInt(rowData.exp_qty) == parseInt(rowData.act_qty)
        };
    };
    const items = [{ label: 'Other' }, { label: 'Receipt'}];
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

        //imitate delay of a backend call
        networkTimeout = setTimeout(() => {
            ReceiptsService.getReceiptReportGrid( (lazyState) ).then((data) => {
                setTotalRecords(data.totalRecords);
                setReceipts(data.data);
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

        setSelectedReceipts(value);
        setSelectAll(value.length === totalRecords);
    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;

        if (selectAll) {
            ReceiptsService.getReceiptsGrid().then((data) => {
                setSelectAll(true);
                setSelectedReceipts(data.shipments);
            });
        } else {
            setSelectAll(false);
            setSelectedReceipts([]);
        }
    };

    const receiptNumberBodyTemplate = (rowData) => {
        return (
            <>
                <Link to={`${rowData.rct_Code}`}>{rowData.rct_Code}</Link>
            </>
        );
    };

    const StatusBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.created_at ?? '-'}
            </>
        );
    };


    

    const syncDetails = () => {
        setDisplayConfirmation(false)
        setLoading(true);
        ReceiptsService.syncData().then((data) => {
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
                <Button label="Sync Data" icon="pi pi-sync" severity="sucess" onClick={() => setDisplayConfirmation(true)} />
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
            <title>{titles.Shipments}</title>
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
            <h3>Receipts</h3>
            <DataTable 
                value={receipts} 
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
                rowsPerPageOptions={[25, 50, 100, 500, 1000]}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                loading={loading} 
                tableStyle={{ minWidth: '75rem' }}
                emptyMessage="No data found."
                selection={selectedReceipts} 
                onSelectionChange={onSelectionChange} 
                selectAll={selectAll} 
                onSelectAllChange={onSelectAllChange}
                rowClassName={rowClassName}    
                scrollable 
                scrollHeight="600px"
                removableSort
            >
                 <Column></Column>
           
                <Column field="rct_Code" header="Receipt #" body={receiptNumberBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                <Column field="exp_qty" sortable header="Total Expected Qty" body={(rowData) => parseInt(rowData.exp_qty)}  />
                <Column field="act_qty" sortable header="Total Actual Qty" body={(rowData) => parseInt(rowData.act_qty??0)}  />

            </DataTable>
        </div>
        </>
        
    );
}
        