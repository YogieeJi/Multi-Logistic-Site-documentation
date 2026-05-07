
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Calendar } from 'primereact/calendar';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Helmet } from 'react-helmet';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Menu } from 'primereact/menu';
import { ItemsStockService } from '../../../service/operations/stock';
import titles from '../../titles';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { useLazySort } from "../../../components/useLazySort";
import { useAuth } from '../../../store/useAuth';


export default function OutboundLogs() {
    const {hasActionAccess} = useAuth();
    const PAGE_KEY = "item-stock";
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [logs, setLogs] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedLogs, setSelectedLogs] = useState(null);
    const [dates, setDates] = useState(null);
    const [visible, setVisible] = useState(false);
    const [dialogText, setDialogText] = useState('');
    const toast = useRef();
    const [reasonDropdownlist, setReasonDropdownlist] = useState(null);
    const [reason, setReason] = useState(null);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 25,
        page: 0,
        sortField: "",
        sortOrder: "",
        filters: {
            prd_PrimaryCode: { value: null, matchMode: 'contains' },
            prdl_Description: { value: null, matchMode: 'contains' },
            loc_Code: { value: null, matchMode: 'contains' },
            pkt_Description: { value: null, matchMode: 'contains' },
            productPackTypeDescription: { value: null, matchMode: 'contains' },
            stc_SSCC: { value: null, matchMode: 'contains' },
            SPTQuantity: { value: null, matchMode: 'contains' },
            sptQuantityFree: { value: null, matchMode: 'contains' },
            LotNum: { value: null, matchMode: 'contains' },
            exp_date: { value: null, matchMode: 'contains' },
            first_receipt_date: { value: null, matchMode: 'contains' },
            reserveReasonDescr: { value: null, matchMode: 'contains' },
        }
    });
    const { onSort } = useLazySort(setlazyState);
    const [displayConfirmation, setDisplayConfirmation] = useState(false);
    const [displayConfirmationRemove, setDisplayConfirmationRemove] = useState(false);
    const menuLeft = useRef(null);
    const items = [{ label: 'Stock' }, { label: 'Item Stock' }];
    const home = { icon: 'pi pi-home', url: '/' }
    const [btnDisabled, setbtnDisabled] = useState(true);
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

        ItemsStockService.getStockReserveReasons().then((data) => {
            if (data.error == 0) {
                setReasonDropdownlist(data.data);
            }
        });
    }, []);
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
            ItemsStockService.ItemStock((lazyState)).then((data) => {

                setTotalRecords(data.totalRecords);
                setLogs(data.data);
                setLoading(false);


            });
        }, Math.random() * 100 + 250);
    };

    const onPage = (event) => {
        setlazyState(event);
        setSelectAll(false);
    };

    const onFilter = (event) => {
        event['first'] = 0;
        setlazyState(event);
    };

    const onSelectionChange = (e) => {
        const attempted = e.value;
        const invalid = attempted.find(item => item.sptQuantityFree !== item.sptQuantity);

        if (invalid) {
            toast.current.show({
                severity: 'warn',
                summary: 'Selection Blocked',
                detail: 'This row cannot be selected (quantity mismatch).',
                life: 3000
            });

            // Remove invalid rows from selection
            const validOnly = attempted.filter(item => item.sptQuantityFree === item.sptQuantity);
            setSelectedLogs(validOnly);
        } else {
            setSelectedLogs(attempted);
        }
    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;

        if (selectAll) {
            const validRows = logs.filter(row => row.sptQuantityFree === row.sptQuantity);
            setSelectAll(true);
            setSelectedLogs(validRows);

            const invalidCount = logs.length - validRows.length;
            if (invalidCount > 0) {
                toast.current?.show({
                    severity: 'info',
                    summary: 'Partial Selection',
                    detail: `${invalidCount} row(s) were skipped due to quantity mismatch.`,
                    life: 3000
                });
            }
        } else {
            setSelectAll(false);
            setSelectedLogs([]);
        }
    };

    const descriptionBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.prdl_Description}
            </>
        );
    };
    const locationBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.loc_Code}
            </>
        );
    };

    const storageBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.pkt_Description}
            </>
        );
    };
    const packBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.productPackTypeDescription}
            </>
        );
    };
    const SSCCBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.stc_SSCC}
            </>
        );
    };
    const quantityBodyTemplate = (rowData) => {
        return rowData.sptQuantity != null
            ? parseFloat(rowData.sptQuantity)
            : "";
    };

    const availableBodyTemplate = (rowData) => {
        return rowData.sptQuantityFree != null
            ? parseFloat(rowData.sptQuantityFree)
            : "";
    };

    // const quantityBodyTemplate = (rowData) => {
    //     return (
    //         <> {rowData.sptQuantity }
    //         </>
    //     );
    // };
    // const availableBodyTemplate = (rowData) => {
    //     return (
    //         <>
    //             {rowData.sptQuantityFree}
    //         </>
    //             // {rowData.sptQuantityFree != null ? rowData.sptQuantityFree.toFixed(6) : ''}
    //     );
    // };

    const lotnumBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.lotNum}
            </>
        );
    };
    const exp_dateBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.exp_date}
            </>
        );
    };
    const first_receipt_dateBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.first_receipt_date}
            </>
        );
    };

    const actionItems = [
        hasActionAccess(PAGE_KEY,"add_reservation_reason")&&{
            label: 'Add Reservation Reason',
            icon: 'pi pi-plus',
            command: () => {
                if (selectedLogs != null && selectedLogs.length > 0) {
                    setDisplayConfirmation(true)
                    setbtnDisabled(true)
                    setReason(null)
                } else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Kindly select atleast 1 stock' });
                }
            }
        },
        hasActionAccess(PAGE_KEY,"remove_reservation_reason")&&{
            label: 'Remove Reservation Reason',
            icon: 'pi pi-minus',
            command: () => {
                if (selectedLogs != null && selectedLogs.length > 0) {
                    setDisplayConfirmationRemove(true)
                    // setbtnDisabled(true) 
                } else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Kindly select atleast 1 stock' });
                }
            }
        },].filter(Boolean)

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <Menu model={actionItems} popup ref={menuLeft} id="popup_menu_left" />
                {actionItems.length > 0 && (<Button label="Actions" icon="pi pi-align-left" className="mr-2" onClick={(event) => menuLeft.current.toggle(event)} aria-controls="popup_menu_left" aria-haspopup />)}
            </span>


        </div>
    );


    const rowClassName = (rowData) => {
        return rowData.sptQuantityFree !== rowData.sptQuantity ? 'row-red' : '';
    };

    const isRowSelectable = (event) => {
        // Disable selection if SPTQuantityFree !== SPTQuantity
        return event.data.sptQuantityFree === event.data.sptQuantity;
    }

    const onSubmitReason = () => {
        setLoading(true);
        setbtnDisabled(true);
        const data = {
            stock: selectedLogs.map(line => line.spt_ID),
            reason: reason,
            quatity: selectedLogs.map(line => line.sptQuantityFree),
            location: selectedLogs.map(line => line.loc_Code)
        }

        ItemsStockService.addReservationReason((data)).then((data) => {
            setLoading(false);
            setDisplayConfirmation(false)
            if (data.error == 0) {
                toast.current.show({
                    severity: 'success',
                    sticky: data.errors.length > 0, // Only sticky if there are errors
                    life: data.errors.length === 0 ? 3000 : null, // Will disappear after 3 seconds if no errors
                    content: (props) => {
                        const errors = Array.isArray(data.errors)
                            ? data.errors.map((err, i) => <div key={i}>{err}.</div>)
                            : <div>{data.errors}</div>;

                        return (
                            <div className="flex flex-column align-items-left" style={{ flex: '1' }}>
                                <div className="font-medium text-lg my-3 text-900">{data.message}</div>
                                <div style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '8px' }}>
                                    {errors}
                                </div>
                            </div>
                        );
                    }
                });
                setSelectAll(false);
                setSelectedLogs(null)
                loadLazyData();

            }
            else {
                setSelectAll(false);
                setSelectedLogs(null)
                setbtnDisabled(false);

                toast.current.show({
                    severity: 'error',
                    sticky: false, // stays until manually closed
                    life: 1000,
                    content: (props) => {
                        const errors = Array.isArray(data.errors)
                            ? data.errors.map((err, i) => <div key={i}>{err}.</div>)
                            : <div>{data.errors}</div>;

                        return (
                            <div className="flex flex-column align-items-left" style={{ flex: '1' }}>
                                <div className="font-medium text-lg my-3 text-900">{data.message}</div>
                                <div style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '8px' }}>
                                    {errors}
                                </div>
                            </div>
                        );
                    }
                });
            }
            setbtnDisabled(false);
            setDisplayConfirmation(false)
        });

    };
    const removeReservation = () => {
        setLoading(true);
        setbtnDisabled(true);
        const data = {
            stock: selectedLogs.map(line => line.spt_ID),
            reason: 0,
            quatity: selectedLogs.map(line => line.sptQuantityFree),
            location: selectedLogs.map(line => line.loc_Code)
        }

        ItemsStockService.removeReservationReason((data)).then((data) => {
            setLoading(false);
            setDisplayConfirmationRemove(false)
            if (data.error == 0) {
                toast.current.show({
                    severity: 'success',
                    sticky: data.errors.length > 0, // Only sticky if there are errors
                    life: data.errors.length === 0 ? 3000 : null, // Will disappear after 3 seconds if no errors
                    content: (props) => {
                        const errors = Array.isArray(data.errors)
                            ? data.errors.map((err, i) => <div key={i}>{err}.</div>)
                            : <div>{data.errors}</div>;

                        return (
                            <div className="flex flex-column align-items-left" style={{ flex: '1' }}>
                                <div className="font-medium text-lg my-3 text-900">{data.message}</div>
                                <div style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '8px' }}>
                                    {errors}
                                </div>
                            </div>
                        );
                    }
                });
                setSelectAll(false);
                setSelectedLogs(null)
                loadLazyData();

            }
            else {
                setSelectAll(false);
                setSelectedLogs(null)
                toast.current.show({
                    severity: 'error',
                    sticky: false,

                    life: 3000,

                    content: (props) => {
                        const errors = Array.isArray(data.errors)
                            ? data.errors.map((err, i) => <div key={i}>{err}.</div>)
                            : <div>{data.errors}</div>;

                        return (
                            <div className="flex flex-column align-items-left" style={{ flex: '1' }}>
                                <div className="font-medium text-lg my-3 text-900">{data.message}</div>
                                <div style={{ maxHeight: '200px', overflowY: 'auto', paddingRight: '8px' }}>
                                    {errors}
                                </div>
                            </div>
                        );
                    }
                });
            }
            setDisplayConfirmationRemove(false)
        });

    };


    const confirmationDialogFooter3 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmationRemove(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => removeReservation()} className="p-button-text" autoFocus />
        </>
    );
    const confirmationDialogFooter = (
        <div>
            <Button label="Submit" disabled={btnDisabled} icon="pi pi-check" onClick={() => onSubmitReason()} />
        </div>
    );
    return (
        <>
            <Helmet>
                <title>{titles.Stock}</title>
            </Helmet>
            <Toast ref={toast} />
            <BreadCrumb model={items} home={home} />

            <Dialog header="Confirmation" visible={displayConfirmationRemove} onHide={() => setDisplayConfirmationRemove(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter3}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to proceed?</span>
                </div>
            </Dialog>
            <Dialog header="Reservation Reason" visible={displayConfirmation} style={{ width: '40vw' }}
                onHide={() => { setDisplayConfirmation(false); setReason(null) }} footer={confirmationDialogFooter}>
                <div className="p-fluid formgrid grid">
                    <div className="field col-12 md:col-9">
                        <label className='pl-3'>Reason *</label>
                        <Dropdown
                            style={{ marginRight: 5, marginLeft: 10 }}
                            value={reason}
                            optionValue="srr_ID"
                            optionLabel="srr_Description"
                            onChange={(e) => {
                                setReason(e.value)
                                setbtnDisabled(false)
                            }}
                            options={reasonDropdownlist}
                            placeholder="Select Reason"

                        />
                    </div>

                </div>
            </Dialog>

            <h1></h1>
            <div className="card">
                <h3>Item Stock</h3>
                <DataTable
                    value={logs}
                    lazy
                    filterDisplay="row"
                    dataKey="spt_StockID"
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
                    rowsPerPageOptions={[25, 50, 100, 500, 1000, 5000]}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                    loading={loading}
                    tableStyle={{ minWidth: '75rem' }}
                    emptyMessage="No data found."
                    onSelectAllChange={onSelectAllChange}
                    onSelectionChange={onSelectionChange}
                    selection={selectedLogs}
                    selectAll={selectAll}
                    header={header}
                    scrollable
                    scrollHeight="600px"
                    rowClassName={rowClassName}
                    rowSelectable={isRowSelectable}
                >
                    <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
                    <Column field="prd_PrimaryCode" style={{ width: '20rem' }} header="Item" body={rowdata => (rowdata.prd_PrimaryCode)} filterMenuStyle={{ width: '25rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="prdl_Description" header="Item Description" body={descriptionBodyTemplate} filterMenuStyle={{ width: '20rem' }} style={{ width: '20rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="loc_Code" header="location" body={locationBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="pkt_Description" header="Storage unit pack type" body={storageBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="productPackTypeDescription" style={{ width: '10rem' }} header="Pack type" body={packBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="stc_SSCC" header="SSCC" body={SSCCBodyTemplate} style={{ width: '16rem' }} filterMenuStyle={{ width: '16rem' }} showFilterMenu={false} sortable filter filterP laceholder="Search" />
                    <Column field="SPTQuantity" header="Quantity" body={quantityBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="sptQuantityFree" header="Available quantity" body={availableBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="LotNum" header="LotNum" body={lotnumBodyTemplate} style={{ width: '14rem' }} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    {/* <Column field="reserveReasonDescr" header="Reservation Reason" body={rowdata=>(rowdata.reserveReasonDescr)} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" /> */}
                    <Column field="reserveReasonDescr" filterField="reserveReasonDescr" header="Reservation Reason" body={rowdata => rowdata.reserveReasonDescr} filter filterPlaceholder="Search" filterMatchMode="contains" showFilterMenu={false} sortable filterMenuStyle={{ width: '14rem' }} />
                    <Column field="exp_date" header="exp_date" body={exp_dateBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="first_receipt_date" header="first_receipt_date" body={first_receipt_dateBodyTemplate} sortable showFilterMenu={false} filter filterPlaceholder="Search" />
                </DataTable>
            </div>
        </>

    );
}
