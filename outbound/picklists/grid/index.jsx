
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
import { PicklistService } from '../../../../service/outbound/PicklistService';
import { FileUpload } from 'primereact/fileupload';



export default function PickList() {
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [pickList, setPickList] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedPickList, setSelectedPickList] = useState(null);
    const [dates, setDates] = useState(null);
    const [displayConfirmation, setDisplayConfirmation] = useState(false);
    
    const [templateUrl, setTemplateUrl] = useState(false);
    let fileRef = useRef();

    const toast = useRef();
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {
            pick_list_id: { value: null, matchMode: 'contains' },
            sage_created_at: { value: null, matchMode: 'contains' },
            picklist_is_deleted: { value: null, matchMode: 'contains' },
            picklist_deleted_at: { value: null, matchMode: 'contains' },
            status: { value: null, matchMode: 'contains' },
        }
    });

    const items = [{ label: 'Other' }, { label: 'Pick List'}];
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
            PicklistService.getPicklistGrid( (lazyState) ).then((data) => {
                setTotalRecords(data.totalRecords);
                setPickList(data.data);
                setTemplateUrl(data.template_url)
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

        setSelectedPickList(value);
        setSelectAll(value.length === totalRecords);
    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;

        if (selectAll) {
            PicklistService.getPicklistGrid().then((data) => {
                setSelectAll(true);
                setSelectedPickList(data.shipments);
            });
        } else {
            setSelectAll(false);
            setSelectedPickList([]);
        }
    };

    const pickListIdBodyTemplate = (rowData) => {
        return (
            <>
                <Link to={`${rowData.id}`}>{rowData.pick_list_id}</Link>
            </>
        );
    };

    const sageCreatedAtBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.sage_created_at}
            </>
        );
    };

    const picklistIsDeletedBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.picklist_is_deleted == 1)?<Badge value="Yes" severity="success">N</Badge>:<Badge value="No" severity="danger"></Badge>}
            </>
        );
    };

    const statusBodyTemplate = (rowData) => {
        
        return (
            <Tag value={rowData.status} severity={getStatusSeverity(rowData.status)} />
        );
    };

    const picklistDeletedAtBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.picklist_deleted_at ?? '-'}
            </>
        );
    };

    const syncDetails = () => {
        setDisplayConfirmation(false)
        setLoading(true);
        PicklistService.syncData().then((data) => {
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

    const confirmationDialogFooter1 = (
        <>
            
            <Button type="button" label="Close" icon="pi pi-times" onClick={() => setDisplayConfirmation(false)} className="p-button-text" />
        </>
    );

    

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <Button label="Get PickList" icon="pi pi-sync" severity="sucess" onClick={() => setDisplayConfirmation(true)} />
            </span>
            {/* <span className="block mt-2 md:mt-0 p-input-icon-left">
                <Button label="Upload" icon="pi pi-upload" severity="secondary" onClick={() => setDisplayConfirmation(true)} />
            </span> */}
        </div>
    );

    const representativeRowFilterTemplate = (options) => {
        return (
            <Calendar value={dates} onChange={(e) => setDates(e.value)} selectionMode="range" readOnlyInput />

        );
    };

    const fileUploadHandler = ({files}) => {
        const [file] = files;
        uploadFile(file);
    };

    const uploadFile = async (inputFile) => {
        console.log(inputFile)
        let formData = new FormData();
        formData.append('inputFile', inputFile);

        console.log(formData)
        
        PicklistService.uploadData( formData ).then((data) => {
            if(data.error == 0){
                fileRef.clear();
                toast.current.show({ severity: 'success', summary: 'File Upload', detail: data.message});

                setLoading(true);
                PicklistService.getPicklistGrid( (lazyState) ).then((data) => {
                    setTotalRecords(data.totalRecords);
                    setPickList(data.data);
                    setTemplateUrl(data.template_url)
                    setLoading(false);
                });

                setDisplayConfirmation(false);

            } else{
                toast.current.show({ severity: 'error', summary: 'File Upload', detail: data.message, sticky: true});
                networkTimeout = setTimeout(() => {
                   toast.current.clear();
                }, 3000);
            }
           
        });
    };

    return (
        <>
        <Helmet>
            <title>{titles.PickList}</title>
        </Helmet>
        <Toast ref={toast} />
        <BreadCrumb model={items} home={home} />
        <Dialog header="Confirmation" visible={displayConfirmation} onHide={() => setDisplayConfirmation(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter}>
            <div className="flex align-items-center justify-content-center">
                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                <span>Are you sure you want to proceed?</span>
            </div>
        </Dialog>

        <Dialog header="Upload" visible={displayConfirmation} onHide={() => setDisplayConfirmation(false)} style={{ width: '550px' }} modal footer={confirmationDialogFooter1}>
        <Link to={templateUrl} >Download Template</Link>
        <h1></h1>
            <FileUpload name="file[]"
                    ref={(el) => fileRef = el}
                    customUpload={true}
                    uploadHandler={fileUploadHandler}
                    accept=".xls,.csv,.xlsx" 
                    maxFileSize={1000000} 
                    emptyTemplate={<p className="m-0">Drag and drop file here to upload.</p>} 
                />
        </Dialog>
        <h1></h1>
        <div className="card">
            <h3>PickList</h3>
            <DataTable 
                value={pickList} 
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
                emptyMessage="No record found."
                selection={selectedPickList} 
                onSelectionChange={onSelectionChange} 
                selectAll={selectAll} 
                onSelectAllChange={onSelectAllChange}
                header={header}
                scrollable 
                scrollHeight="600px"
                removableSort
            >
                <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
           
                <Column field="pick_list_id" header="Pick List  #" body={pickListIdBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                <Column field="sage_created_at" sortable header="Sage Created At" body={sageCreatedAtBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="picklist_is_deleted" sortable filter header="Pick List Deleted" body={picklistIsDeletedBodyTemplate} showFilterMenu={false} filterPlaceholder="Search" />
                <Column field="picklist_deleted_at" header="Pick List Deleted At" body={picklistDeletedAtBodyTemplate} sortable showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="status" header="Status" body={statusBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />

            </DataTable>
        </div>
        </>
        
    );
}
        