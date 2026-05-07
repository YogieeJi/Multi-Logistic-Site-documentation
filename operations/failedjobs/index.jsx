
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Calendar } from 'primereact/calendar';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Helmet } from 'react-helmet';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';

import { FailJobs } from '../../../service/operations/failedjobslog';
import titles from '../../titles';
import { Button } from 'primereact/button';
import { useLazySort } from '../../../components/useLazySort';



export default function OutboundLogs() {
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [logs, setLogs] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedLogs, setSelectedLogs] = useState(null);
    const [dates, setDates] = useState(null);
    const [visible, setVisible] = useState(false);
    const [dialogText, setDialogText] = useState('');
    const toast = useRef();
    const [displayConfirmation1, setDisplayConfirmation1] = useState(false);
     const [displayConfirmation2, setDisplayConfirmation2] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: "",
        sortOrder: "",
        filters: {
            failed_at: { value: null, matchMode: 'contains' },
            payload: { value: null, matchMode: 'contains' },
            queue: { value: null, matchMode: 'contains' },
            uuid: { value: null, matchMode: 'contains' },

        }
    })

    const {onSort} = useLazySort(setlazyState);
    const items = [{ label: 'Other' }, { label: 'Failed Jobs'}];
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
            FailJobs.getFailJobs(lazyState)
        .then((response) => {
            if (response && response.data) {
                const { data, totalRecords } = response;
                if (data.length === 0) {
                    setTotalRecords(0);
                    setLogs(null);
                } else {
                    setTotalRecords(totalRecords || 0); 
                    setLogs(data);
                }
            } else {
              
                setTotalRecords(0);
                setLogs(null);
            }
        })
        .catch((error) => {
            console.error("Error fetching failed jobs:", error);
            setTotalRecords(0);
            setLogs(null);
        })
        .finally(() => {
            setLoading(false); 
            });
    }, Math.random() * 100 + 250);}

    const onPage = (event) => {
        setlazyState(event);
    };

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
            ActivityLog.getConveyorLogs().then((data) => {
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
                {rowData.logtext}
            </>
        );
    };

    const eventBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.StatusCode}
            </>
        );
    };

    const subjectRefBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.logsource}
            </>
        );
    };

    const createdAtBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.logtime}
            </>
        );
    };

  

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
        if(item.data){
            text += '<h5>Below data created</h5>';
            let keys = Object.keys(item.data);
            keys.forEach((key) => {
                text += key+' = '+item.data[key]+"<br>"
            });
        } else if(event == 'sync'){
            text += '<h5>Request</h5>';
            text += '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">'+item.request+'</meta>';
            text += '<br><h5>Response</h5>';
            text += JSON.stringify(item.response);
        } else if (event == 'error'){
            text += '<h5>Exception</h5>';
            text += item.error;
        }
       setDialogText(text)
    }
   

    const representativeRowFilterTemplate = (options) => {
        return (
            <Calendar value={dates} onChange={(e) => setDates(e.value)} selectionMode="range" readOnlyInput />

        );
    };

    const confirmationDialogFooter1 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation1(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => handleDelete()} className="p-button-text" autoFocus />
        </>
    );

    const confirmationDialogFooter2 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation2(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => handleRetry()} className="p-button-text" autoFocus />
        </>
    );

    const handleDelete = () => {
        setDisplayConfirmation1(false);
        setLoading(true);
        FailJobs.deleteFailJobs(selectedRow.id).then((data) => {
            setLoading(false);
            if(data.error == 0){
                toast.current.show({ severity: 'success', summary: 'Success Message', detail: data.message, life: 3000 });
            } else{
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
        
            loadLazyData();
        });
    };
      
    const handleRetry = () => {
        setDisplayConfirmation2(false);
        setLoading(true);
        FailJobs.retryFailJobs(selectedRow.id).then((data) => {
            setLoading(false);
            if(data.error == 0){
                toast.current.show({ severity: 'success', summary: 'Success Message', detail: data.message, life: 3000 });
            } else{
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
            
           loadLazyData();
        });
    };

    // Called when Delete icon is clicked
    const confirmDelete = (rowData) => {
        setSelectedRow(rowData); 
        setDisplayConfirmation1(true);
    };

    const confirmHandleRetry = (rowData) => {
        setSelectedRow(rowData); 
        setDisplayConfirmation2(true);
    };

    return (
        <>
        <Helmet>
            <title>{titles.Con}</title>
        </Helmet>
        <Toast ref={toast} />
        <BreadCrumb model={items} home={home} />
        <Dialog header="Log Detail" visible={visible} style={{ width: '50vw' }} onHide={() => setVisible(false)}>
            <p className="m-0" dangerouslySetInnerHTML={{__html: dialogText}}>
            </p>
        </Dialog>
        <Dialog header="Confirmation" visible={displayConfirmation1} onHide={() => setDisplayConfirmation1(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter1}>
            <div className="flex align-items-center justify-content-center">
                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                <span>Are you sure you want to remove this failed job?</span>
            </div>
        </Dialog>    

        <Dialog header="Confirmation" visible={displayConfirmation2} onHide={() => setDisplayConfirmation1(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter2}>
            <div className="flex align-items-center justify-content-center">
                <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                <span>Are you sure to try running this job again?</span>
            </div>
        </Dialog>      
       
        <h1></h1>
        <div className="card">
            <h3>Failed Jobs</h3>
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
                sortOrder={lazyState.sortOrder}
                onFilter={onFilter} 
                filters={lazyState.filters} 
                rowsPerPageOptions={[10, 25, 50, 100]}
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
           
                <Column field="uuid" sortable header="UUID" body={(rowData) => rowData.uuid} style={{ width: '9rem' }}  showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="queue" header="Type" body={(rowData) => rowData.queue} filterMenuStyle={{ width: '9rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                <Column field="payload" header="Pay Load" body={(rowData) => rowData.payload} filterMenuStyle={{ width: '3rem' }} sortable showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="failed_at" header="Failed At" body={(rowData) => rowData.failed_at} sortable showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column header="Action"
                body={(rowData) => (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Button 
                        icon="pi pi-trash" 
                        className="p-button-danger" 
                        onClick={() => confirmDelete(rowData)} 
                    />
                    <Button 
                        icon="pi pi-refresh" 
                        className="p-button-primary" 
                        onClick={() => confirmHandleRetry(rowData)} 
                    />
                    </div>
                )}
            />
            </DataTable>
        </div>
        </>
        
    );
}
        