
import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { Tag } from 'primereact/tag';
import { Sidebar } from 'primereact/sidebar';
import { Timeline } from 'primereact/timeline';
import { GeneralService } from '../../../../service/inbound/GeneralService';
import { Dialog } from 'primereact/dialog';
import { PicklistService } from '../../../../service/outbound/PicklistService';


export default function PickListDetails() {
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [pickList, setPickList] = useState(null);
    const [pickListDetail, setPickListDetail] = useState({
        'created_at': '-',
        'fcy': '-'
    });

    const [pickListLines, setPickListLines] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedPickListLines, setSelectedPickListLines] = useState(null);

    const [statusValue, setStatusValue] = useState(null);

    const [dates, setDates] = useState(null);
    const [visibleRight, setVisibleRight] = useState(false);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 1,
        sortField: null,
        sortOrder: null,
        filters: {
            order_id: { value: '', matchMode: 'contains' },
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

        }
    });

   
    const [logs, setLogs] = useState(null);
    const [visible, setVisible] = useState(false);
    const [dialogText, setDialogText] = useState('');

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

    const items = [{ label: 'Inbound' }, { template: reactRouterLink('Shipments', '/inbound/shipments') }];
    const home = { icon: 'pi pi-home', url: '/' }

    let networkTimeout = null;
    const params = useParams();

    const logTopics = useState({
        moduleId: 2,
        subModuleId: 5,
        subjectId: params.id
    });

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);


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


    const loadLazyData = () => {
        PicklistService.getPicklistDetail(params.id).then((data) => {
            setPickListDetail(data.data);
            setStatusValue(data.data.status);
        });

        // if (pickListDetail.status === 1) {
        //     setStatusValue('Pending');
        // } else if (pickListDetail.status === 2) {
        //     setStatusValue('Processing');
        // } else {
        //     setStatusValue('Completed');
        // }
        setLoading(true);


        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }

        //imitate delay of a backend call
        networkTimeout = setTimeout(() => {
            PicklistService.getPicklistLines(params.id, (lazyState)).then((data) => {
                setTotalRecords(data.totalRecords);
                setPickListLines(data.data);
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

        setSelectedPickListLines(value);
        setSelectAll(value.length === totalRecords);
    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;

        if (selectAll) {
            PicklistService.getPicklistLines(params.id).then((data) => {
                setSelectAll(true);
                setSelectedPickListLines(data.shipments);
            });
        } else {
            setSelectAll(false);
            setSelectedPickListLines([]);
        }
    };

    const orderIdBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.order_id}
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

    const itemDescriptionBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.item_description}
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

    const bpcordBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.bpcord ?? '-'}
            </>
        );
    };

    const dlvdatBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.dlvdat ?? '-'}
            </>
        );
    };


    const shidatBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.shidat ?? '-'}
            </>
        );
    };

    const siteBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.site ?? '-'}
            </>
        );
    };

    const lotDetailBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.lot_detail ?? '-'}
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

    const representativeRowFilterTemplate = (options) => {
        return (
            <Calendar value={dates} onChange={(e) => setDates(e.value)} selectionMode="range" readOnlyInput />

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

    const customEvents = [
        {
            status: 'Today',
            date: '15/10/2025 10:30',
            icon: 'pi pi-shopping-cart',
            color: '#9C27B0',
            image: 'game-controller.jpg'
        },
        { status: 'Processing', date: '15/10/2025 14:00', icon: 'pi pi-cog', color: '#673AB7' },
        { status: 'Shipped', date: '15/10/2025 16:15', icon: 'pi pi-envelope', color: '#FF9800' },
        { status: 'Delivered', date: '16/10/2025 10:00', icon: 'pi pi-check', color: '#607D8B' },
        { status: 'Delivered', date: '16/10/2025 10:00', icon: 'pi pi-check', color: '#607D8B' }
    ];

    return (
        <>
            {/* <BreadCrumb model={items} home={home} /> */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>PickList # {pickListDetail.pick_list_id}</h3>
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
                {/* <h3>Shipment</h3> */}
                <h1></h1>
                <div className="p-fluid formgrid grid">
                    <div className="field col-12 md:col-4">
                        <h5 id="created_at">Created At</h5>
                        <p htmlFor="created_at">{pickListDetail.created_at}</p>

                    </div>
                 
                    <div className="field col-12 md:col-4">
                        <h5 id="status">Status</h5>
                        <Tag value={statusValue} severity={getStatusSeverity(pickListDetail.status)} />

                    </div>
                </div>
            </div>
            <div className="card">
                <h3>PickList Lines</h3>
                <h1></h1>
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
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                    loading={loading}
                    tableStyle={{ minWidth: '75rem' }}
                    emptyMessage="No records found."
                    selection={selectedPickListLines}
                    onSelectionChange={onSelectionChange}
                    selectAll={selectAll}
                    onSelectAllChange={onSelectAllChange}
                    scrollable
                    scrollHeight="600px"
                    removableSort
                >
                    <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />

                    <Column field="order_id" header="Order #" body={orderIdBodyTemplate} headerStyle={{ width: '12rem' }} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="order_type" sortable header="Order Type" headerStyle={{ width: '12rem' }} body={orderTypeBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="item_no" sortable filter header="Item No" headerStyle={{ width: '12rem' }} body={itemNoBodyTemplate} showFilterMenu={false} filterPlaceholder="Search" />
                    <Column field="item_reference" header="Item Ref" headerStyle={{ width: '12rem' }} body={itemReferenceBodyTemplate} sortable showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="item_description" header="Item Description" headerStyle={{ width: '12rem' }} body={itemDescriptionBodyTemplate} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="qty" sortable header="Qty" headerStyle={{ width: '12rem' }} body={qtyBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="uom" sortable filter header="UOM" headerStyle={{ width: '12rem' }} body={uomBodyTemplate} showFilterMenu={false} filterPlaceholder="Search" />
                    <Column field="bpcord" header="Bpcord"  headerStyle={{ width: '12rem' }}v body={bpcordBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="dlvdat" header="dlvdat" headerStyle={{ width: '12rem' }} body={dlvdatBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="shidat" header="Shidat" headerStyle={{ width: '12rem' }} body={shidatBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="site" header="Site" headerStyle={{ width: '12rem' }} body={siteBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="lot_detail" header="Lot Details" headerStyle={{ width: '12rem' }} body={lotDetailBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="status" style={{width:'200px'}} header="Status" body={statusBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />

                </DataTable>
            </div>
        </>

    );
}
