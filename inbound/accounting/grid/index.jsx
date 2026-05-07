import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link } from 'react-router-dom';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Helmet } from 'react-helmet';
import { Toast } from 'primereact/toast';
import { TabView, TabPanel } from 'primereact/tabview';
import { useLazySort } from '../../../../components/useLazySort';
import { ReceiptsDashboardService } from '../../../../service/inbound/ReceiptDashboardService';
import { useAuth } from '../../../../store/useAuth';


export default function Accounting() {
    //  use separate loading for both tabs
    const [loadingInExecution, setLoadingInExecution] = useState(false);
    const [loadingAllReceipts, setLoadingAllReceipts] = useState(false);
    const { hasActionAccess, hasPageAccess } = useAuth();
    const PAGE_KEY = "inbound_accounting";
    const Detail_PAGE_KEY = "inbound_accounting_details";
    //  use separate total records for both tabs
    const [totalRecordsInExecution, setTotalRecordsInExecution] = useState(0);
    const [totalRecordsAllReceipts, setTotalRecordsAllReceipts] = useState(0);

    //  use separate table data for both tabs
    const [receiptExportsInExecution, setReceiptExportsInExecution] = useState([]);
    const [receiptExportsAllReceipts, setReceiptExportsAllReceipts] = useState([]);

    const [activeIndex, setActiveIndex] = useState(0);

    const toast = useRef(null);
    const tableRef = useRef(null);
    const networkTimeout = useRef(null); // useRef instead of normal variable

    // First tab state -> In Execution
    const [lazyStateInExecution, setLazyStateInExecution] = useState({
        first: 0,
        rows: 10,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {
            receiptCode: { value: null, matchMode: 'contains' },
            receiptStatus: { value: null, matchMode: 'contains' },
        }
    });

    // Second tab state -> All Receipts
    const [lazyStateAllReceipts, setLazyStateAllReceipts] = useState({
        first: 0,
        rows: 10,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {
            receiptCode: { value: null, matchMode: 'contains' },
            receiptStatus: { value: null, matchMode: 'contains' },
        }
    });

    const { onSort: onSortInExecution } = useLazySort(setLazyStateInExecution);
    const { onSort: onSortAllReceipts } = useLazySort(setLazyStateAllReceipts);

    const items = [{ label: 'Receipt' }, { label: 'Receipts Posting' }];
    const home = { icon: 'pi pi-home', url: '/' };

    useEffect(() => {
        // call only active tab API
        if (activeIndex === 0) {
            loadLazyDataInExecution();
        } else if (activeIndex === 1) {
            loadLazyDataAllReceipts();
        }
    }, [activeIndex, lazyStateInExecution, lazyStateAllReceipts]);

    // First tab API -> In Execution
    const loadLazyDataInExecution = () => {
        // CHANGE: only block first tab loading
        if (loadingInExecution) return;
        setLoadingInExecution(true);

        if (networkTimeout.current) {
            clearTimeout(networkTimeout.current);
        }

        networkTimeout.current = setTimeout(() => {
            ReceiptsDashboardService.getReadyToProcessReceipts(lazyStateInExecution)
                .then((data) => {
                    // CHANGE: set first tab state only
                    setTotalRecordsInExecution(data.totalRecords);
                    setReceiptExportsInExecution(data.data);
                })
                .catch((error) => {
                    console.error("In Execution API error:", error);
                })
                .finally(() => setLoadingInExecution(false));
        }, 300);
    };

    // Second tab API -> All Receipts
    const loadLazyDataAllReceipts = () => {
        // CHANGE: only block second tab loading
        if (loadingAllReceipts) return;
        setLoadingAllReceipts(true);

        if (networkTimeout.current) {
            clearTimeout(networkTimeout.current);
        }

        networkTimeout.current = setTimeout(() => {
            ReceiptsDashboardService.getAllAccountingReceipts(lazyStateAllReceipts)
                .then((data) => {
                    setTotalRecordsAllReceipts(data.totalRecords);
                    setReceiptExportsAllReceipts(data.data);
                })
                .catch((error) => {
                    console.error("All Receipts API error:", error);
                })
                .finally(() => setLoadingAllReceipts(false));
        }, 300);
    };

    // First tab paging
    const onPageInExecution = (event) => {
        setLazyStateInExecution(event);
        setTimeout(() => {
            if (tableRef.current) {
                const scrollableBody = tableRef.current.getTable().parentElement;
                scrollableBody.scrollTop = 0;
            }
        }, 0);
    };

    // First tab filtering
    const onFilterInExecution = (event) => {
        const filters = { ...event.filters };
        setLazyStateInExecution({
            ...event,
            first: 0,
            filters
        });
    };

    // Second tab paging
    const onPageAllReceipts = (event) => {
        setLazyStateAllReceipts(event);
        setTimeout(() => {
            if (tableRef.current) {
                const scrollableBody = tableRef.current.getTable().parentElement;
                scrollableBody.scrollTop = 0;
            }
        }, 0);
    };

    // Second tab filtering
    const onFilterAllReceipts = (event) => {
        const filters = { ...event.filters };
        setLazyStateAllReceipts({
            ...event,
            first: 0,
            filters
        });
    };

    // CHANGE: format date for showing below receipt code
    const formatReceiptDate = (dateValue) => {
        if (!dateValue) return '-';

        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return dateValue;

        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
    };

    // CHANGE: updated receipt code template to show
    // Date | PO Number | Line Count below the receipt code link
   const receiptCodeBodyTemplate = (rowData) => {
    const canViewDetail = hasPageAccess(Detail_PAGE_KEY);

    const receiptStyle = {
         fontSize: '18px',
                            fontWeight: 8000,
                            textDecoration: 'none'     //  make it bold
    };

    return (
        <div>
            <div>
                {canViewDetail ? (
                    <Link to={`/inbound/accounting/${rowData.id}`} style={receiptStyle}>
                        {rowData.receiptCode}
                    </Link>
                ) : (
                    <span style={receiptStyle}>{rowData.receiptCode}</span>
                )}
            </div>

            <div
                style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginTop: '4px',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px'
                }}
            >
                <span>{formatReceiptDate(rowData.rct_InputDate)}</span>
                <span>|</span>
                <span>PO {rowData.poNumber ?? '-'}</span>
                <span>|</span>
                <span>{rowData.rct_LineCount ?? 0} Lines</span>
            </div>
        </div>
    );
};

    const receiptStatusBodyTemplate = (rowData) => {
        return <>{rowData.receiptStatus}</>;
    };

    return (
        <>
            <Helmet>
                <title>Receipts Selection</title>
            </Helmet>

            <Toast ref={toast} />
            <BreadCrumb model={items} home={home} />

            <h1></h1>

            <div className="card">
                <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
                    {/* First tab */}
                    <TabPanel header="Ready to Process">
                        <h3>Receipts in Completion</h3>

                        <DataTable
                            // CHANGE: use first tab data only
                            value={receiptExportsInExecution}
                            lazy
                            filterDisplay="row"
                            dataKey="id"
                            ref={tableRef}
                            showGridlines
                            first={lazyStateInExecution.first}
                            rows={lazyStateInExecution.rows}
                            // CHANGE: use first tab total records only
                            totalRecords={totalRecordsInExecution}
                            onPage={onPageInExecution}
                            onSort={onSortInExecution}
                            size="small"
                            sortField={lazyStateInExecution.sortField}
                            className="datatable-responsive"
                            sortOrder={lazyStateInExecution.sortOrder}
                            onFilter={onFilterInExecution}
                            filters={lazyStateInExecution.filters}
                            rowsPerPageOptions={[10, 25, 50, 100, 500, 1000]}
                            paginator
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                            // CHANGE: use first tab loading only
                            loading={loadingInExecution}
                            tableStyle={{ minWidth: '75rem' }}
                            emptyMessage="No record found."
                            scrollable
                            scrollHeight="600px"
                        >
                            <Column
                                field="receiptCode"
                                header="Receipt Code"
                                headerStyle={{ width: '20rem' }} // CHANGE: increased width for sub-details
                                body={receiptCodeBodyTemplate}
                                filterMenuStyle={{ width: '14rem' }}
                                showFilterMenu={false}
                                sortable
                                filter
                                filterPlaceholder="Search"
                            />
                            <Column
                                field="receiptStatus"
                                header="Receipt Status"
                                headerStyle={{ width: '14rem' }}
                                body={receiptStatusBodyTemplate}
                                filterMenuStyle={{ width: '14rem' }}
                                showFilterMenu={false}
                                sortable
                                filter
                                filterPlaceholder="Search"
                            />
                        </DataTable>
                    </TabPanel>

                    {/* Second tab */}
                    <TabPanel header="All Receipts">
                        <h3>All Receipts</h3>

                        <DataTable
                            // CHANGE: use second tab data only
                            value={receiptExportsAllReceipts}
                            lazy
                            filterDisplay="row"
                            dataKey="id"
                            ref={tableRef}
                            showGridlines
                            first={lazyStateAllReceipts.first}
                            rows={lazyStateAllReceipts.rows}
                            // CHANGE: use second tab total records only
                            totalRecords={totalRecordsAllReceipts}
                            onPage={onPageAllReceipts}
                            onSort={onSortAllReceipts}
                            size="small"
                            sortField={lazyStateAllReceipts.sortField}
                            className="datatable-responsive"
                            sortOrder={lazyStateAllReceipts.sortOrder}
                            onFilter={onFilterAllReceipts}
                            filters={lazyStateAllReceipts.filters}
                            rowsPerPageOptions={[10, 25, 50, 100, 500, 1000]}
                            paginator
                            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                            // CHANGE: use second tab loading only
                            loading={loadingAllReceipts}
                            tableStyle={{ minWidth: '75rem' }}
                            emptyMessage="No record found."
                            scrollable
                            scrollHeight="600px"
                        >
                            <Column
                                field="receiptCode"
                                header="Receipt Code"
                                headerStyle={{ width: '20rem' }} // CHANGE: increased width for sub-details
                                body={receiptCodeBodyTemplate}
                                filterMenuStyle={{ width: '14rem' }}
                                showFilterMenu={false}
                                sortable
                                filter
                                filterPlaceholder="Search"
                            />
                            <Column
                                field="receiptStatus"
                                header="Receipt Status"
                                headerStyle={{ width: '14rem' }}
                                body={receiptStatusBodyTemplate}
                                filterMenuStyle={{ width: '14rem' }}
                                showFilterMenu={false}
                                sortable
                                filter
                                filterPlaceholder="Search"
                            />
                        </DataTable>
                    </TabPanel>
                </TabView>
            </div>
        </>
    );
}