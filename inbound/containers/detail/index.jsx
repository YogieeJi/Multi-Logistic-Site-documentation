
import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Tag } from 'primereact/tag';
import { ContainersService } from '../../../../service/inbound/ContainerService';

import { GeneralService } from '../../../../service/inbound/GeneralService';
import { Dialog } from 'primereact/dialog';
import { Sidebar } from 'primereact/sidebar';
import { Timeline } from 'primereact/timeline';
import { Badge } from 'primereact/badge';

export default function ContainerDetails() {
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [container, setContainer] = useState(null);
    const [containerDetail, setContainerDetail] = useState({
        'created_at':'-',
        'fcy': '-'
    });

    const [containerLines, setContainerLines] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedContainers, setSelectedContainers] = useState(null);

    const [statusValue, setStatusValue] = useState(null);
    const [visibleRight, setVisibleRight] = useState(false);

    const [dates, setDates] = useState(null);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 1,
        sortField: null,
        sortOrder: null,
        filters: {
            pohnum: { value: '', matchMode: 'contains' },
            poplin: { value: '', matchMode: 'contains' },
            itmref: { value: '', matchMode: 'contains' },
            qtyuom: { value: '', matchMode: 'contains' },
            ctrlin: { value: '', matchMode: 'contains' },
            qtyweu: { value: '', matchMode: 'contains' },
            qtyvou: { value: '', matchMode: 'contains' },
            uom: { value: '', matchMode: 'contains' },
            mantis_imported: { value: '', matchMode: 'contains' },
            is_receipt_complete: { value: '', matchMode: 'contains' },
            is_receipt_sent: { value: '', matchMode: 'contains' },
            receipt_number: { value: '', matchMode: 'contains' },
            status: { value: '', matchMode: 'contains' },

        }
    });

    const [logs, setLogs] = useState(null);
    const [visible, setVisible] = useState(false);
    const [dialogText, setDialogText] = useState('');

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

    const reactRouterLink = (label, url) => {
        return (<Link to={url}>{label}</Link>);
    }

    const items = [{ label: 'Inbound' }, {  template: reactRouterLink('Container','/inbound/containers')}];
    const home = { icon: 'pi pi-home', url: '/' }

    let networkTimeout = null;
    const params = useParams();

    const logTopics = useState({
        moduleId: 1,
        subModuleId: 2,
        subjectId: params.id
    });

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    

    const loadLazyData = () => {
        ContainersService.getContainerDetail( params.id ).then((data) => {
            setContainerDetail(data.data);
        });
        if(containerDetail.status == 1){
            setStatusValue('Pending');
        } else if(containerDetail.status == 2){
            setStatusValue('Processing');
        } else{
            setStatusValue('Completed');
        }
        setLoading(true);


        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }

        //imitate delay of a backend call
        networkTimeout = setTimeout(() => {
            ContainersService.getContainerLines( params.id,(lazyState) ).then((data) => {
                setTotalRecords(data.totalRecords);
                setContainerLines(data.data);
                setLoading(false);
            });
        }, Math.random() * 100 + 250);

        GeneralService.getLogs(logTopics[0]).then((data) => {
            setLogs(data.data);
        });


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

        setSelectedContainers(value);
        setSelectAll(value.length === totalRecords);
    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;

        if (selectAll) {
            ContainersService.getContainerLines(params.id).then((data) => {
                setSelectAll(true);
                setSelectedContainers(data.shipments);
            });
        } else {
            setSelectAll(false);
            setSelectedContainers([]);
        }
    };

    const pohnumBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.pohnum}
            </>
        );
    };

    const poplinBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.poplin}
            </>
        );
    };

    const itmrefDateBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.itmref}
            </>
        );
    };

    const qtyuomBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.qtyuom}
            </>
        );
    };

    const ctrlinBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.ctrlin}
            </>
        );
    };

    const qtyweuBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.qtyweu}
            </>
        );
    };

    const qtyvouBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.qtyvou)}
            </>
        );
    };


    const uomBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.uom ?? '-'}
            </>
        );
    };

    const mantisImportedBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.mantis_imported == 1)?<Badge value="Yes" severity="success">N</Badge>:<Badge value="No" severity="danger"></Badge>}
            </>
        );
    };

    const isReceiptCompleteBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.is_receipt_complete == 1)?<Badge value="Yes" severity="success">N</Badge>:<Badge value="No" severity="danger"></Badge>}
            </>
        );
    };

    const isReceiptSentBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.is_receipt_sent == 1)?<Badge value="Yes" severity="success">N</Badge>:<Badge value="No" severity="danger"></Badge>}
            </>
        );
    };

    const receiptNumberBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.receipt_number ?? '-'}
            </>
        );
    };

    const statusBodyTemplate = (rowData) => {
        
        return (
            <Tag value={rowData.status} severity={getStatusSeverity(rowData.status)} />
        );
    };

    const syncDetails = () => {
        // dt.current.exportCSV();
        console.log(selectedShipments);
    };

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <Button label="Sync Details" icon="pi pi-sync" severity="sucess" onClick={syncDetails} />
            </span>
        </div>
    );

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



    const customizedContent = (item) => {
        let causerName = item.causer_id ? item.causer_name : 'System';
        let date = new Date(item.created_at);
        return (
            <div className='timeline_content'>
                <div className='main_line'>
                    <p><span style={{fontWeight:'bold'}}>{date.getFullYear()+'-'+date.getMonth()+'-'+date.getDate()+' '+date.getHours()+':'+date.getMinutes()+':'+date.getSeconds()}</span> - {item.description}...</p>
                    <a href='' onClick={(e) => readMorePopup(e, item.properties, item.event)}>read more</a>

                </div>
                <div className='secondary_line'>
                    <p>By <span style={{fontWeight:'bold'}}>{causerName}</span></p>
                    <Button label={item.event.toUpperCase()} className={item.event == 'created' ? 'status_btn  btn_success' : (item.event == 'error') ? 'status_btn  btn_danger' : 'status_btn  btn_info'}></Button>
                </div>
                
            </div>
        );
    };



    return (
        <>
            {/* <BreadCrumb model={items} home={home} /> */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Container # {containerDetail.ctrnum}</h3>
                <div className='page-headerActions' style={{ display: "flex", gap: 30, alignItems: 'center' }}>
                    <span onClick={() => setVisibleRight(true)} style={{ cursor: 'pointer', fontWeight: 500, fontSize: '18px', lineHeight: '21px', color: '#222222' }}><i className='pi pi-list' style={{ fontWeight: '600', fontSize: '20px' }}></i><span className='p-badge p-component p-badge-no-gutter p-badge-danger'></span>View Logs</span>
                    {/* <span style={{ fontWeight: 500, fontSize: '18px', lineHeight: '21px', color: '#222222' }}><i className='pi m-left' style={{ fontWeight: '500', fontSize: '20px' }}></i> Back</span> */}
                </div>
            </div>
            <h1></h1>
            <Sidebar className='logs_sidebar'  visible={visibleRight} onHide={() => setVisibleRight(false)} baseZIndex={1000} position="right">
                <div className='side_barHeader mt-4'>
                    <div className='left_centent'>Logs</div>
                    <div className='right_centent'><i className='pi m-check-circle mr-1'></i>Mark all as read</div>
                </div>
                <div className='mt-6'>
                    <Timeline className='logs_timeline' value={logs} content={customizedContent} />
                </div>
                
            </Sidebar>

            <Dialog header="Log Detail" visible={visible} style={{ width: '50vw' }} onHide={() => setVisible(false)}>
                <p className="m-0" dangerouslySetInnerHTML={{__html: dialogText}}>
                </p>
            </Dialog>
            <div className="card">
            {/* <h3>Container</h3> */}
            
            <h1></h1>
                    <div className="p-fluid formgrid grid">
                        <div className="field col-12 md:col-4">
                            <h5 id="created_at">Created At</h5>
                            <p htmlFor="created_at">{containerDetail.created_at}</p>
                            
                        </div>
                        <div className="field col-12 md:col-4">
                            <h5 id="warehouse">Warehouse</h5>
                            <p htmlFor="warehouse">{containerDetail.fcy}</p>
                            
                        </div>
                        <div className="field col-12 md:col-4">
                            <h5 id="status">Status</h5>
                            <Tag value={statusValue} severity={getSeverity(containerDetail.status)} />
                            
                        </div>
                    </div>
            </div>
            <div className="card">
                <h3>Container Lines</h3>
                <h1></h1>
                <DataTable 
                    value={containerLines} 
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
                    scrollable 
                    scrollHeight="600px"
                    removableSort
                >
                    <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
            
                    <Column field="pohnum" header="Order #" body={pohnumBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="poplin" sortable header="Order Line" body={poplinBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="itmref" sortable filter header="Item Ref" body={itmrefDateBodyTemplate} showFilterMenu={false} filterPlaceholder="Search" />
                    <Column field="qtyuom" header="UOM Qty" body={qtyuomBodyTemplate} sortable showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="ctrlin" header="Container Line" body={ctrlinBodyTemplate} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="qtyweu" sortable header="Weight Qty" body={qtyweuBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="qtyvou" sortable filter header="Volume Qty" body={qtyvouBodyTemplate} showFilterMenu={false} filterPlaceholder="Search" />
                    <Column field="uom" header="UOM" body={uomBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="mantis_imported" header="Mantis Imported" body={mantisImportedBodyTemplate} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="is_receipt_complete" sortable header="Receipt Complete" body={isReceiptCompleteBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="is_receipt_sent" sortable filter header="Receipt Sent" body={isReceiptSentBodyTemplate} showFilterMenu={false} filterPlaceholder="Search" />
                    <Column field="receipt_number" sortable header="Receipt #" body={receiptNumberBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="status" style={{width:'200px'}} header="Status" body={statusBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />

                </DataTable>
            </div>
        </>
       
    );
}
        