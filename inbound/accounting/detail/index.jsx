import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog'; // CHANGED: keep Dialog only for Reject popup
import { InputTextarea } from 'primereact/inputtextarea'; // CHANGED: added textarea for reject reason
import { useNavigate, useParams } from 'react-router-dom';
import '../../../../assets/styles.css';
import { ReceiptsDashboardService } from '../../../../service/inbound/ReceiptDashboardService';
import { ReceiptExportService } from '../../../../service/inbound/ReceiptExportService';
import { Sidebar } from 'primereact/sidebar';
import { TabView, TabPanel } from 'primereact/tabview';
import { Timeline } from 'primereact/timeline';
import { GeneralService } from '../../../../service/inbound/GeneralService';
import { useAuth } from '../../../../store/useAuth';


export default function AccountingReceiptDetail() {
    const [loadingItems, setLoadingItems] = useState(false);
    const [loadingLots, setLoadingLots] = useState(false);
 const { hasActionAccess, hasPageAccess } = useAuth();
    const PAGE_KEY = "inbound_accounting_details";


    const [receiptData, setReceiptData] = useState(null);
    const [shipmentLines, setShipmentLines] = useState([]);
    const [lotLines, setLotLines] = useState([]);
    const [actionLoading, setActionLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalRecordsLot, setTotalRecordsLot] = useState(0);

    const toast = useRef(null);
    const navigate = useNavigate();
    const params = useParams();

    const [visibleRight, setVisibleRight] = useState(false);
    const [logs, setLogs] = useState(null);
    const [visible, setVisible] = useState(false);
    const [errorLogs, setErrorLogs] = useState([]);
    const [dialogText, setDialogText] = useState('');
    const [loadingLogs, setLoadingLogs] = useState(false);
    // ADDED: confirmation popup state
    const [showExportConfirm, setShowExportConfirm] = useState(false);
    const isAlreadyExported = receiptData?.manualContainerExportedToX3 === 1 || receiptData?.asnExportedToX3 === 1;
    const logTopics = {
        moduleId: 1,
        subModuleId: 4,
        subjectId: params.id
    };

    // ADDED: Load Logs
    useEffect(() => {
        loadLogsData();
    }, []);

    const loadLogsData = async () => {
        try {
            setLoadingLogs(true);

            const response = await GeneralService.getLogs(logTopics);
            const logsData = response.data || [];

            setLogs(logsData);
            setErrorLogs(logsData.filter(l => l.event === 'error'));

        } catch (error) {
            console.error("Failed to load logs:", error);
        } finally {
            setLoadingLogs(false);
        }
    };

    // ADDED: Timeline UI
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

    const [lazyState, setLazyState] = useState({
        first: 0,
        rows: 10,
        page: 1,
        sortField: null,
        sortOrder: null
    });

    const [lazyStateLot, setLazyStateLot] = useState({
        first: 0,
        rows: 10,
        page: 1,
        sortField: null,
        sortOrder: null
    });

    // CHANGED: removed old confirm/discrepancy popup logic
    // CHANGED: added reject popup state only
    const [showRejectPopup, setShowRejectPopup] = useState(false);

    // CHANGED: added reject reason textbox state
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        loadReceiptExportHeader();
    }, [params.id]);

    useEffect(() => {
        if (receiptData?.receiptCode) {
            loadReceiptItemLines();
        }
    }, [receiptData?.receiptCode, lazyState]);

    useEffect(() => {
        if (receiptData?.receiptCode) {
            loadReceiptLotLines();
        }
    }, [receiptData?.receiptCode, lazyStateLot]);

    const loadReceiptExportHeader = async () => {
        try {
            const res = await ReceiptExportService.getReceiptExportById(params.id);
            if (res?.data?.length > 0) {
                setReceiptData(res.data[0]);
            } else {
                setReceiptData(null);
            }
        } catch (error) {
            console.error('Failed to load receipt export data:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to load receipt export details.',
                life: 3000
            });
        }
    };

    const loadReceiptItemLines = async () => {
        if (!receiptData?.receiptCode) return;

        try {
            setLoadingItems(true);
            const data = await ReceiptsDashboardService.getDiscrepancyItemsWithPo(receiptData.receiptCode, lazyState);
            setShipmentLines(data?.data || []);
            setTotalRecords(data?.totalRecords || 0);
        } catch (error) {
            console.error('Failed to load receipt item lines:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to load receipt item lines.',
                life: 3000
            });
        } finally {
            setLoadingItems(false);
        }
    };

    const loadReceiptLotLines = async () => {
        if (!receiptData?.receiptCode) return;

        try {
            setLoadingLots(true);
            const data = await ReceiptsDashboardService.getDiscrepancyItemsWithLot(receiptData.receiptCode, lazyStateLot);
            setLotLines(data?.data || []);
            setTotalRecordsLot(data?.totalRecords || 0);
        } catch (error) {
            console.error('Failed to load receipt lot lines:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to load receipt lot lines.',
                life: 3000
            });
        } finally {
            setLoadingLots(false);
        }
    };

    const onPageItems = (event) => {
        setLazyState(event);
    };

    const onSortItems = (event) => {
        setLazyState(event);
    };

    const onPageLots = (event) => {
        setLazyStateLot(event);
    };

    const onSortLots = (event) => {
        setLazyStateLot(event);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '-';

        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    };

    const parseQty = (value) => {
        if (value === null || value === undefined || value === '') return 0;

        if (typeof value === 'number') return value;

        if (typeof value === 'string') {
            const match = value.match(/-?[\d.]+/);
            return match ? parseFloat(match[0]) : 0;
        }

        return 0;
    };

    const getQtyDisplay = (value) => {
        if (value === null || value === undefined || value === '') return '0';

        if (typeof value === 'string') {
            const match = value.match(/-?[\d.]+/);
            return match ? `${parseQty(match[0])}` : value;
        }

        return `${value}`;
    };

    // CHANGED: header PO No now shows all unique PO numbers from shipmentLines in comma separated format
    // REASON: one receipt can have multiple PO values, so do not show only first row PO
    const poRefValue = [
        ...new Set(
            (shipmentLines || [])
                .map((row) => row.po || row.poNumber)
                .filter((po) => po !== null && po !== undefined && po !== '')
        )
    ].join(', ') || '-';

    const actualReceiptBody = (rowData) => {
        const expected = parseQty(rowData.expectedQty);
        const actual = parseQty(rowData.actualQty);
        const diff = actual - expected;

        const isMatched = expected === actual;
        const displayValue = getQtyDisplay(rowData.actualQty);

        return (
            <div
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.2
                }}
            >
                <span
                    style={{
                        color: isMatched ? '#2e9f57' : '#d67a2d',
                        fontWeight: 600
                    }}
                >
                    {displayValue}
                </span>

                {isMatched ? (
                    <span
                        style={{
                            color: '#2e9f57',
                            fontWeight: 700,
                            fontSize: '14px'
                        }}
                    >
                        ✓
                    </span>
                ) : (
                    <span
                        style={{
                            color: '#d67a2d',
                            fontWeight: 600,
                            fontSize: '13px'
                        }}
                    >
                        {diff > 0 ? `(+${diff})` : `(${diff})`}
                    </span>
                )}
            </div>
        );
    };
    // CHANGED: added status badge for lot grid
    //  simple plain text status 
    const statusBody = (rowData) => {
        return rowData.status || '-';
    };



    // CHANGED: total qty now calculated from lower grid Qty column (lot_qty)
    const getLotTotalQty = () => {
        if (!lotLines?.length) return '0';

        return parseQty(lotLines[0].totalQty).toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    };
    // CHANGED: total no. of lines from lower grid
    const getLotLineCount = () => {
        return lotLines?.length || 0;
    };

    // CHANGED: Reject button now opens popup 
    const handleRejectClick = () => {
        setRejectReason('');
        setShowRejectPopup(true);
    };
    const userName = JSON.parse(localStorage.getItem("user"))?.user?.name;
    const userId = JSON.parse(localStorage.getItem("user"))?.user?.id;
    const userEmail = JSON.parse(localStorage.getItem("user"))?.user?.email;

    const data = {
        receiptCode: receiptData?.receiptCode || '',
        receiptId: Number(params.id),
        userName: userName,
        userId: Number(userId),
        userEmail: userEmail,
        receiptData: shipmentLines.length > 0
            ? [
                {
                    receiptId: Number(params.id),
                    totalExpected: parseQty(shipmentLines[0]?.totalExpectedQty),
                    totalReceived: parseQty(shipmentLines[0]?.totalActualQty)
                }
            ]
            : []
    };

    // CHANGED: actual API call moved here
    const confirmExportToX3 = async () => {
        setShowExportConfirm(false); // close popup

        try {
            if (isAlreadyExported) {
    toast.current?.show({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Receipt is already exported to X3',
        life: 3000
    });
    return;
}

            setActionLoading(true);

            const response = await ReceiptsDashboardService.exportReceiptToX3(data);

            if (response?.error === 0) {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Success',
                    detail: response?.message || 'Receipt exported successfully.',
                    life: 3000
                });

                await loadLogsData();
            } else {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: response?.message || 'Something went wrong',
                    life: 3000
                });
            }

        } catch (error) {
            const errorMessage =
                error?.response?.data?.message ||
                error?.message ||
                'Failed to export receipt.';

            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: errorMessage,
                life: 3000
            });

        } finally {
            setActionLoading(false);
        }
    };
    const handleSubmitReject = async () => {
        try {
            if (!rejectReason.trim()) {
                toast.current?.show({
                    severity: 'warn',
                    summary: 'Warning',
                    detail: 'Please enter a rejection reason.',
                    life: 3000
                });
                return;
            }

            // ADDED: Max 250 character validation
            if (rejectReason.length > 250) {
                toast.current?.show({
                    severity: 'warn',
                    summary: 'Warning',
                    detail: 'Word limit exceeded (max 250 characters allowed).',
                    life: 3000
                });
                return;
            }

            setActionLoading(true); // START LOADER

            const payload = {
                reason: rejectReason,
                receiptCode: receiptData?.receiptCode,
                userId: userId,
                userEmail: userEmail
            };

            const response = await ReceiptsDashboardService.rejectReceipt(params.id, payload);

            setShowRejectPopup(false);

            //  SUCCESS CASE
            if (response?.error === 0) {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Success',
                    detail: response?.message || 'Receipt rejected successfully.',
                    life: 3000
                });
            }
            //  ERROR CASE (BACKEND MESSAGE WILL COME HERE)
            else {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: response?.message || 'Something went wrong',
                    life: 3000
                });
            }

        } catch (error) {
            console.error('Reject submit failed:', error);

            //  This handles ONLY HTTP errors (400/500)
            const errorMessage =
                error?.response?.data?.message ||
                error?.message ||
                'Failed to reject receipt.';

            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: errorMessage,
                life: 3000
            });
        } finally {
            setActionLoading(false); //  STOP LOADER
        }
    };

    return (
        <>
            <Toast ref={toast} />
            {/* ADDED: VIEW LOGS BUTTON TOP RIGHT */}
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
            {/*  only Reject popup kept */}
            <Dialog
                visible={showRejectPopup}
                onHide={() => setShowRejectPopup(false)}
                closable={false}
                draggable={false}
                resizable={false}
                modal
                showHeader={false}
                style={{
                    width: '48rem',
                    maxWidth: '95vw'
                }}
                contentStyle={{
                    borderRadius: '10px',
                    border: '1.5px solid #ef4444',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                    padding: '0'
                }}
                maskStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.18)'
                }}
            >

                {/* CHANGED: reject popup UI exactly closer to wireframe */}
                <div style={{ padding: '16px' }}>
                    <div
                        style={{
                            color: '#dc2626',
                            fontWeight: 700,
                            fontSize: '24px',
                            textTransform: 'uppercase',
                            marginBottom: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <span style={{ fontSize: '22px' }}>✕</span>
                        <span>Reject Receipt</span>
                    </div>

                    <div
                        style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            marginBottom: '14px'
                        }}
                    >
                        {receiptData?.receiptCode || '-'} . PO {poRefValue} . Please provide a reason for rejection.
                    </div>

                    <InputTextarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={5}
                        maxLength={250}
                        autoResize={false}
                        placeholder="Enter a reason for discrepancy..."
                        style={{
                            width: '100%',
                            resize: 'none',
                            borderRadius: '6px',
                            border: '1px solid #d1d5db',
                            padding: '14px',
                            fontSize: '14px',
                            marginBottom: '14px',
                            minHeight: '110px'
                        }}
                    />
                    {/*  ADDED: Character counter */}
                    <div style={{
                        textAlign: 'right',
                        fontSize: '12px',
                        color: rejectReason.length > 250 ? '#dc2626' : '#6b7280',
                        marginBottom: '10px'
                    }}>
                        {rejectReason.length}/250
                    </div>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '10px'
                        }}
                    >
                        <Button
                            label="Cancel"
                            onClick={() => setShowRejectPopup(false)}
                            className="p-button-outlined"
                            style={{
                                border: '1px solid #d1d5db',
                                color: '#374151',
                                background: '#ffffff',
                                fontWeight: 500,
                                borderRadius: '6px',
                                height: '42px'
                            }}
                        />
                        <Button
                            label="Submit Rejection"
                            onClick={handleSubmitReject}
                            style={{
                                background: '#c81e1e',
                                border: '1px solid #c81e1e',
                                color: '#ffffff',
                                fontWeight: 600,
                                borderRadius: '6px',
                                height: '42px'
                            }}
                        />
                    </div>
                </div>
            </Dialog>
            {/* ADDED: Export Confirmation Popup */}
            <Dialog
                header="Confirmation"
                visible={showExportConfirm}
                style={{ width: '400px' }}
                modal
                onHide={() => setShowExportConfirm(false)}
            >
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem', color: '#f59e0b' }} />
                    <span>
                        Are you sure you want to export this receipt to X3?
                    </span>
                </div>

                <div className="flex justify-content-end gap-2 mt-4">
                    <Button
                        label="No"
                        icon="pi pi-times"
                        className="p-button-text"
                        onClick={() => setShowExportConfirm(false)}
                    />
                    <Button
                        label="Yes"
                        icon="pi pi-check"
                        className="p-button-text"
                        loading={actionLoading} // add this
                        onClick={confirmExportToX3} // IMPORTANT
                    />
                </div>
            </Dialog>

            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="p-fluid formgrid grid">
                    <div className="field col-12 md:col-4">
                        <h5 style={{ marginBottom: '0.75rem' }}>Receipt Code</h5>
                        <p style={{ margin: 0 }}>{receiptData?.receiptCode || '-'}</p>
                    </div>

                    <div className="field col-12 md:col-4">
                        <h5 style={{ marginBottom: '0.75rem' }}>PO No</h5>
                        <p style={{ margin: 0 }}>{poRefValue}</p>
                    </div>
                </div>
            </div>



            <div className="card">
                <div className="mb-5">
                    <h3 style={{ marginBottom: '1rem' }}>Receipt Lines By Items</h3>

                    <DataTable
                        value={shipmentLines}
                        lazy
                        paginator
                        showGridlines
                        first={lazyState.first}
                        rows={lazyState.rows}
                        totalRecords={totalRecords}
                        onPage={onPageItems}
                        onSort={onSortItems}
                        sortField={lazyState.sortField}
                        sortOrder={lazyState.sortOrder}
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                        loading={loadingItems || actionLoading}
                        responsiveLayout="scroll"
                        tableStyle={{ minWidth: '48rem' }}
                        emptyMessage="No receipt item lines found."
                        removableSort
                    >
                        <Column
                            field="mantis_SKU"
                            header="PO Number"
                            body={(rowData) => rowData.po || '-'}
                            style={{ width: '18%' }}
                        />

                        <Column
                            field="mantis_SKU"
                            header="Item"
                            body={(rowData) => rowData.itemCode || '-'}
                            style={{ width: '18%' }}
                        />
                        <Column
                            field="expectedQtyDisplay"
                            header="Expected Receipt"
                            body={(rowData) => getQtyDisplay(rowData.expectedQty || '0')}
                            style={{ width: '42%' }}
                        />
                        <Column
                            field="actualQtyDisplay"
                            header="Actual Receipt"
                            body={actualReceiptBody}
                            style={{ width: '20%' }}
                        />
                        <Column
                            field="status"
                            header="Status"
                            body={statusBody}
                        />
                    </DataTable>
                </div>

                <div className="mb-5">
                    <h3 style={{ marginBottom: '1rem' }}>Receipt Lines By LOT</h3>

                    <DataTable
                        value={lotLines}
                        lazy
                        paginator
                        showGridlines
                        first={lazyStateLot.first}
                        rows={lazyStateLot.rows}
                        totalRecords={totalRecordsLot}
                        onPage={onPageLots}
                        onSort={onSortLots}
                        sortField={lazyStateLot.sortField}
                        sortOrder={lazyStateLot.sortOrder}
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                        loading={loadingLots || actionLoading} //UPDATED
                        responsiveLayout="scroll"
                        tableStyle={{ minWidth: '48rem' }}
                        emptyMessage="No lot lines found."
                        removableSort
                    >
                        <Column
                            field="mantis_SKU"
                            header="PO"
                            body={(rowData) => rowData.poNumber || '-'}
                        />
                        <Column
                            field="mantis_SKU"
                            header="Item"
                            body={(rowData) => rowData.item || '-'}
                        />
                        <Column
                            field="actualLotNumber"
                            header="Lot Number"
                            body={(rowData) => rowData.lotNumber || '-'}
                        />
                        <Column
                            field="expiryDate"
                            header="Expiration Date"
                            body={(rowData) => formatDate(rowData.expirationDate || '-')}
                        />
                        <Column
                            field="x3_QtyDisplay"
                            header="Qty"
                            body={(rowData) => getQtyDisplay(rowData.qty || '0')}
                            footerStyle={{ fontWeight: 'bold' }}
                        />

                    </DataTable>
                </div>

                {/* CHANGED: added lower grid summary on left side from FE */}
                {/* CHANGED: total lines = lower grid row count, total qty = sum of lower grid Qty */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '12px',
                        marginTop: '24px',
                        flexWrap: 'wrap'
                    }}
                >
                    <div
                        style={{
                            fontSize: '14px',
                            color: '#6b7280'
                        }}
                    >
                        <div
                            style={{
                                fontSize: '14px',
                                color: '#6b7280'
                            }}
                        >
                            {totalRecordsLot} lines&nbsp;&nbsp;.&nbsp;&nbsp;{getLotTotalQty()} units total
                        </div>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '12px'
                        }}
                    >
                        {/* CHANGED: Hide Reject button if already exported */}
                        {!isAlreadyExported && hasActionAccess(PAGE_KEY, "Reject") && (
                            <Button
                                label="Reject"
                                icon="pi pi-times"
                                className="p-button-outlined"
                                onClick={handleRejectClick}
                                style={{
                                    background: '#ffffff',
                                    color: '#dc2626',
                                    border: '1px solid #dc2626',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    padding: '0.8rem 1.4rem'
                                }}
                            />
                        )}

                        {hasActionAccess(PAGE_KEY, "Export To X3") && (
                            <Button
                                label={isAlreadyExported ? 'Already Exported' : 'Export To X3'}
                                onClick={() => setShowExportConfirm(true)}
                                disabled={isAlreadyExported || actionLoading}
                                style={{
                                    background: isAlreadyExported ? '#9ca3af' : '#2563eb',
                                    border: isAlreadyExported ? '1px solid #9ca3af' : '1px solid #2563eb',
                                    color: '#ffffff',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    padding: '0.8rem 1.4rem'
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}