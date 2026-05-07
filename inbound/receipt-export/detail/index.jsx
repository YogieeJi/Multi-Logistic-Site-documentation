
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ShipmentsService } from '../../../../service/inbound/ShipmentService';
import { Link, useParams } from 'react-router-dom';
import '../../../../assets/styles.css';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { useNavigate } from 'react-router-dom';
import { ReceiptExportService } from '../../../../service/inbound/ReceiptExportService';
import { Sidebar } from 'primereact/sidebar';
import { TabView, TabPanel } from 'primereact/tabview';
import { Timeline } from 'primereact/timeline';
import { Dialog } from 'primereact/dialog';
import { GeneralService } from '../../../../service/inbound/GeneralService';

export default function ReceiptsExportDetails() {
    const [loading, setLoading] = useState(false);
    const [loading1, setLoading1] = useState(false);
    const [error, setError] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalRecordsLot, setTotalRecordsLot] = useState(0);
    const toast = useRef();
    const menuLeft = useRef(null);
    const [shipmentLines, setShipmentLines] = useState([]);
    const [Lot, setLot] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedShipments, setSelectedShipments] = useState(null);
    const [receiptData, setReceiptExportData] = useState(null);
    const navigate = useNavigate();
    const [visible, setVisible] = useState(false);
    const [dialogText, setDialogText] = useState('');
    const [visibleRight, setVisibleRight] = useState(false);
    const [logs, setLogs] = useState(null);
    const [errorLogs, setErrorLogs] = useState(null);

    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 25,
        page: 1,
        sortField: null,
        sortOrder: null,
        filters: {
            exp_date: { value: '', matchMode: 'contains' },
            QTY: { value: '', matchMode: 'contains' },
            expected_QTY: { value: '', matchMode: 'contains' },
            LOT: { value: '', matchMode: 'contains' },
            pohnum: { value: '', matchMode: 'contains' },
            input_sku: { value: '', matchMode: 'contains' },
            prd_PrimaryCode: { value: '', matchMode: 'contains' },
        }
    });
    const [lazyState1, setlazyState1] = useState({
        first: 0,
        rows: 25,
        page: 1,
        sortField: null,
        sortOrder: null,
        filters: {
            exp_date: { value: '', matchMode: 'contains' },
            QTY: { value: '', matchMode: 'contains' },
            expected_QTY: { value: '', matchMode: 'contains' },
            LOT: { value: '', matchMode: 'contains' },
            pohnum: { value: '', matchMode: 'contains' },
            input_sku: { value: '', matchMode: 'contains' },
            prd_PrimaryCode: { value: '', matchMode: 'contains' },
        }
    });

    let networkTimeout = null;
    let lotTimeoutRef = null;
    const params = useParams();

    useEffect(() => {
        if (receiptData?.receiptCode) {
            loadLazyData();
        }
    }, [receiptData?.receiptCode, lazyState]);

    useEffect(() => {
        if (receiptData?.receiptCode) {
            loadLazyDataLot();
        }
    }, [receiptData?.receiptCode, lazyState1]);

    useEffect(() => {
        receiptExportData();
    }, [params.id]);

    const logTopics = useState({
        moduleId: 1,
        subModuleId: 4,
        subjectId: params.id
    });

    useEffect(() => {
        loadLogsData(); 
    }, []);

    const receiptExportData = () => {
        ReceiptExportService.getReceiptExportById(params.id).then((res) => {
            if (res?.data?.length > 0) {
                setReceiptExportData(res.data[0]);
            }
        });
    };

    const loadLazyData = () => {
        if (!receiptData?.receiptCode) return;

        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }
        
        networkTimeout = setTimeout(() => {
            setLoading(true); 
            ReceiptExportService.getReceiptExportDetails(receiptData.receiptCode, lazyState)
                .then((data) => {
                    setTotalRecords(data.totalRecords);
                    setShipmentLines(data.data);
                })
                .catch((error) => {
                    console.error("Failed to load data:", error);
                })
                .finally(() => {
                    setLoading(false); 
                });

        }, Math.random() * 100 + 250);
    };

    const loadLazyDataLot = () => {
        setLoading1(true);
        if (lotTimeoutRef) {
            clearTimeout(lotTimeoutRef);
        }

        //imitate delay of a backend call
        lotTimeoutRef = setTimeout(() => {
            ReceiptExportService.getReceiptExportDetailsLot(receiptData.receiptCode, (lazyState1)).then((data) => {
                //console.log(receiptData);
                setLoading1(true)
                setTotalRecordsLot(data.totalRecords);
                setLot(data.data);
                setLoading1(false);
            });
        }, Math.random() * 100 + 250);

    };

    const loadLogsData = async () => {
        try {
            setLoading(true);

            const response = await GeneralService.getLogs(logTopics[0]);
            const logsData = response.data || [];

            setLogs(logsData);

            const errorLogs = logsData.filter(log => log.event === 'error');
            setErrorLogs(errorLogs);

        } catch (error) {
            console.error("Failed to load logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const onPage = (event) => {
        setlazyState(event);
    };

    const onPage1 = (event) => {
        setlazyState1(event);
    };

    const onSort = (event) => {
        setlazyState(event);
    };
    const onSort1 = (event) => {
        setlazyState1(event);
    };

    const onFilter = (event) => {
        event['first'] = 0;
        setlazyState(event);
    };
    const onFilter1 = (event) => {
        event['first'] = 0;
        setlazyState1(event);
    };

    const onSelectionChange = (event) => {
        const value = event.value;

        setSelectedShipments(value);
        setSelectAll(value.length === totalRecords);
    };
    const onSelectionChange1 = (event) => {
        const value = event.value;

        setSelectedShipments(value);
        setSelectAll(value.length === totalRecords);
    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;

        if (selectAll) {
            ShipmentsService.getShipmentLines(params.id).then((data) => {
                setSelectAll(true);
                setSelectedShipments(data.shipments);
            });
        } else {
            setSelectAll(false);
            setSelectedShipments([]);
        }
    };
    const onSelectAllChange1 = (event) => {
        const selectAll = event.checked;

        if (selectAll) {
            ShipmentsService.getShipmentLines(params.id).then((data) => {
                setSelectAll(true);
                setSelectedShipments(data.shipments);
            });
        } else {
            setSelectAll(false);
            setSelectedShipments([]);
        }
    };

    const rowClassName = (rowData) => {
        if (rowData.qty === null || rowData.qty === 0) {
            return '';
        } else if (rowData.expected_QTY !== rowData.qty) {
            return 'row-warning';
        }
    };

    const getTotalQtyWithUnit = (rows, fieldName) => {
        let total = 0;
        let unit = '';

        rows?.forEach(row => {
            const value = row[fieldName];
            if (!value) return;

            // Match number + unit (handles decimals)
            const match = value.trim().match(/^([\d.]+)\s*([A-Za-z]+)$/);
            if (!match) return;

            const qty = parseFloat(match[1]);
            const rowUnit = match[2];

            if (!isNaN(qty)) {
                total += qty;
                unit = unit || rowUnit; // auto-pick first unit
            }
        });

        return unit
            ? `${total.toFixed(2)} ${unit}`
            : total.toFixed(2);
    };

    const formattedTotalQty = getTotalQtyWithUnit(Lot, 'x3_QtyDisplay');

    // Utility function to format date as mm/dd/yyyy
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const month = String(date.getMonth() + 1).padStart(2, '0'); // months are 0-based
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    };

    const formatQty = (value) => {
        if (!value || typeof value !== "string") return "";

        const match = value.match(/([\d.]+)\s*(\D+)/);
        if (!match) return value;

        const qty = parseFloat(match[1]);
        const uom = match[2].trim();

        return isNaN(qty) ? value : `${qty.toFixed(2)} ${uom}`;
    };

    const customizedContent = (item) => {
        let causerName = item.causer_id ? item.user_name : 'System';
        let date = new Date(item.created_at);
        let month = (date.getMonth() < 10) ? '0' + (date.getMonth() + 1) : date.getMonth() + 1;
        let day = (date.getDate() < 10) ? '0' + (date.getDate()) : date.getDate();
        let hours = (date.getHours() < 10) ? '0' + (date.getHours()) : date.getHours();
        let minutes = (date.getMinutes() < 10) ? '0' + (date.getMinutes()) : date.getMinutes();
        let seconds = (date.getSeconds() < 10) ? '0' + (date.getSeconds()) : date.getSeconds();
        return (
            <div className='timeline_content'>
                <div className='main_line'>


                </div>
                <div className='secondary_line'>
                    <p style={{ fontWeight: 'bold' }}>{date.getFullYear() + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds} </p>
                    <Button label={item.event.toUpperCase()} className={item.event == 'success' ? 'status_btn  btn_success' : (item.event == 'error') ? 'status_btn  btn_danger' : 'status_btn  btn_info'}></Button>
                </div>
                <div className='secondary_line'>
                    <p>{item.description}</p>
                    <a href='' onClick={(e) => readMorePopup(e, item.properties, item.event)}>read more</a>
                </div>
                <div className='secondary_line mb-3'>
                    <p>By <span style={{ fontWeight: 'bold' }}>{causerName}</span></p>
                </div>

            </div>
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
        } else if (event === 'error') {
            // Display error message
            text += '<h5>Exception</h5>';
            text += item?.error || 'No error data';
        }

        setDialogText(text);
    };

    return (
        <>
            <Toast ref={toast} />
            {/* <BreadCrumb model={items} home={home} /> */}
            <Button
                label="Back"
                icon="pi pi-arrow-left"
                className="p-button-primary"
                onClick={() => navigate("/inbound/receipt-export")}
                style={{ margin: '5px 0' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Receipt Export Details</h2>
                <div className='page-headerActions' style={{ display: "flex", gap: 30, alignItems: 'center' }}>
                    <span onClick={() => setVisibleRight(true)} style={{ cursor: 'pointer', fontWeight: 500, fontSize: '18px', lineHeight: '21px', color: '#222222' }}><i className='pi pi-list' style={{ fontWeight: '600', fontSize: '20px' }}></i><span className='p-badge p-component p-badge-no-gutter p-badge-danger'></span>View Logs</span>
                </div>
            </div>
            <Sidebar className='logs_sidebar' visible={visibleRight} onHide={() => setVisibleRight(false)} baseZIndex={1000} position="right">
                <div className='side_barHeader mt-4'>
                    <div className='left_centent'>Logs</div>
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

            <div className="card">
                <h1></h1>
                <div className="p-fluid formgrid grid">
                    <div className="field col-12 md:col-4">
                        <h5 id="created_at">Receipt Code</h5>
                        <p htmlFor="created_at">{receiptData?.receiptCode}</p>

                    </div>
                    <div className="field col-12 md:col-4">
                        <h5 id="warehouse">Receipt Date</h5>
                        <p htmlFor="warehouse">
                            {receiptData?.receivedDate ? formatDate(receiptData?.receivedDate) : '-'}
                        </p>
                    </div>
                </div>
            </div>
            <div className="card">

                <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                    <span className="block mt-2 md:mt-0 p-input-icon-left">
                        <h3>Receipt Lines By Items</h3>
                    </span>
                </div>
                <h1></h1>
                <div className="w-full overflow-x-auto">
                    <DataTable
                        value={shipmentLines}
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
                        rowsPerPageOptions={[25, 50, 100, 500]}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                        loading={loading}
                        tableStyle={{ minWidth: '75rem' }}
                        emptyMessage="No shipments found."
                        selection={selectedShipments}
                        onSelectionChange={onSelectionChange}
                        selectAll={selectAll}
                        onSelectAllChange={onSelectAllChange}
                        scrollable
                        scrollHeight="600px"
                        removableSort
                        rowClassName={rowClassName}
                    >
                        <Column field="lineNumber" header="Line" body={(rowData) => rowData.lineNumber} />
                        <Column field="poref" header="PO Ref" body={(rowData) => rowData.poref} />
                        <Column field="mantis_SKU" header="Product" body={(rowData) => rowData.mantis_SKU} />
                        <Column field="expectedQtyDisplay" header="Expected" body={(rowData) => rowData.expectedQtyDisplay} />
                        <Column field="actualQtyDisplay" header="Actual" body={(rowData) => rowData.actualQtyDisplay} />
                        <Column field="x3_Qty" header="Planned Lot" body={(rowData) => rowData.plannedLotNumber ? rowData.plannedLotNumber : '-'} />
                        <Column field="x3_Qty" header="X3 Qty" body={(rowData) => rowData.x3_QtyDisplay} />
                        <Column field="actualLotAttrCode" header="Lots" body={(rowData) => rowData.actualLotAttrCode ? parseInt(rowData.actualLotAttrCode, 10) : ''} />

                    </DataTable>
                </div>
                <br />
                <h3>Receipt Lines By LOT</h3>
                <div className="w-full overflow-x-auto">
                    <DataTable
                        value={Lot}
                        lazy
                        filterDisplay="row"
                        dataKey="id"
                        paginator
                        showGridlines
                        first={lazyState1.first}
                        rows={lazyState1.rows}
                        totalRecords={totalRecordsLot}
                        onPage={onPage1}
                        onSort={onSort1}
                        size={'small'}
                        sortField={lazyState1.sortField}
                        className="datatable-responsive"
                        sortOrder={lazyState1.sortOrder}
                        onFilter={onFilter1}
                        filters={lazyState1.filters}
                        rowsPerPageOptions={[25, 50, 100, 500]}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                        loading={loading1}
                        tableStyle={{ minWidth: '75rem' }}
                        emptyMessage="No shipments found."
                        selection={selectedShipments}
                        onSelectionChange={onSelectionChange1}
                        selectAll={selectAll}
                        onSelectAllChange={onSelectAllChange1}
                        scrollable
                        scrollHeight="600px"
                        removableSort
                    >
                        <Column field="actualLotNumbers" header="Lot Number" body={(rowData) => rowData.actualLotNumber} footer="Total" footerStyle={{ fontWeight: 'bold' }} />
                        <Column field="x3_QtyDisplay" header="Qty" body={(rowData) => formatQty(rowData.x3_QtyDisplay)} footer={formattedTotalQty} footerStyle={{ fontWeight: 'bold', textAlign: 'right' }} bodyStyle={{ textAlign: 'right' }} />
                        <Column field="inputDate" header="Mfg Date" body={(rowData) => rowData.inputDate ? formatDate(rowData.inputDate) : ''} />
                        <Column field="expectedDate" header="Exp Date" body={(rowData) => rowData.expiryDate ? formatDate(rowData.expiryDate) : 'TBD'} />

                    </DataTable>
                </div>
            </div>
        </>

    );
}
