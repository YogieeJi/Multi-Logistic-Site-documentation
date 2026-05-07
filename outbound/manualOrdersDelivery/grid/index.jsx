
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Helmet } from 'react-helmet';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { FileUpload } from 'primereact/fileupload';
import { OrdersImportService } from '../../../../service/outbound/OrdersImportService';
import { Tag } from 'primereact/tag';
import { Badge } from 'primereact/badge';



export default function ManualOrdersDelivery() {
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [pickListLines, setPickListLines] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedPickListLines, setSelectedPickListLines] = useState(null);
    const [dates, setDates] = useState(null);
    const [displayConfirmation, setDisplayConfirmation] = useState(false);
    const [templateUrl, setTemplateUrl] = useState(false);

    let fileRef = useRef();
    const params = useParams();

    
    const toast = useRef();
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {
            pick_list_id: { value: null, matchMode: 'contains' },
            order_code: { value: '', matchMode: 'contains' },
            order_type: { value: '', matchMode: 'contains' },
            item_no: { value: '', matchMode: 'contains' },
            item_reference: { value: '', matchMode: 'contains' },
            item_description: { value: '', matchMode: 'contains' },
            qty: { value: '', matchMode: 'contains' },
            uom: { value: '', matchMode: 'contains' },
            bpcord: { value: '', matchMode: 'contains' },
            dlvdat: { value: '', matchMode: 'contains' },
            shidat: { value: '', matchMode: 'contains' },
            site: { value: '', matchMode: 'contains' },
            lot_detail: { value: '', matchMode: 'contains' },
            delivery_sent: { value: '', matchMode: 'contains' },
        },
        
    });

    const items = [{ label: 'Outbound' }, { label: 'Orders'}];
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

        networkTimeout = setTimeout(() => {
            OrdersImportService.getDeliveryOrderLines((lazyState)).then((data) => {
                setTotalRecords(data.totalRecords);
                setPickListLines(data.data);
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

        setSelectedPickListLines(value);
        setSelectAll(value.length === totalRecords);
    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;

        if (selectAll) {
            // OrdersImportService.getDeliveryOrderLines((lazyState)).then((data) => {
                setSelectAll(true);
                setSelectedPickListLines(pickListLines);
            // });
        } else {
            setSelectAll(false);
            setSelectedPickListLines([]);
        }
    };

    const picklist_idBodyTemplate = (rowData) => {
        return (
            <>
                <Link to={`${rowData.id}`}>{rowData.pick_list_id}</Link>
            </>
        );
    };

    const orderIdBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.order_code}
            </>
        );
    };

    const orderTypeBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.order_type}
            </>
        );
    };

    const itemNoBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.item_no}
            </>
        );
    };

    const itemReferenceBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.item_reference}
            </>
        );
    };

   

    const qtyBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.qty}
            </>
        );
    };

    const uomBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.uom)}
            </>
        );
    };

    const lotBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.lot_detail)}
            </>
        );
    };

    const delivery_sentBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.delivery_sent == 1)?<Badge value="Processed" severity="success">N</Badge>:<Badge value="UnProcessed" severity="danger"></Badge>}
            </>
        );
    };

 

    

   

    

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                {/* <i className="pi pi-search" />
                <Button label="Create Delivey" icon="pi pi-sync" severity="sucess" onClick={() => setDisplayConfirmation(true)} /> */}
            </span>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <Button label="Export" icon="pi pi-download" severity="secondary" onClick={() => setDisplayConfirmation(true)} />
            </span>
        </div>
    );

  

    const confirmationDialogFooter = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => exportDetails()} className="p-button-text" autoFocus />
        </>
    );

    const exportDetails = () => {
        // console.log(selectedPickListLines)
        setDisplayConfirmation(false)
        setLoading(true);
        OrdersImportService.exportDeliveryOrderLines(selectedPickListLines).then((data) => {
            setLoading(false);
            if(data.error == 0){
                window.open(data.data);
                toast.current.show({ severity: 'success', summary: 'Success Message', detail: data.message, life: 3000 });
                loadLazyData();
                setSelectAll(false);
                setSelectedPickListLines([]);
            } else{
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
        });
    };



    return (
        <>
        <Helmet>
            <title>Delivery Orders</title>
        </Helmet>
        <Toast ref={toast} />
        <BreadCrumb model={items} home={home} />
        <Dialog header="Confirmation" visible={displayConfirmation} onHide={() => setDisplayConfirmation(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter}>
            <div className="flex align-items-center justify-content-center">
                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                <span>Are you sure you want to export data?</span>
            </div>
        </Dialog>

        <h1></h1>
        <div className="card">
            <h3>Delivery Orders</h3>
            <DataTable 
                value={pickListLines} 
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
                rowsPerPageOptions={[10, 25, 50, 100, 500, 1000, 5000]}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                loading={loading} 
                tableStyle={{ minWidth: '75rem' }}
                emptyMessage="No record found."
                selection={selectedPickListLines} 
                onSelectionChange={onSelectionChange} 
                selectAll={selectAll} 
                onSelectAllChange={onSelectAllChange}
                header={header}
                scrollable 
                scrollHeight="600px"
                removableSort
                filterDelay={800}
                
            >
                <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
           
                <Column field="pick_list_id" header="PickList ID" body={picklist_idBodyTemplate} bodyStyle={{width: '18rem'}} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                <Column field="order_code" header="Order #" body={orderIdBodyTemplate} headerStyle={{ width: '12rem' }} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                <Column field="order_type" sortable header="Order Type" headerStyle={{ width: '12rem' }} body={orderTypeBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="item_no" sortable filter header="Item No" headerStyle={{ width: '12rem' }} body={itemNoBodyTemplate} showFilterMenu={false} filterPlaceholder="Search" />
                <Column field="item_reference" header="Item Ref" headerStyle={{ width: '12rem' }} body={itemReferenceBodyTemplate} sortable showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="qty" sortable header="Qty" headerStyle={{ width: '12rem' }} body={qtyBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="uom" sortable filter header="UOM" headerStyle={{ width: '12rem' }} body={uomBodyTemplate} showFilterMenu={false} filterPlaceholder="Search" />
                <Column field="lot_detail" sortable filter header="Lot Detail" headerStyle={{ width: '12rem' }} body={lotBodyTemplate} showFilterMenu={false} filterPlaceholder="Search" />
                <Column field="delivery_sent" sortable header="Status" headerStyle={{ width: '12rem' }} body={delivery_sentBodyTemplate}  />

            </DataTable>
        </div>
        </>
        
    );
}
        