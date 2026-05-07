
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
import { TransfersService } from '../../../../service/inbound/TransferService';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Menu } from 'primereact/menu';
import { Badge } from 'primereact/badge';

export default function Transfers() {
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [transfers, setTransfers] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedTransfers, setSelectedTransfers] = useState(null);
    const [dates, setDates] = useState(null);
    const [displayConfirmation, setDisplayConfirmation] = useState(false);
    const [displayConfirmation1, setDisplayConfirmation1] = useState(false);
    const toast = useRef();
    const menuLeft = useRef(null);
    const [btnDisabled, setbtnDisabled] = useState(false);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {
            vcr_num: { value: null, matchMode: 'contains' },
            sage_created_at: { value: null, matchMode: 'contains' },
            status: { value: null, matchMode: 'contains' },
            mantis_imported_h: { value: '', matchMode: 'contains' }
        }
    });

    const items = [{ label: 'Other' }, { label: 'Transfers'}];
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

        //imitate delay of a backend call
        networkTimeout = setTimeout(() => {
            TransfersService.getTransfersGrid( (lazyState) ).then((data) => {
                
                setTotalRecords(data.totalRecords);
                setTransfers(data.data);
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
        
        setSelectedTransfers(value);
        setSelectAll(value.length === totalRecords);
    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;
        console.log(event.checked);
        if (selectAll) {
            setSelectedTransfers(transfers);
        } else {
            setSelectAll(false);
            setSelectedTransfers([]);
        }
    };

    const vcrNumBodyTemplate = (rowData) => {
        return (
            <Link to={`${rowData.id}`}>{rowData.vcr_num}</Link>
        );
    };

    const sageCreatedAtBodyTemplate = (rowData) => {
        return (
            <>
            {rowData.sage_created_at}
            </>
        );
    };
    
 
    const statusBodyTemplate = (rowData) => {
       
        return (
            <>
                {(rowData.status == 0)?<Badge value="Pending" severity="warning">Pending</Badge>: (rowData.status == 1) ? <Badge value="Processing" severity="info">Processing</Badge> : <Badge value="Completed" severity="success"></Badge>}
            </>
        );
    };
    const mantisImportedBodyTemplate = (rowData) => {
       
        return (
            <>
                {(rowData.mantis_imported_h == 0)?<Badge value="No" severity="danger">No</Badge>: <Badge value="Yes" severity="success"></Badge>}
            </>
        );
    };
    const stofcyBodyTemplate = (rowData) => {
       
        return (
            <>{rowData.stofcy} </>
        );
    }; 
    const fcydesBodyTemplate = (rowData) => {
       
        return (
            <>{rowData.fcydes} </>
        );
    }; 
       
    
    const syncDetails = () => {
        setDisplayConfirmation(false)
        setLoading(true);
        TransfersService.syncData().then((data) => {
            setLoading(false);
            if(data.error == 0){
                loadLazyData();
                toast.current.show({ severity: 'success', summary: 'Success Message', detail: data.message, life: 3000 });
            } else{
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
        });
    };
    const actionItems = [
        {
            label: 'Update Import Ready',
            icon: 'pi pi-sync',
            command: () => {
                if(selectedTransfers != null && selectedTransfers.length > 0){
                    onclick(setDisplayConfirmation1(true))
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 shipment' });
                }
            }
        },
      
    ];
    const updateImportReady = () => {

        // setbtnDisabled(true);
        data = {
            transfers: selectedTransfers,
        }
        

        
           
            TransfersService.updateImportReadyItems( data ).then((data) => {
                setLoading(false);
                if(data.error == 0){
                    toast.current.show({ severity: 'success', summary: 'Success', detail: data.message});
                    setSelectAll(false);
                    setSelectedTransfers([]);
                    loadLazyData();
                } 
                else{
                    toast.current.show({ severity: 'error', summary: 'Error', detail: data.message});
                }
                setbtnDisabled(false);
                setDisplayConfirmation1(false)
            });
        
        
        
    };
    const confirmationDialogFooter1 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation1(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" disabled={btnDisabled} onClick={() => updateImportReady()} className="p-button-text" autoFocus />
        </>
    );
    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                {/* <SplitButton label="Create Delivery" icon="pi pi-plus" onClick={() => setDisplayConfirmation3(true)} model={actionItems} /> */}
                <Menu model={actionItems} popup ref={menuLeft} id="popup_menu_left" />
                <Button label="Actions" icon="pi pi-align-left" className="mr-2" onClick={(event) => menuLeft.current.toggle(event)} aria-controls="popup_menu_left" aria-haspopup />

            </span>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
               <Button label="Sync Details" icon="pi pi-sync" severity="sucess" onClick={() => setDisplayConfirmation(true)} />
            </span>
        </div>


        
    );

    const confirmationDialogFooter = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => syncDetails()} className="p-button-text" autoFocus />
        </>
    );

    const representativeRowFilterTemplate = (options) => {
        return (
            <Calendar value={dates} onChange={(e) => setDates(e.value)} selectionMode="range" readOnlyInput />

        );
    };

    return (
        <>
        <Helmet>
            <title>{titles.Transfers}</title>
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
            <h3>Transfers</h3>
            <DataTable 
                value={transfers} 
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
                selection={selectedTransfers} 
                onSelectionChange={onSelectionChange} 
                selectAll={selectAll} 
                onSelectAllChange={onSelectAllChange}
                header={header}
                scrollable 
                scrollHeight="600px"
                removableSort
            >
                <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
           
                <Column field="vcr_num" header="VCRNUM" body={vcrNumBodyTemplate} filterMenuStyle={{ width: '10rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                <Column field="stofcy" header="STOFCY" body={stofcyBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="fcydes" header="FCYDES" body={fcydesBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="sage_created_at" sortable header="Sage Created At" body={sageCreatedAtBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="mantis_imported_h" header="Mantis Imported" body={mantisImportedBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="status" header="Status" body={statusBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                
            </DataTable>
        </div>
        </>
        
    );
}
        