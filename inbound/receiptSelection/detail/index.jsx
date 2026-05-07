import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog'; // CHANGED: added Dialog for confirm/discrepancy popup
import { useNavigate, useParams } from 'react-router-dom';
import '../../../../assets/styles.css';
import { ReceiptsDashboardService } from '../../../../service/inbound/ReceiptDashboardService';
import { ReceiptExportService } from '../../../../service/inbound/ReceiptExportService';
import { useAuth } from '../../../../store/useAuth';

export default function ReceiptSelectionDetail() {
    const [loadingItems, setLoadingItems] = useState(false);
    const [loadingLots, setLoadingLots] = useState(false);
    const [loadingDiscrepancyItems, setLoadingDiscrepancyItems] = useState(false); // CHANGED: separate loader for discrepancy popup API
    const [actionLoading, setActionLoading] = useState(false); //ADDED: global loader for confirm/acknowledge
    const [receiptData, setReceiptData] = useState(null);
    const [shipmentLines, setShipmentLines] = useState([]);
    const [lotLines, setLotLines] = useState([]);

    const [totalRecords, setTotalRecords] = useState(0);
    const [totalRecordsLot, setTotalRecordsLot] = useState(0);
    const {hasActionAccess} = useAuth();
    const PAGE_KEY = "receiptSelection_Details";
    const toast = useRef(null);
    const navigate = useNavigate();
    const params = useParams();

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
    const isNoData = totalRecords === 0 && totalRecordsLot === 0;

    // CHANGED: popup state for confirm/discrepancy flow
    // REASON: on Confirm click, popup now depends on discrepancy API instead of current paginated grid rows
    const [showConfirmPopup, setShowConfirmPopup] = useState(false);
    const [discrepancyItems, setDiscrepancyItems] = useState([]);
    const [discrepancyTotalRecords, setDiscrepancyTotalRecords] = useState(0); // CHANGED: bind lines count from BE totalRecords
    // REASON: disable confirm button when statusCode = 3
    const isReceiptCompleted = receiptData?.receiptStatus === "Completed";

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
            const data = await ReceiptsDashboardService.getReceiptDetail(receiptData.receiptCode, lazyState);
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
            const data = await ReceiptsDashboardService.getReceiptDetailsLots(receiptData.receiptCode, lazyStateLot);
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

    // CHANGED: collect all unique PO numbers from shipmentLines and show them comma separated
    // REASON: one receipt can have multiple PO numbers at line level, so we need to display all unique POs in header
    const poRefValue = [
        ...new Set(
            (shipmentLines || [])
                .map((row) => row.po)
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

    const getLotTotalQty = () => {
        let total = 0;

        lotLines?.forEach((row) => {
            total += parseQty(row.x3_Qty);
        });

        return total.toFixed(2);
    };

    const handleCancel = () => {
        navigate(-1);
    };

    // CHANGED: removed old FE-only discrepancy calculation from paginated grid
    // REASON: discrepancy popup must not depend on current page size / pagination
    //  NO CHANGE ABOVE

    const handleConfirm = async () => {
        try {
            //  ADDED: prevent API call if already completed
            if (receiptData?.statusCode === 3) {
                toast.current?.show({
                    severity: 'warn',
                    summary: 'Warning',
                    detail: 'Receipt is already completed.',
                    life: 3000
                });
                return;
            }

            setLoadingDiscrepancyItems(true);

            setActionLoading(true); //  ADDED: START FULL SCREEN GRID LOADER

            const response = await ReceiptsDashboardService.getDiscrepancyItemsOnly(receiptData.receiptCode);

            const mismatchItems = response?.data || [];
            setDiscrepancyItems(mismatchItems);

            setDiscrepancyTotalRecords(response?.totalRecords || mismatchItems.length || 0);

            setShowConfirmPopup(true);
        } catch (error) {
            console.error('Confirm popup failed:', error);
            toast.current?.show({
                severity: 'error',
                summary: 'Error',
                detail: 'Failed to open confirmation popup.',
                life: 3000
            });
        } finally {
            setLoadingDiscrepancyItems(false);
            setActionLoading(false); //  ADDED: STOP LOADER AFTER RESPONSE
        }
    };

    // CHANGED: final submit handler separated from handleConfirm
    // REASON: actual submit action should happen only after user confirms from popup
    const userName = JSON.parse(localStorage.getItem("user"))?.user?.name;
    const userId = JSON.parse(localStorage.getItem("user"))?.user?.id;
    const userEmail = JSON.parse(localStorage.getItem("user"))?.user?.email;

    const handleFinalSubmit = async () => {
        try {
            setShowConfirmPopup(false);
            setActionLoading(true); // ✅ START LOADER

            const data = {
                userName: userName,
                userId: userId,
                userEmail: userEmail,
                receiptCode: receiptData?.receiptCode
            };

            const response = await ReceiptsDashboardService.updateReceiptStatus(params.id, data);

            //  SUCCESS CASE
            if (response?.error === 0) {
                toast.current?.show({
                    severity: 'success',
                    summary: 'Success',
                    detail: response?.message || 'Receipt confirmed successfully.',
                    life: 3000
                });
            }
            //  ERROR CASE (this will show "Primary mail is not present.")
            else {
                toast.current?.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: response?.message || 'Something went wrong',
                    life: 3000
                });
            }

        } catch (error) {
            console.error('Final submit failed:', error);

            //  This will only trigger for NETWORK / 500 errors
            const errorMessage =
                error?.response?.data?.message ||
                error?.message ||
                'Failed to confirm receipt.';

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

    // CHANGED: popup content renderer now uses discrepancy items directly from BE API
    // REASON: same confirm button should show 2 different popup designs based on backend discrepancy response
    const renderConfirmPopupContent = () => {
        const hasDiscrepancy = discrepancyItems.length > 0;

        if (!hasDiscrepancy) {
            return (
                <div style={{ padding: '8px 6px 0 6px' }}>
                    <div
                        style={{
                            fontSize: '28px',
                            fontWeight: 800,
                            letterSpacing: '0.5px',
                            color: '#2f2f2f',
                            marginBottom: '28px',
                            textTransform: 'uppercase'
                        }}
                    >
                        CONFIRM SUBMIT
                    </div>

                    <div
                        style={{
                            fontSize: '16px',
                            color: '#5b5b5b',
                            marginBottom: '40px'
                        }}
                    >
                        All Items received, confirm receipt.
                    </div>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '12px'
                        }}
                    >
                        <Button
                            label="← Back"
                            onClick={() => setShowConfirmPopup(false)}
                            className="p-button-outlined"
                            style={{
                                background: '#ffffff',
                                color: '#6b7280',
                                border: '1px solid #d1d5db',
                                justifyContent: 'center'
                            }}
                        />
                        <Button
                            label="Submit"
                            onClick={handleFinalSubmit}
                            style={{
                                background: '#22a93a',
                                border: '1px solid #22a93a',
                                color: '#ffffff',
                                justifyContent: 'center'
                            }}
                        />
                    </div>
                </div>
            );
        }

        return (
            <div style={{ padding: '8px 6px 0 6px' }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '14px'
                    }}
                >
                    <span style={{ fontSize: '24px', color: '#f2b91d' }}>⚠</span>
                    <div
                        style={{
                            fontSize: '28px',
                            fontWeight: 800,
                            letterSpacing: '0.5px',
                            color: '#c26a0a',
                            textTransform: 'uppercase'
                        }}
                    >
                        DISCREPANCY REVIEW
                    </div>
                </div>

                <div
                    style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        marginBottom: '18px'
                    }}
                >
                    {discrepancyTotalRecords} lines have quantity differences. You must acknowledge before submitting.
                </div>

                <div style={{ marginBottom: '22px' }}>
                    {discrepancyItems.map((item, index) => {
                        // CHANGED: mapped popup fields according to BE response from new discrepancy SP
                        // REASON: SP returns ItemCode / ExpectedQty / ActualQty / TotalRecords
                        const expected = parseQty(item.expectedQty);
                        const actual = parseQty(item.actualQty);
                        const diff = actual - expected;

                        return (
                            <div
                                key={`${item.itemCode || item.input_item || index}-${index}`}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '10px 0',
                                    borderBottom: index !== discrepancyItems.length - 1 ? '1px solid #e5e7eb' : 'none',
                                    gap: '16px'
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '15px',
                                        color: '#444',
                                        fontWeight: 500
                                    }}
                                >
                                    Item - {item.itemCode || '-'}
                                </div>

                                <div
                                    style={{
                                        fontSize: '14px',
                                        color: '#c26a0a',
                                        fontWeight: 700,
                                        textAlign: 'right'
                                    }}
                                >
                                    Expected {expected} → Actual {actual} ({diff > 0 ? `+${diff}` : diff})
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px'
                    }}
                >
                    <Button
                        label="← Back"
                        onClick={() => setShowConfirmPopup(false)}
                        className="p-button-outlined"
                        style={{
                            background: '#ffffff',
                            color: '#6b7280',
                            border: '1px solid #d1d5db',
                            justifyContent: 'center'
                        }}
                    />
                    <Button
                        label="I Acknowledge – Submit"
                        onClick={handleFinalSubmit}
                        style={{
                            background: '#c96a08',
                            border: '1px solid #c96a08',
                            color: '#ffffff',
                            justifyContent: 'center'
                        }}
                    />
                </div>
            </div>
        );
    };

    return (
        <>
            <Toast ref={toast} />

            {/* CHANGED: added confirmation/discrepancy popup */}
            {/* REASON: show different popup design on Confirm click depending on discrepancy API result */}
            <Dialog
                visible={showConfirmPopup}
                onHide={() => setShowConfirmPopup(false)}
                closable={false}
                draggable={false}
                resizable={false}
                modal
                showHeader={false}
                style={{
                    width: discrepancyItems.length > 0 ? '42rem' : '38rem',
                    maxWidth: '95vw'
                }}
                contentStyle={{
                    borderRadius: '14px',
                    border: discrepancyItems.length > 0 ? '2px solid #f1c24f' : '2px solid #4a4a4a',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
                    padding: '18px 18px 16px 18px'
                }}
                maskStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.22)',
                }}
            >
                {renderConfirmPopupContent()}
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
                            header="Item"
                            body={(rowData) => rowData.itemCode || '-'}
                            style={{ width: '18%' }}
                        />
                        <Column
                            field="expectedQtyDisplay"
                            header="Expected Receipt"
                            body={(rowData) =>
                                getQtyDisplay(rowData.expectedQty || '0')
                            }
                            style={{ width: '42%' }}
                        />
                        <Column
                            field="actualQtyDisplay"
                            header="Actual Receipt"
                            body={actualReceiptBody}
                            style={{ width: '20%' }}
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
                        loading={loadingLots || actionLoading}
                        responsiveLayout="scroll"
                        tableStyle={{ minWidth: '48rem' }}
                        emptyMessage="No lot lines found."
                        removableSort
                    >
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
                            body={(rowData) => formatDate(rowData.expirationDate)}
                        />
                        <Column
                            field="x3_QtyDisplay"
                            header="Qty"
                            body={(rowData) => getQtyDisplay(rowData.qty || '0')}
                            footerStyle={{ fontWeight: 'bold' }}
                        />
                    </DataTable>
                </div>

                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '12px',
                        marginTop: '24px'
                    }}
                >
                    <Button
                        label="Cancel"
                        className="p-button-outlined p-button-secondary"
                        onClick={handleCancel}
                    />
                    {hasActionAccess(PAGE_KEY, "Confirm Receipt") && (<Button
                        label={
                            isNoData
                                ? 'No Data to Confirm'
                                : isReceiptCompleted
                                    ? 'Already Completed' // better UX label

                                    : loadingDiscrepancyItems
                                        ? 'Loading...'
                                        : 'Confirm'
                        }
                        icon="pi pi-arrow-right"
                        iconPos="right"
                        className="p-button-primary"
                        onClick={handleConfirm}

                        //  CHANGED: disable when completed OR loading
                        disabled={loadingDiscrepancyItems || isReceiptCompleted || isNoData}
                    />)}
                </div>
            </div>
        </>
    );
}