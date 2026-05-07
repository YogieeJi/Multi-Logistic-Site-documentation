
import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Tag } from 'primereact/tag';
import { TransfersService } from '../../../../service/inbound/TransferService';

import { GeneralService } from '../../../../service/inbound/GeneralService';
import { Dialog } from 'primereact/dialog';
import { Timeline } from 'primereact/timeline';
import { Sidebar } from 'primereact/sidebar';
import { Badge } from 'primereact/badge';

export default function TransferDetails() {
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [transfer, setTransfer] = useState(null);
    const [TransferDetail, setTransferDetail] = useState(null);

    const [transferLines, setTransferLines] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedTransfers, setSelectedTransfers] = useState(null);

    const [statusValue, setStatusValue] = useState(null);

    const [dates, setDates] = useState(null);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 1,
        sortField: null,
        sortOrder: null,
        filters: {
            itmdes1l: { value: '', matchMode: 'contains' },
            itmrefl: { value: '', matchMode: 'contains' },
            loc: { value: '', matchMode: 'contains' },
            loctyp: { value: '', matchMode: 'contains' },
            lot: { value: '', matchMode: 'contains' },
            ownerl: { value: '', matchMode: 'contains' },
            pcu: { value: '', matchMode: 'contains' },
            qtypcu: { value: '', matchMode: 'contains' },
            sta: { value: '', matchMode: 'contains' },
            stu: { value: '', matchMode: 'contains' },
            vcrlin: { value: '', matchMode: 'contains' },
            mantis_imported: { value: '', matchMode: 'contains' }
        }
    });

    const [logs, setLogs] = useState(null);
    const [visible, setVisible] = useState(false);
    const [dialogText, setDialogText] = useState('');
    const [visibleRight, setVisibleRight] = useState(false);

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

    

    const reactRouterLink = (label, url) => {
        return (<Link to={url}>{label}</Link>);
    }

    const items = [{ label: 'Inbound' }, {  template: reactRouterLink('Transfers','/inbound/transfers')}];
    const home = { icon: 'pi pi-home', url: '/' }

    let networkTimeout = null;
    const params = useParams();

    const logTopics = useState({
        moduleId: 1,
        subModuleId: 3,
        subjectId: params.id
    });

    useEffect(() => {
        loadLazyData();
        getTransferDetail();
    }, [lazyState]);

    const getTransferDetail = () => {
        
        TransfersService.getTransferDetail( params.id ).then((data) => {
            setTransferDetail(data.data);
            
            if(data.data.status == 0){
                setStatusValue('Pending');
            } else if(data.data.status == 1){
                setStatusValue('Processing');
            } else{
                setStatusValue('Completed');
            }
            
            
        });
    }
    
    const loadLazyData = () => {
        setLoading(true);
        TransfersService.getTransferLines( params.id,lazyState ).then((data) => {
            setTotalRecords(data.totalRecords);
            setTransferLines(data.data);
            setLoading(false);
        });
        
        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }

        //imitate delay of a backend call
        

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
            
                setSelectAll(true);
                setSelectedTransfers(transferLines);
            
        } else {
            setSelectAll(false);
            setSelectedTransfers([]);
        }
    };

    const itmdes1lBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.itmdes1l}
            </>
        );
    };

    const itmreflBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.itmrefl}
            </>
        );
    };

    const locBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.loc}
            </>
        );
    };

    const loctypBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.loctyp}
            </>
        );
    };

    const lotBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.lot}
            </>
        );
    };

    const ownerlBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.ownerl}
            </>
        );
    };

    const pcuBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.pcu}
            </>
        );
    };

    const qtypcuBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.qtypcu}
            </>
        );
    };

   

    const staBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.sta)}
            </>
        );
    };


    const stuBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.stu ?? '-'}
            </>
        );
    };

    const vcrlinBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.vcrlin ?? '-'}
            </>
        );
    };

    const mantisImportedBodyTemplate = (rowData) => {
       
        return (
            <>
                {(rowData.mantis_imported == 0)?<Badge value="No" severity="danger">No</Badge>: <Badge value="Yes" severity="success"></Badge>}
            </>
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
                 <h3>Transfer # {TransferDetail?.vcr_num}</h3>
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
            
            <h1></h1>
                     <div className="p-fluid formgrid grid">
                        <div className="field col-12 md:col-3">
                            <h5 id="created_at">Created At</h5>
                            <p htmlFor="created_at">{TransferDetail?.sage_created_at}</p>
                            
                        </div>
                        <div className="field col-12 md:col-3">
                            <h5 id="warehouse">STOFCY</h5>
                            <p htmlFor="stofcy">{TransferDetail?.stofcy}</p>
                            
                        </div>
                        <div className="field col-12 md:col-3">
                            <h5 id="status">FCYDES</h5>
                            <p htmlFor="fcydes">{TransferDetail?.fcydes}</p>
                            
                        </div>
                        <div className="field col-12 md:col-3">
                            <h5 id="status">Status</h5>
                            <Tag value={statusValue} severity={(TransferDetail?.status == 0) ? 'warning': (TransferDetail?.status == 1) ? 'info': 'success'} />
                            
                        </div>
                    </div> 
            </div>
            <div className="card">
                <h3>Transfer Lines</h3>
                <h1></h1>
                <DataTable 
                    value={transferLines} 
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
                    scrollable 
                    scrollHeight="600px"
                    removableSort
                >
                    {/* <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} /> */}
            
                    <Column field="itmdes1l" header="Item Des" body={itmdes1lBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="itmrefl" sortable header="Item Ref" body={itmreflBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="loc" sortable filter header="LOC" body={locBodyTemplate} showFilterMenu={false} filterPlaceholder="Search" />
                    <Column field="loctyp" header="LOC Type" body={loctypBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="lot" sortable header="LOT" body={lotBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="ownerl" sortable filter header="Owner" body={ownerlBodyTemplate} showFilterMenu={false} filterPlaceholder="Search" />
                    <Column field="pcu" header="PCU" body={pcuBodyTemplate} sortable showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="qtypcu" header="PCU QTY" body={qtypcuBodyTemplate} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="sta" sortable filter header="STA" body={staBodyTemplate} showFilterMenu={false} filterPlaceholder="Search" />
                    <Column field="stu" header="STU" body={stuBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="vcrlin" header="VCR LINE" body={vcrlinBodyTemplate} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="mantis_imported" header="Mantis Imported" body={mantisImportedBodyTemplate} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                   
                </DataTable>
            </div>
        </>
       
    );
}
