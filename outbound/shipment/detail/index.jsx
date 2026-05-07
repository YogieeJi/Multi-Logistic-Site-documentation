import { Toast } from 'primereact/toast';
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { matchPath, useLocation, useNavigate, useParams } from 'react-router-dom';
import { BreadCrumb } from 'primereact/breadcrumb';
import { TabView, TabPanel } from 'primereact/tabview';
import { Tag } from 'primereact/tag';
import { Sidebar } from 'primereact/sidebar';
import { Badge } from 'primereact/badge';
import { Timeline } from 'primereact/timeline';
import { GeneralService } from '../../../../service/inbound/GeneralService';
import { Dialog } from 'primereact/dialog';
import { outboundShipmentService } from '../../../../service/outbound/outboundShipmentService';
import { DeliveryService } from '../../../../service/outbound/DeliveryService';
import { ShipmentsService } from '../../../../service/inbound/ShipmentService';
import { useLazySort } from "../../../../components/useLazySort";
import { Dropdown } from 'primereact/dropdown';

export default function DeliveryDetails() {
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalRecords1, setTotalRecords1] = useState(0);
    const [headerdetail, setHeaderDetail] = useState(0);
    const [delivery, setDelivery] = useState(null);
    const [deliveryDetail, setDeliveryDetail] = useState({
        'created_at': '-',
        'fcy': '-'
    });
    const navigate = useNavigate();
    const location = useLocation();
    const { selectedRow } = location.state || {};

    const [deliveryLines, setDeliveryLines] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedDeliveryLines, setSelectedDeliveryLines] = useState(null);
    const [removeItemData, setRemoveItemData] = useState({
        id: '',
    });
    const toast = useRef();
    const [statusValue, setStatusValue] = useState(null);
    const [btnDisabled, setbtnDisabled] = useState(false);
    const [dates, setDates] = useState(null);
    const [visibleRight, setVisibleRight] = useState(false);
    const [errorLogs, setErrorLogs] = useState(null);
    const [truckOptions, setTruckOptions] = useState(null);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 25,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {
            ord_Code: { value: '', matchMode: 'contains' },
            ost_ExecuteDate: { value: '', matchMode: 'contains' },
            ost_ShipDate: { value: '', matchMode: 'contains' },
            ost_DeliveryDate: { value: '', matchMode: 'contains' },
            ost_LoadingPriority: { value: '', matchMode: 'contains' },
            orderShipmentStatus: { value: '', matchMode: 'contains' },
            customer_Code: { value: '', matchMode: 'contains' },
            ship_To: { value: '', matchMode: 'contains' }


        }
    });
    const { onSort } = useLazySort(setlazyState);
    const [displayConfirmation1, setDisplayConfirmation1] = useState(false);
    const [logs, setLogs] = useState(null);
    const [visible, setVisible] = useState(false);
    const [dialogText, setDialogText] = useState('');



    const reactRouterLink = (label, url) => {
        return (<Link to={url}>{label}</Link>);
    }

    const items = [{ label: 'Inbound' }, { template: reactRouterLink('Shipments', '/inbound/shipments') }];
    const home = { icon: 'pi pi-home', url: '/' }

    let networkTimeout = null;
    const params = useParams();

    const logTopics = useState({
        moduleId: 2,
        subModuleId: 10,
        subjectId: params.id
    });

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    const ost_OrderIDBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.ord_Code}
            </>
        );
    };
    const customer_codeBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.customer_Code}
            </>
        );
    };
    const ship_toBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.ship_To}
            </>
        );
    };
    const ost_ExecuteDateBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.ost_ExecuteDate}
            </>
        );
    };
    const ost_ShipDateBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.ost_ShipDate}
            </>
        );
    };


    const ost_WeightBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.ost_Weight}
            </>
        );
    };

    const ost_DeliveryDateBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.ost_DeliveryDate}
            </>
        );
    };

    const ost_WeightUnitIDBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.weight}
            </>
        );
    };
    const ost_VolumeDBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.ost_Volume}
            </>
        );
    };
    const ost_VolumeUnitIDBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.ost_VolumeUnitID}
            </>
        );
    };

    const ost_LoadingPriorityDBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.ost_LoadingPriority}
            </>
        );
    };

    const AgencyBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.Agency}
            </>
        );
    };
    const dltBodyTemplate = (rowData) => {
        return (<Button type="button" onClick={() => removeItemsPopup(rowData.ord_Code)} icon="pi pi-trash" rounded></Button>);

    };
    const removeItemsPopup = (id) => {
        setRemoveItemData({
            id
        })
        setDisplayConfirmation1(true)
    }

    const removeItem = () => {
        if (deliveryLines.length <= 1) {
            toast.current.show({
                severity: 'warn',
                summary: 'Warning',
                detail: 'At least one order shipment line is required.',
                life: 3000
            });
            setDisplayConfirmation1(false);
            return;
        }
        setbtnDisabled(true);
        setLoading(true);
        outboundShipmentService.deleteOrderShipment(removeItemData).then((data) => {
            setLoading(false);
            if (data.error == 0) {
                toast.current.show({ severity: 'success', summary: 'Success Message', detail: data.message, life: 3000 });
            } else {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
            // loadGrid({});
            setDisplayConfirmation1(false)
            setbtnDisabled(false);
            loadLazyData();
        });

    }
    const confirmationDialogFooter1 = (
        <>
            <Button type="button" disabled={btnDisabled} label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation1(false)} className="p-button-text" />
            <Button type="button" disabled={btnDisabled} label="Yes" icon="pi pi-check" onClick={() => removeItem()} className="p-button-text" autoFocus />
        </>
    );

    const OrderShipmentStatusBodyTemplate = (rowData) => {
        let statusSeverity = 'secondary';

        const status = rowData.orderShipmentStatus.toLowerCase();

        if (status.includes('pending')) {
            statusSeverity = 'warning';
        } else if (status.includes('picked')) {
            statusSeverity = 'info';
        } else if (status.includes('completed') || status.includes('packed')) {
            statusSeverity = 'success';
        }
        else if (status.includes('picking') || status.includes('packing')) {
            statusSeverity = 'secondary'; 
        }

        return (
            <Badge
                value={rowData.orderShipmentStatus}
                severity={statusSeverity}
                rounded
                className="custom-badge"
            />
        );
    };

    const getStatusSeverity = (flag) => {
        switch (flag) {
            case 'Completed' : case 'Packed':
                return 'success';

            case 'Pending':
                return 'warning';

            case 'Picking': case 'Packing':
                return 'secondary';

            case 'Picked':
                    return 'info';

            default:
                return 'secondary';
        }
    };

    const StatusFlags = [
        { code: 'Completed', name: 'Completed' },
        { code: 'Packed', name: 'Packed' },
        { code: 'Packing', name: 'Packing' },
        { code: 'Picked', name: 'Picked' },
        { code: 'Picking', name: 'Picking' },
        { code: 'Pending', name: 'Pending' },    
    ];

    const StatusflagTemplate = (option) => {
        return <Badge value={option.name} severity={getStatusSeverity(option.name)} />;
    };

    const StatusRowFilterTemplate = (options) => {
        return (
            <Dropdown  style={{ minWidth: '3em', width: '5em' }}  value={options.name} optionValue="code" optionLabel="name"  options={StatusFlags} onChange={(e) => options.filterApplyCallback(e.value)} itemTemplate={StatusflagTemplate} placeholder="Select One" className="p-column-filter" showClear  />
        );
    };

    const loadLazyData = () => {
        // outboundShipmentService.getShipmentDetail(params.id).then((data) => {
        //     setDeliveryDetail(data.data);
        // });
        if (deliveryDetail.status === 1) {
            setStatusValue('Pending');
        } else if (deliveryDetail.status === 2) {
            setStatusValue('Processing');
        } else {
            setStatusValue('Completed');
        }
        setLoading(true);


        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }

        // outboundShipmentService.getShipmentHeader(params.id, (lazyState)).then((data) => {
        //     setHeaderDetail(data.data[0]); 

        //     // setDeliveryLines(data.data);
        //     // setLoading(false);
        // });
        //imitate delay of a backend call
        networkTimeout = setTimeout(() => {
            outboundShipmentService.getShipmentDetailTruck(params.id, (lazyState)).then((data) => {
                setTotalRecords1(data.totalRecords);
                setDeliveryLines(data.data);
                setLoading(false);
            });

            outboundShipmentService.getTrucksById(params.id, (lazyState)).then((data) => {
                setTotalRecords(data.totalRecords);
                setTruckOptions(data[0]);
                //console.log("Truck API response:", data);
                setLoading(false);
                //console.log("Selected row:", selectedRow);
            });
        }, Math.random() * 100 + 250);

        GeneralService.getLogs(logTopics[0]).then((data) => {
            setLogs(data.data);
        });


    };

    const onPage = (event) => {
        setlazyState(event);
    };

    const onFilter = (event) => {
        event['first'] = 0;
        setlazyState(event);
    };

    const onSelectionChange = (event) => {
        const value = event.value;

        setSelectedDeliveryLines(value);
        setSelectAll(value.length === totalRecords);
    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;

        if (selectAll) {
            //DeliveryService.getDeliveryLines(params.id).then((data) => {
            setSelectAll(true);
            setSelectedDeliveryLines(deliveryLines);
            //});
        } else {
            setSelectAll(false);
            setSelectedDeliveryLines([]);
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

    const syncDetails = () => {
        // dt.current.exportCSV();
        //console.log(selectedDeliveryLines);
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

    // const readMorePopup = (e, item, event) => { 
    //     e.preventDefault();
    //     setVisible(true);
    //     let text = '';
    //     if(item.data){
    //         text += '<h5>Below data created</h5>';
    //         let keys = Object.keys(item.data);
    //         keys.forEach((key) => {
    //             text += key+' = '+item.data[key]+"<br>"
    //         });
    //     } else if(event == 'sync'){
    //         text += '<h5>Request</h5>';
    //         text += '<meta http-equiv="Content-Type" content="text/html; charset=utf-8">'+item.request+'</meta>';
    //         text += '<br><h5>Response</h5>';
    //         text += JSON.stringify(item.response);
    //     } else if (event == 'error'){
    //         text += '<h5>Exception</h5>';
    //         text += item.error;
    //     }
    //    setDialogText(text)
    // }

    const readMorePopup = (e, item, event) => {
        e.preventDefault();
        setVisible(true);

        let text = '';

        // Parse properties safely
        let parsedProperties = {};
        try {
            parsedProperties = typeof item === "string" ? JSON.parse(item) : item;
        } catch {
            parsedProperties = {};
        }

        const data = parsedProperties?.data || null;
        const request = parsedProperties?.request || null;
        const response = parsedProperties?.response || null;

        if (data) {
            // Detect CREATE vs UPDATE by selectedOrderShipment structure
            const isUpdate =
                Array.isArray(data.selectedOrderShipment) &&
                typeof data.selectedOrderShipment[0] === 'string';

            text += `<h5>Below data ${isUpdate ? 'updation' : 'created'}</h5>`;

            Object.keys(data).forEach((key) => {
                const value = data[key];

                // Detect CREATE vs UPDATE
                const isUpdate =
                    Array.isArray(data.selectedOrderShipment) &&
                    typeof data.selectedOrderShipment[0] === 'string';

                // Remove "code" only for CREATE
                if (!isUpdate && key === 'code') {
                    return;
                }

                // selectedOrderShipment handling
                if (key === 'selectedOrderShipment' && Array.isArray(value)) {

                    if (isUpdate) {
                        text += `${key} = ${value.join(',')}<br>`;
                    } else {
                        text += `<b>${key}</b>:<br>`;
                        value.forEach((obj, index) => {
                            text += `&nbsp;&nbsp;${index + 1}) `;
                            text += `CustomerCode: ${obj.CustomerCode ?? ''}, `;
                            text += `OrderShipment: ${obj.OrderShipment ?? ''}, `;
                            text += `ShipToCode: ${obj.ShipToCode ?? ''}, `;
                            text += '<br>';
                        });
                    }
                }

                else if (Array.isArray(value)) {
                    text += `${key} = ${value.join(',')}<br>`;
                }

                else if (typeof value === 'object' && value !== null) {
                    text += `<b>${key}</b>:<br>`;
                    Object.keys(value).forEach((k) => {
                        text += `&nbsp;&nbsp;${k}: ${value[k] ?? ''}<br>`;
                    });
                }

                else {
                    text += `${key} = ${value ?? ''}<br>`;
                }
            });
        }

        // SYNC LOG
        else if (event === 'sync') {
            text += '<h5>Request</h5>';
            text += `<pre>${request || 'No request data'}</pre>`;
            text += '<h5>Response</h5>';
            text += `<pre>${JSON.stringify(response || 'No response data', null, 2)}</pre>`;
        }

        // ERROR LOG
        else if (event === 'error') {
            text += '<h5>Exception</h5>';
            text += item?.error || 'No error data';
        }

        setDialogText(text);
    };

    const customizedContent = (item) => {
        let causerName = item.causer_id ? item.causer_name : 'System';
        let date = new Date(item.created_at + "Z");  // force UTC
        let formatted =
            date.getUTCFullYear() + "-" +
            String(date.getUTCMonth() + 1).padStart(2, '0') + "-" +
            String(date.getUTCDate()).padStart(2, '0') + " " +
            String(date.getUTCHours()).padStart(2, '0') + ":" +
            String(date.getUTCMinutes()).padStart(2, '0') + ":" +
            String(date.getUTCSeconds()).padStart(2, '0') + ".000";

        return (
            <div className='timeline_content'>
                <div className='main_line'>
                    <p><span style={{ fontWeight: 'bold' }}>{formatted}</span> - {item.description}...</p>
                    <a href='' onClick={(e) => readMorePopup(e, item.properties, item.event)}>read more</a>

                </div>
                <div className='secondary_line'>
                    <p>By <span style={{ fontWeight: 'bold' }}>{causerName}</span></p>
                    <Button label={item.event.toUpperCase()} className={item.event == 'created' ? 'status_btn  btn_success' : (item.event == 'error') ? 'status_btn  btn_danger' : 'status_btn  btn_info'}></Button>
                </div>

            </div>
        );
    };

    const items1 = [{ label: 'Outbound', url: '/outbound/shipment' }, { label: 'Shipments' }];
    const home1 = { icon: 'pi pi-home', url: '/' }
    const getSeverity = (status) => {
        // const infoStatuses = ['1'];      
        // const successStatuses = ['2'];   
        const status1 = status.toLowerCase();
        if (status1.includes('pending')) {
            return 'info';
        } else if (status1.includes('ready to ship')) {
            return 'success';
        } else if (status1.includes('preparing')) {
            return 'warning';
        }
        else {
            return 'secondary';
        }
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
            <BreadCrumb model={items1} home={home1} />
            <Toast ref={toast} />
            <br />
            <Button
                label="Back"
                icon="pi pi-arrow-left"
                className="p-button-primary"
                onClick={() => navigate("/outbound/multiple-shipment")}
                style={{ margin: '10px 0' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Create Shipment </h3>
                <div className='page-headerActions' style={{ display: "flex", gap: 30, alignItems: 'center' }}>
                    <span onClick={() => setVisibleRight(true)} style={{ cursor: 'pointer', fontWeight: 500, fontSize: '18px', lineHeight: '21px', color: '#222222' }}><i className='pi pi-list' style={{ fontWeight: '600', fontSize: '20px' }}></i><span className='p-badge p-component p-badge-no-gutter p-badge-danger'></span>View Logs</span>
                    {/* <span style={{ fontWeight: 500, fontSize: '18px', lineHeight: '21px', color: '#222222' }}><i className='pi m-left' style={{ fontWeight: '500', fontSize: '20px' }}></i> Back</span> */}
                </div>
            </div>
            <h1></h1>

            <Sidebar className='logs_sidebar' visible={visibleRight} onHide={() => setVisibleRight(false)} baseZIndex={1000} position="right">
                <div className='side_barHeader mt-4'>
                    <div className='left_centent'>Logs</div>
                    {/* <div className='right_centent'><i className='pi m-check-circle mr-1'></i>Mark all as read</div> */}
                </div>
                <div className='mt-6'>
                    <TabView>
                        <TabPanel header="Logs">
                            <Timeline className='logs_timeline' value={logs} content={customizedContent} />
                        </TabPanel>
                        <TabPanel header="Error Logs">
                            <Timeline className='logs_timeline' value={errorLogs} content={customizedContent} />
                        </TabPanel>
                    </TabView>
                </div>
            </Sidebar>

            <Dialog header="Log Detail" visible={visible} style={{ width: '50vw' }} onHide={() => setVisible(false)}>
                <p className="m-0" dangerouslySetInnerHTML={{ __html: dialogText }}>
                </p>
            </Dialog>
            <Dialog closable={false} header="Confirmation" visible={displayConfirmation1} onHide={() => setDisplayConfirmation1(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter1}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to remove this order?</span>
                </div>
            </Dialog>
            <div className="grid">
                <div className="col-12">
                    <div className="card">
                        <div className="p-fluid formgrid grid">
                            {/* <div className="field col-12 md:col-2">
                                <h4>Code</h4>
                                <p>{headerdetail ? headerdetail.shp_Code : ''}</p> 
                            </div> */}
                            <div className="field col-12 md:col-2">
                                <h4>Truck</h4>
                                <p>{truckOptions ? truckOptions.trk_Code : ''}</p>
                            </div>
                            {/* <div className="field col-12 md:col-3">
                                <h4>Dispatch method</h4>
                                <p>{headerdetail ? headerdetail.dispatchMethodCodeName : ''}</p> 
                            </div> */}
                            <div className="field col-12 md:col-2">
                                <h4>Location</h4>
                                <p>{truckOptions ? truckOptions.loc_Code : ''}</p>
                            </div>
                            {/* <div className="field col-12 md:col-3">
                                <h4>Ship date</h4>
                                <p>{headerdetail ? headerdetail.shp_ShipDate : ''}</p>
                            </div>
                            <div className="field col-12 md:col-3">
                                <h4>Status</h4>
                                <Badge value={headerdetail ? headerdetail.messageName : ''} severity={getSeverity(headerdetail ? headerdetail.messageName : 'N/A')} />
                            </div> */}
                        </div>
                        <div>
                        </div>
                    </div>

                    <div className="card">

                        <h3>Orders Shipment</h3>
                        <h1></h1>
                        <DataTable
                            value={deliveryLines}
                            lazy
                            filterDisplay="row"
                            dataKey="ord_Code"
                            paginator
                            showGridlines
                            first={lazyState.first}
                            rows={lazyState.rows}
                            totalRecords={totalRecords1}
                            onPage={onPage}
                            onSort={onSort}
                            size={'small'}
                            sortField={lazyState.sortField}
                            className="datatable-responsive"
                            sortOrder={lazyState.sortOrder}
                            onFilter={onFilter}
                            filters={lazyState.filters}
                            rowsPerPageOptions={[25, 50, 100, 500]}
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                            loading={loading}
                            tableStyle={{ minWidth: '75rem' }}
                            emptyMessage="No records found."
                            selection={selectedDeliveryLines}
                            onSelectionChange={onSelectionChange}
                            selectAll={selectAll}
                            onSelectAllChange={onSelectAllChange}
                            scrollable
                            scrollHeight="600px"
                        >
                            <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />

                            <Column field="ord_Code" header="Code " body={ost_OrderIDBodyTemplate} filterMenuStyle={{ width: '14rem' }} sortable filter filterPlaceholder="Search" showFilterMenu={false} />
                            <Column field="customer_Code" header="Customer Code " body={customer_codeBodyTemplate} filterMenuStyle={{ width: '14rem' }} sortable filter filterPlaceholder="Search" showFilterMenu={false} />
                            <Column field="ship_To" header="Ship code" body={ship_toBodyTemplate} filterMenuStyle={{ width: '14rem' }} sortable filter filterPlaceholder="Search" showFilterMenu={false} />
                            <Column field="ost_ExecuteDate" sortable header="Execution Date" body={ost_ExecuteDateBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                            <Column field="ost_ShipDate" header="Ship Date" body={ost_ShipDateBodyTemplate} filterMenuStyle={{ width: '14rem' }} sortable showFilterMenu={false} filter filterPlaceholder="Search" />
                            <Column field="ost_DeliveryDate" sortable header="Delivery Date" body={ost_DeliveryDateBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                            <Column field="ost_LoadingPriority" sortable header="Loading Priority" body={ost_LoadingPriorityDBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                            <Column field="totalQuantity" header="Box QTY" body={(rowData) => rowData.totalQuantity} />
                            <Column field="orderShipmentStatus" sortable header="Status" body={OrderShipmentStatusBodyTemplate} showFilterMenu={false} filter filterElement={StatusRowFilterTemplate} />
                            <Column field="dlt" header="Action" body={dltBodyTemplate} showFilterMenu={false} />
                        </DataTable>

                        <div class="flex justify-content-end flex-wrap">
                            <Button label="Cancel" onClick={() => navigate("/outbound/multiple-shipment")} type='button' severity="secondary" className="w-2 p-2 mt-2 mr-2 " outlined ></Button>
                            <Button label="Edit" onClick={() => navigate("/outbound/shipment/edit/" + selectedRow?.trk_ID, { state: { trk_Id: selectedRow?.trk_ID } })} className="w-2 p-2 mt-2" ></Button>
                        </div>
                    </div>
                </div>
            </div>
        </>

    );
}
