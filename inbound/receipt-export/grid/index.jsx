import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Helmet } from 'react-helmet';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Badge } from 'primereact/badge';
import { Menu } from 'primereact/menu';
import { OverlayPanel } from 'primereact/overlaypanel';
import { useLazySort } from '../../../../components/useLazySort';
import { ReceiptExportService } from '../../../../service/inbound/ReceiptExportService';
import { UserSettingService } from '../../../../service/settings/UserSettingService';
import { useAuth } from '../../../../store/useAuth';


export default function ReceiptsExport() {
    const { hasActionAccess } = useAuth();
    const PAGE_KEY = "inbound_receiptsExport";
    const {hasPageAccess} = useAuth()
    const Detail_PAGE_KEY = "Receipt_Export_Details";

    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [receiptExports, setReceiptExports] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState(() => {
        const savedSelection = localStorage.getItem("selectedOrders");
        return savedSelection ? JSON.parse(savedSelection) : [];
    });
    const [nextCursor, setNextCursor] = useState(null);
    const [exporttoSageX3DisplayConfirmation, setExporttoSageX3DisplayConfirmation] = useState(false);
    const [markAsExportedDisplayConfirmation, setMarkAsExportedDisplayConfirmation] = useState(false);
    const [selectedOption, setSelectedOption] = useState([]);
    const [optionsList, setOptionsList] = useState([]);
    const [users, setUsers] = useState(null);
    const op = useRef(null);
    const tableRef = useRef(null);
    const params = useParams();
    const getLvStatusSeverity = (flag) => {
        switch (flag) {
            case 'Pending':
                return 'info';

            case 'Closed':
                return 'primary';

            case 'In-Progress':
                return 'primary';

            case 'Cancelled':
                return 'danger';

            default:
                return 'success';
        }
    };

    const getSeverity = (flag) => {
        switch (flag) {
            case 'Yes':
                return 'success';

            case 'No':
                return 'danger';

            case 'Pending':
                return 'secondary';

            case 'Partial':
                return 'primary';

            case 'Completed':
                return 'success';

            case 'Failed':
                return 'danger';
        }
    };

    const menuLeft = useRef(null);
    const toast = useRef();
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 25,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {
            receiptCode: { value: null, matchMode: 'contains' },
            receivedDate: { value: null, matchMode: 'contains' },
            receiptStatus: { value: null, matchMode: 'contains' },
            confirmationDate: { value: null, matchMode: 'contains' },
            confirmedBy: { value: null, matchMode: 'contains' },
        }
    });

    const { onSort } = useLazySort(setlazyState);

    const actionItems = [
        hasActionAccess(PAGE_KEY, "export_to_sagex3") && {
            label: 'Export to Sage X3',
            icon: 'fa fa-times',
            command: () => {
                if (selectedDelivery != null && selectedDelivery?.length > 0) {
                    onclick(setExporttoSageX3DisplayConfirmation(true))
                }
                else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Kindly select atleast 1 receipt' });
                }
            }
        },
        hasActionAccess(PAGE_KEY, "mark_as_exported") && {
            label: 'Mark as Exported',
            icon: 'fa fa-times',
            command: () => {
                if (selectedDelivery != null && selectedDelivery?.length > 0) {
                    onclick(setMarkAsExportedDisplayConfirmation(true))
                }
                else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Kindly select atleast 1 receipt' });
                }
            }
        },
    ].filter(Boolean);

    const items = [{ label: 'Receipt' }, { label: 'Receipt Export' }];
    const home = { icon: 'pi pi-home', url: '/' }

    let networkTimeout = null;

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);

    const loadLazyData = () => {
        if (loading) return;
        setLoading(true);

        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }

        // wrap your APIs in promises
        const receiptExportPromise = new Promise((resolve) => {
            networkTimeout = setTimeout(() => {
                ReceiptExportService.getReceiptExportGrid(lazyState).then((data) => {
                    setTotalRecords(data.totalRecords);
                    setReceiptExports(data.data);
                    resolve();
                });
            }, 300);
        });

        // wait for all promises to finish
        Promise.all([receiptExportPromise]).finally(() => setLoading(false));

        // just for checking the data 
        const DefaultRowValue = 10;
        localStorage.setItem("rowsPerPage", DefaultRowValue);
    };

    const onPage = (event) => {
        setlazyState(event);
        setTimeout(() => {
            if (tableRef.current) {
                const scrollableBody = tableRef.current.getTable().parentElement;
                scrollableBody.scrollTop = 0;
            }
        }, 0);
    };

    const onFilter = (event) => {
        const filters = { ...event.filters };
        setlazyState({
            ...event,
            first: 0,
            filters
        });
    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;
        const currentPagereceiptIds = receiptExports.map(order => order.receiptCode);

        const existingSelected = JSON.parse(localStorage.getItem("selectedOrders")) || [];

        if (selectAll) {
            setSelectAll(true);

            // Merge current page orders with existing selections
            const newSelected = [...existingSelected];

            receiptExports.forEach(order => {
                if (!newSelected.find(o => o.receiptCode === order.receiptCode)) {
                    newSelected.push(order);
                }
            });

            localStorage.setItem("selectedOrders", JSON.stringify(newSelected));
        } else {
            setSelectAll(false);

            // Remove current page orders from selected
            const filteredSelected = existingSelected.filter(order =>
                !currentPagereceiptIds.includes(order.receiptCode)
            );

            localStorage.setItem("selectedOrders", JSON.stringify(filteredSelected));
        }

        receiptExportData();
    };

    const hasDetailAccess = hasPageAccess(Detail_PAGE_KEY);

    const receiptCodeBodyTemplate = (rowData) => {
        return hasDetailAccess ? (
            <Link to={`/inbound/receipt-export/${rowData.id}`}>
                {rowData.receiptCode}
            </Link>
        ) : (
            <span style={{ color: '#999', cursor: 'not-allowed' }}>
                {rowData.receiptCode}
            </span>
        );
    };

    const receivedDateBodyTemplate = (rowData) => {
        if (!rowData.receivedDate) return <>-</>;

        const [year, month, day] = rowData.receivedDate.split('T')[0].split('-');
        return <>{`${month}/${day}/${year}`}</>;
    };

    const receiptStatusBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.receiptStatus}
            </>
        );
    };

    const confirmationDateBodyTemplate = (rowData) => {
        if (!rowData.confirmationDate) return '';

        const date = new Date(rowData.confirmationDate);

        // Add 5 hours 30 minutes (IST)
        date.setMinutes(date.getMinutes() + 330);

        const month = String(date.getMonth() + 1).padStart(2, '0'); // 0-based months
        const day = String(date.getDate()).padStart(2, '0');
        const year = date.getFullYear();

        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
    };

    const confirmedByBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.confirmedByUser}
            </>
        );
    };

    const created_atBodyTemplate = (rowData) => {
        if (!rowData.created_at) return "";

        // Extract date part directly from the string without JS Date conversion
        const datePart = rowData.created_at.split("T")[0];
        return <>{datePart}</>;
    };

    const TaskCompletionBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.completed == null || rowData.completed == 0) ? <Badge value="No" severity="danger"></Badge> : <Badge value="Yes" severity="success"></Badge>}
            </>
        );
    };

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="flex mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <Menu model={actionItems} popup ref={menuLeft} id="popup_menu_left" />
                {actionItems.length > 0 && (<Button label="Actions" icon="pi pi-align-left" className="mr-2" onClick={(event) => menuLeft.current.toggle(event)} aria-controls="popup_menu_left" aria-haspopup />)}

                <div className="block mt-2 md:mt-0 flex align-items-center bg-bd-cl">
                    <Button
                        onClick={() => RefreshEntireList()}
                        icon="pi pi-times"
                        className="p-button-text p-button-gray mr-3"
                        tooltip="Close"
                        tooltipOptions={{ position: 'top' }}
                    />
                    <label htmlFor="PickList ID">Receipt Code: </label>
                    <span className="selected-count ml-2">
                        {selectedDelivery.length > 0
                            ? `${selectedDelivery.length} Record${selectedDelivery.length > 1 ? 's' : ''} Selected`
                            : 'Select Record'}
                    </span>

                    <Button
                        onClick={(e) => op.current.toggle(e)}
                        icon="pi pi-list"
                        className="p-button-text p-button-gray mr-3"
                        tooltip="Select PickList"
                        tooltipOptions={{ position: 'top' }}
                    />


                    <OverlayPanel ref={op}>
                        <div className="popover-list">
                            {optionsList.length === 0 ? (
                                <span>No options available</span>
                            ) : (
                                optionsList.map((option) => {
                                    const isSelected = selectedOption.includes(option.value);

                                    return (
                                        <div key={option.value} className="popover-item">
                                            <span>{option.label}</span>
                                            {isSelected && (
                                                <i
                                                    className="pi pi-times cross-icon"
                                                    onClick={() => {
                                                        const updated = selectedOption.filter(id => id !== option.value);
                                                        handleMultiSelectChange({ value: updated });
                                                    }}
                                                />
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </OverlayPanel>

                </div>
            </span>

        </div>
    );

    const RefreshEntireList = () => {
        setSelectedOption([]);
        setSelectedDelivery([]);
        localStorage.removeItem("selectedOrders");
        localStorage.removeItem("next_cursor");
        receiptExportData();
        setSelectAll(false);
    }

    const handleMultiSelectChange = (e) => {
        const selectedPickListIds = e.value;
        const allSelectedOrders = JSON.parse(localStorage.getItem("selectedOrders")) || [];
        const filteredOrders = allSelectedOrders.filter(order =>
            selectedPickListIds.includes(order.receiptCode)
        );
        setSelectedOption(selectedPickListIds);
        setSelectedDelivery(filteredOrders);
        localStorage.setItem("selectedOrders", JSON.stringify(filteredOrders));
        if (filteredOrders.length === 0) {
            localStorage.removeItem('next_cursor');
        } else {
            localStorage.setItem('next_cursor', nextCursor);
        }

        // FIX: If count changed and is NOT equal to original selected
        // then disable the select-all icon
        if (filteredOrders.length !== allSelectedOrders.length) {
            setSelectAll(false);
        } else {
            setSelectAll(true);
        }

        // Refresh the list
        receiptExportData();
    };

    // This runs only once on full page load
    useEffect(() => {
        const isPageReload = performance.navigation.type === 1;

        if (isPageReload) {
            localStorage.removeItem("selectedOrders");
            setSelectAll(false);
            setSelectedOption([]);
        }
    }, []);

    useEffect(() => {
        if (!receiptExports || receiptExports.length === 0) {
            setSelectAll(false);
            setSelectedOption([]);
            return;
        }

        const selectedOrders = JSON.parse(localStorage.getItem("selectedOrders")) || [];
        const selectedIds = selectedOrders.map(order => order.receiptCode);

        const isAllSelected = receiptExports.every(order => selectedIds.includes(order.receiptCode));

        setSelectAll(isAllSelected);

        setSelectedOption(receiptExports
            .filter(order => selectedIds.includes(order.receiptCode))
            .map(order => order.receiptCode)
        );

        receiptExportData();
        //getUserData();
    }, [receiptExports]);


    const receiptExportData = () => {
        localStorage.removeItem("list-Id");

        const selectedOrders = JSON.parse(localStorage.getItem("selectedOrders")) || [];
        const options = selectedOrders.map(order => ({
            label: `${order.receiptCode} - ${order.receiptStatus}`,
            value: order.receiptCode

        }));
        setOptionsList(options);
        setSelectedOption(selectedOrders.map(order => order.receiptCode));
        setSelectedDelivery(selectedOrders);
    };

    const onSelectionChange = (event) => {
        const value = event.value;
        setSelectedDelivery(value);
        setSelectAll(value.length === totalRecords);
        localStorage.setItem("selectedOrders", JSON.stringify(value));
        if (value.length === 0) {
            localStorage.removeItem('next_cursor');
        } else {
            localStorage.setItem('next_cursor', nextCursor);
        }
        receiptExportData();

    };

    const userName = JSON.parse(localStorage.getItem("user"))?.user?.name;
    const userId = JSON.parse(localStorage.getItem("user"))?.user?.id;

    const createPOReceiptLots = () => {
        setExporttoSageX3DisplayConfirmation(false)
        setLoading(true);
        //console.log(selectedDelivery)

        const data = {
            ids: selectedDelivery.map(item => item.receiptCode.toString()),
            ReceiptData: selectedDelivery.map(u => ({ ReceiptId: u.id, TotalExpected: u.totalExpected, TotalReceived: u.totalReceived })),
            ReceiptCode: selectedDelivery[0].receiptCode,
            ReceiptId: selectedDelivery[0].id,
            userName: userName,
            userId: userId
        };
        ReceiptExportService.createPOReceiptLots(data).then((data) => {
            setLoading(false);
            if (data.error == 0) {
                setSelectAll(false);
                setSelectedDelivery([]);
                loadLazyData();
                toast.current.show({ severity: 'success', summary: 'Success Message', detail: data.message, life: 3000 });
            } else {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
        });
    }

    const getUserData = () => {
        setLoading(true);
        networkTimeout = setTimeout(() => {
            UserSettingService.getUsersGrid(lazyState).then((data) => {
                //setTotalRecords(data.totalRecords);
                setUsers(data.data);
                setLoading(false);
            });
        }, Math.random() * 100 + 250);
    };

    const markAsManualExportReceipt = () => {
        setMarkAsExportedDisplayConfirmation(false)
        setLoading(true);

        const data = {
            //ids: selectedDelivery.map(item => item.receiptCode.toString()),
            ReceiptCode: selectedDelivery[0].receiptCode,
            ReceiptId: selectedDelivery[0].id,
            userName: userName,
            userId: userId
        };
        ReceiptExportService.markAsManualExportReceipt(data).then((data) => {
            setLoading(false);
            if (data.error == 0) {
                setSelectAll(false);
                setSelectedDelivery([]);
                loadLazyData();
                toast.current.show({ severity: 'success', summary: 'Success Message', detail: data.message, life: 3000 });
            } else {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
        });
    }

    const exportToSageX3ConfirmationDialogFooter = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setExporttoSageX3DisplayConfirmation(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => createPOReceiptLots()} className="p-button-text" autoFocus />
        </>
    );

    const markAsExportedConfirmationDialogFooter = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setMarkAsExportedDisplayConfirmation(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => markAsManualExportReceipt()} className="p-button-text" autoFocus />
        </>
    );

    return (
        <>
            <Helmet>
                <title>Receipt Export</title>
            </Helmet>
            <Toast ref={toast} />
            <BreadCrumb model={items} home={home} />
            <Dialog header="Confirmation" visible={exporttoSageX3DisplayConfirmation} onHide={() => setExporttoSageX3DisplayConfirmation(false)} style={{ width: '350px' }} modal footer={exportToSageX3ConfirmationDialogFooter}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to proceed?</span>
                </div>
            </Dialog>
            <Dialog header="Confirmation" visible={markAsExportedDisplayConfirmation} onHide={() => setMarkAsExportedDisplayConfirmation(false)} style={{ width: '350px' }} modal footer={markAsExportedConfirmationDialogFooter}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to proceed?</span>
                </div>
            </Dialog>
            <h1></h1>
            <div className="card">
                <h3>Receipt Export</h3>
                <DataTable
                    value={receiptExports}
                    lazy
                    filterDisplay="row"
                    dataKey="id"
                    ref={tableRef}
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
                    rowsPerPageOptions={[25, 50, 100, 500, 1000]}
                    paginator
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                    loading={loading}
                    tableStyle={{ minWidth: '75rem' }}
                    emptyMessage="No record found."
                    selection={selectedDelivery}
                    onSelectionChange={onSelectionChange}
                    selectAll={selectAll}
                    onSelectAllChange={onSelectAllChange}
                    header={header}
                    scrollable
                    scrollHeight="600px"
                >
                    <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
                    <Column field="receiptCode" header="Receipt Code" headerStyle={{ width: '14rem' }} body={receiptCodeBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="receivedDate" header="Received Date" headerStyle={{ width: '14rem' }} body={receivedDateBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="receiptStatus" header="Receipt Status" headerStyle={{ width: '14rem' }} body={receiptStatusBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="confirmationDate" header="Confirmation Date" headerStyle={{ width: '14rem' }} body={confirmationDateBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="confirmedBy" header="Confirmed By" headerStyle={{ width: '14rem' }} body={confirmedByBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                </DataTable>
            </div>
        </>

    );
}
