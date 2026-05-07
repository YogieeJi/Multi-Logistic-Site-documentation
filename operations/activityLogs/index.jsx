
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Calendar } from 'primereact/calendar';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Helmet } from 'react-helmet';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';

import { ActivityLog } from '../../../service/operations/activitylog';
import titles from '../../titles';
import { Button } from 'primereact/button';



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
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: "",
        sortOrder: "",
        filters: {
            id: { value: null, matchMode: 'contains' },
            RowNum: { value: null, matchMode: 'contains' },
            new_box: { value: null, matchMode: 'contains' },
            item_to_lane: { value: null, matchMode: 'contains' },
            logDate: { value: null, matchMode: 'contains' },
            delay: { value: null, matchMode: 'contains' },
        }
    })

    const items = [{ label: 'Conveyor' }, { label: 'Conveyor Logs'}];
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
            ActivityLog.getConveyorLogs( (lazyState) ).then((data) => {
               if(data.Data == null){

                setTotalRecords(0);
                setLogs(null);
               }else{
                    setTotalRecords(data.TotalRecords);
                    setLogs(data.Data.Logs);
               } 

                
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
       
        <h1></h1>
        <div className="card">
            <h3>Conveyor Logs</h3>
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
                removableSort
            >
                <Column  headerStyle={{ width: '3rem' }} />
           
                <Column field="RowNum" sortable header="Row No." body={(rowData) => rowData.RowNum} style={{ width: '9rem' }}  showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="id" header="Group ID" body={(rowData) => rowData.id} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                <Column field="logDate" header="Log Date" body={(rowData) => rowData.logDate} sortable showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="new_box" sortable filter header="New box" body={(rowData) => rowData.new_box} showFilterMenu={false} filterPlaceholder="Search" />
                <Column field="item_to_lane" header="Item to Lane" body={(rowData) => rowData.item_to_lane} sortable showFilterMenu={false} filter filterPlaceholder="Search" />
                <Column field="delay " header="Delay" body={(rowData) => rowData.delay} sortable showFilterMenu={false} filter filterPlaceholder="Search" />
            </DataTable>
        </div>
        </>
        
    );
}
        