
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Calendar } from 'primereact/calendar';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Helmet } from 'react-helmet';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { GeneralService } from '../../../service/inbound/GeneralService';
import titles from '../../titles';
import { Button } from 'primereact/button';
import { useLazySort } from '../../../components/useLazySort';
import { useAuth } from '../../../store/useAuth';

export default function InboundLogs() {
    const { hasActionAccess } = useAuth();
    const PAGE_KEY = "inbound_activityLogs";
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [logs, setLogs] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedLogs, setSelectedLogs] = useState(null);
    const [dates, setDates] = useState(null);
    const [visible, setVisible] = useState(false);
    const [dialogText, setDialogText] = useState('');
    const [displayArchiveConfirmation, setDisplayArchiveConfirmation] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);
    const [historyCreatedAt, setHistoryCreatedAt] = useState(null); 
    const toast = useRef();
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 25,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {
            description: { value: null, matchMode: 'contains' },
            event: { value: null, matchMode: 'contains' },
            subject_ref: { value: null, matchMode: 'contains' },
            module_id: { value: '1', matchMode: 'contains' },
            created_at: { value: null, matchMode: 'contains' },
        }
    });

            const { onSort } = useLazySort(setlazyState);
    

    const items = [{ label: 'Receipt' }, { label: 'Activity Logs'}];
    const home = { icon: 'pi pi-home', url: '/' }

    let networkTimeout = null;

    const getSeverity = (status) => {
        switch (status) {
            case 1:
                return 'info';

            case 2:
                return 'danger';

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
            GeneralService.getInboundLogs( (lazyState) ).then((data) => {
                setTotalRecords(data.totalRecords);
                setLogs(data.data);
                setHistoryCreatedAt(data.historyCreatedAt); 
                setLoading(false);
            });
        }, Math.random() * 100 + 250);
    };
    const performArchive = () => {
        setIsArchiving(true); // Disable the button
        GeneralService.archiveActivityLogs().then((data) => {
            if (data.error === 0) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message });
                loadLazyData(); // Reload the data after archiving
            } else {
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message });
            }
            setDisplayArchiveConfirmation(false); // Close the dialog
            setIsArchiving(false); // Re-enable the button
        }).catch(() => {
            setIsArchiving(false); // Re-enable the button in case of error
        });
    };
    
    const onPage = (event) => {
        setlazyState(event);
    };

    //  const onSort = (event) => {

    //     if (!event.sortField) {

    //         return; // Prevent crashing when event is empty

    //     }
    //     setlazyState((prevState) => {

    //         let newSortOrder;
    //     const currentSortOrder = prevState.sortOrder?.toString() || "0"; 

    //         if (prevState.sortField === event.sortField) {

    //             if (currentSortOrder === "1") {

    //                 newSortOrder = "-1";  // Descending

    //             } else if (currentSortOrder === "-1") {

    //                 newSortOrder = "0";  // No Sort

    //             } else {

    //                 newSortOrder = "1";  // Ascending

    //             }

    //         } else {

    //             newSortOrder = "1";

    //         }
    //        // If sorting is reset (0), clear the sort field

    //         const newSortField = newSortOrder === "0" ? "" : event.sortField;
    //   return {

    //             ...prevState,

    //             sortField: newSortField,  // Clear the field when sorting is reset

    //             sortOrder: newSortOrder,

    //         };

    //     });

    // };

    const onFilter = (event) => {
        event['first'] = 0;
        setlazyState(event);
    };

    const onSelectionChange = (event) => {
        const value = event.value;

        setSelectedLogs(value);
        setSelectAll(value.length === totalRecords);
    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;

        if (selectAll) {
            GeneralService.getInboundLogs().then((data) => {
                setSelectAll(true);
                setSelectedLogs(data.logs);
            });
        } else {
            setSelectAll(false);
            setSelectedLogs([]);
        }
    };

    const descriptionBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.description}
            </>
        );
    };

    const eventBodyTemplate = (rowData) => {
        let eventValue;
        if(rowData.event === 'created'){
            eventValue = 3;
        } else if(rowData.event === 'sync'){
            eventValue = 1;
        } else{
            eventValue = 2;
        }
        return (
            <>
                <Tag value={(rowData.event).toUpperCase()} severity={getSeverity(eventValue)} />
            </>
        );
    };

    const subjectRefBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.subject_ref}
            </>
        );
    };

   const createdAtBodyTemplate = (rowData) => {
    if (!rowData?.created_at) return null;

    const date = new Date(rowData.created_at);

    const formattedDate = date.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });

    return <span>{formattedDate}</span>;
};


    const archiveConfirmationDialogFooter = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayArchiveConfirmation(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={performArchive} className="p-button-text" autoFocus disabled={isArchiving} /> {/* Step 3 */}
        </>
    );
    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="block mt-2 md:mt-0 p-input-icon-left md:ml-auto">
                {hasActionAccess(PAGE_KEY, "archive_activity_log") &&(<Button label="Archive Activity Log" icon="pi pi-archive" severity="secondary" onClick={() => setDisplayArchiveConfirmation(true)} />)}&nbsp;
            </span>
        </div>
    );

    const actionBodyTemplate = (rowData) => {
        return (
            <>
                <Button icon="pi pi-ellipsis-h"  rounded className="mr-2" onClick={(e) => readMorePopup(e, rowData.properties, rowData.event)} />
            </>
        );
    };
    
    
    const readMorePopup = (e, item, event) => {
        e.preventDefault();
        setVisible(true);
        let text = '';
       

        // Ensure properties is parsed if it's a string

        let parsedProperties = {};

        try {

            parsedProperties = typeof item === "string" ? JSON.parse(item) : item;

        } catch (error) {

            console.error("Error parsing properties:", error);

            parsedProperties = {}; // Fallback in case of error

        }

    

        // Extract data/request/response if available

        const data = parsedProperties?.data || null;

        const request = parsedProperties?.request || null;

        const response = parsedProperties?.response || null;

    

        if (data) {  

            // Display shipment details

            text += '<h5>Below data created</h5>';

            Object.keys(data).forEach((key) => {

                text += `${key} = ${data[key]}<br>`;

            });

        } else if (event === 'sync') {

            // Display sync request and response

            text += '<h5>Request</h5>';

            text += `<meta http-equiv="Content-Type" content="text/html; charset=utf-8">${request || 'No request data'}</meta>`;

            text += '<br><h5>Response</h5>';

            text += JSON.stringify(response || 'No response data', null, 2);

        } 

        else if (event === 'error') {

            // Display error message

            text += '<h5>Exception</h5>';

            text += item?.error || 'No error data';

        }

    

        setDialogText(text);

    };    
   

    const representativeRowFilterTemplate = (options) => {
        return (
            <Calendar value={dates} onChange={(e) => setDates(e.value)} selectionMode="range" readOnlyInput />

        );
    };

    return (
        <>
        <Helmet>
            <title>{titles.Logs}</title>
        </Helmet>
        <Toast ref={toast} />
        <BreadCrumb model={items} home={home} />
        <Dialog header="Log Detail" visible={visible} style={{ width: '50vw' }} onHide={() => setVisible(false)}>
            <p className="m-0" dangerouslySetInnerHTML={{__html: dialogText}}>
            </p>
        </Dialog>
        <Dialog header="Confirmation" visible={displayArchiveConfirmation} onHide={() => setDisplayArchiveConfirmation(false)} style={{ width: '350px' }} modal footer={archiveConfirmationDialogFooter}>
        <div className="flex align-items-center justify-content-center">
            <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
            <span>Are you sure you want to archive activity logs?</span>
        </div>
    </Dialog>
        <h1></h1>
        <div className="card">
        <div className="flex justify-between items-center w-full">
            <h3 className="flex-shrink-0 mr-6">Activity Logs</h3>
            <div className="ml-auto flex items-center">
                <h3 className="font-medium whitespace-nowrap">Last Archive at:</h3>
                <p className="ml-1 mt-2 text-right">
                    <strong>{historyCreatedAt}</strong>
                </p>
            </div>
        </div>
            <DataTable 
                value={logs} 
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
                header={header}
                sortOrder={lazyState.sortOrder}
                onFilter={onFilter} 
                filters={lazyState.filters} 
                rowsPerPageOptions={[25, 50, 100, 500, 1000, 5000]}
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                loading={loading} 
                tableStyle={{ minWidth: '75rem' }}
                emptyMessage="No data found."
                onSelectAllChange={onSelectAllChange}
                scrollable 
                scrollHeight="600px"
                
            >
                <Column  headerStyle={{ width: '3rem' }} />
           
                <Column field="description" header="Description" body={descriptionBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                <Column field="event" sortable header="Event" body={eventBodyTemplate} style={{ width: '9rem' }}  showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="subject_ref" sortable filter header="Subject Reference" body={subjectRefBodyTemplate} showFilterMenu={false} filterPlaceholder="Search" />
                <Column field="created_at" header="Created At" body={createdAtBodyTemplate} sortable showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column header="Action" body={actionBodyTemplate} headerStyle={{ width: '3rem' }}></Column>

            </DataTable>
        </div>
        </>
        
    );
}
        