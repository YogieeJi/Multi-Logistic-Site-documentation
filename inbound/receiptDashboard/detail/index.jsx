
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ShipmentsService } from '../../../../service/inbound/ShipmentService';
import { Link, useParams } from 'react-router-dom';
import '../../../../assets/styles.css';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { ReceiptsDashboardService } from '../../../../service/inbound/ReceiptDashboardService';
import { useAuth } from '../../../../store/useAuth';


export default function ShipmentDetails() {
    const {hasActionAccess} = useAuth();
    const PAGE_KEY = "inbound_receiptsDashboard";
    const [loading, setLoading] = useState(false);
    const [loading1, setLoading1] = useState(false);
    const [formLoader, setFormLoader] = useState(false);
    const [isConveyableitemAttribute, setIsConveyableitemAttribute] = useState(2);
    const [error, setError] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalRecordsLot, setTotalRecordsLot] = useState(0);
    const [date, setDate] = useState('-');
    const [shipmentDetail, setShipmentDetail] = useState({
        'created_at': '-',
        'fcy': '-'
    });
    const [btnDisabled, setbtnDisabled] = useState(false);
    const toast = useRef();
    const menuLeft = useRef(null);
    const [shipmentLines, setShipmentLines] = useState(null);
    const [Lot, setLot] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedShipments, setSelectedShipments] = useState(null);
    const [selectedFilter, setSelectedFilter] = useState(null);
    const [filterData, setFilterData] = useState([]);
    const [value, setValue] = useState('');
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
    let networkTimeout1 = null;
    const params = useParams();


    useEffect(() => {
        if (selectedFilter) {
            loadLazyData();
        }
    }, [selectedFilter, lazyState]);

    useEffect(() => {
        if (selectedFilter) {
            loadLazyData1();
        }
    }, [selectedFilter, lazyState1]);

    useEffect(() => {
        fetchFilterData();
    }, []);
    const fetchFilterData = (id) => {
        setFilterData({});
        setValue('');
        setSelectedFilter(null);
        ReceiptsDashboardService.getReceiptDropdown().then((data) => {
            // setReports(data.data);
            if (data.error == 0) {
                setFilterData(data.data)

            }
        });

    }

    const loadLazyData = () => {

        setLoading(true);

        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }

        //imitate delay of a backend call
        networkTimeout = setTimeout(() => {
            ReceiptsDashboardService.getReceiptDetailsOld(selectedFilter, (lazyState)).then((data) => {
                setTotalRecords(data.totalRecords);
                setShipmentLines(data.data);
                setDate(data.date);
                setLoading(false);
            });
        }, Math.random() * 100 + 250);
    }
    const loadLazyData1 = () => {

        setLoading1(true);

        if (networkTimeout1) {
            clearTimeout(networkTimeout1);
        }

        //imitate delay of a backend call
        networkTimeout1 = setTimeout(() => {
            ReceiptsDashboardService.getReceiptDetailsLotOld(selectedFilter, (lazyState1)).then((data) => {
                setLoading1(true)
                setTotalRecordsLot(data.totalRecords);
                setLot(data.data);
                setLoading1(false);
            });
        }, Math.random() * 100 + 250);

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
    const downloadTransferPDF = async () => {
        try {
            setLoading(true);
            setLoading1(true);
            if (totalRecords === 0 && totalRecordsLot === 0) {
                toast.current.show({
                    severity: 'warn',
                    summary: 'No Data Found',
                    detail: 'No records available to download.',
                    life: 3000
                });
                return; // stop execution
            }

            // Fetch PDF as blob + receipt code
            const { blob, receiptCode } = await ReceiptsDashboardService.getTransferPDF(selectedFilter);

            // Create a URL for the blob
            const url = window.URL.createObjectURL(blob);

            // Construct the filename dynamically
            const filename = `TransferReceipt_(${selectedFilter || selectedFilter || "unknown"}).pdf`;

            // Create an anchor element and trigger download
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // Revoke the object URL to free memory
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error downloading PDF:", error);
            let errorMessage = error.message;

            // Try to parse JSON part if it exists
            try {
                const jsonPart = errorMessage.substring(errorMessage.indexOf('{'));
                const parsed = JSON.parse(jsonPart);
                if (parsed.message) {
                    errorMessage = parsed.message;
                }
            } catch (e) {
                // If parsing fails, keep the original error message
            }

            toast.current.show({
                severity: 'error',
                summary: 'Failed to download PDF',
                detail: errorMessage,
                life: 3000
            });
            // showError("Error downloading PDF: " + error.message);
        } finally {
            setLoading(false); // Ensure loading is set to false after completion
            setLoading1(false); // Ensure loading is set to false after completion
        }
    };

    const downloadPDF = async () => {
        try {
            setLoading(true);
            setLoading1(true);

            // Fetch PDF as blob + receipt code
            const { blob, receiptCode } = await ReceiptsDashboardService.getPDFOld(selectedFilter);

            // Create a URL for the blob
            const url = window.URL.createObjectURL(blob);

            // Construct the filename dynamically
            const filename = `Receipt_Report(${selectedFilter || selectedFilter || "unknown"}).pdf`;

            // Create an anchor element and trigger download
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // Revoke the object URL to free memory
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error downloading PDF:", error);
            let errorMessage = error.message;

            // Try to parse JSON part if it exists
            try {
                const jsonPart = errorMessage.substring(errorMessage.indexOf('{'));
                const parsed = JSON.parse(jsonPart);
                if (parsed.message) {
                    errorMessage = parsed.message;
                }
            } catch (e) {
                // If parsing fails, keep the original error message
            }

            toast.current.show({
                severity: 'error',
                summary: 'Failed to download PDF',
                detail: errorMessage,
                life: 3000
            });
            // showError("Error downloading PDF: " + error.message);
        } finally {
            setLoading(false); // Ensure loading is set to false after completion
            setLoading1(false); // Ensure loading is set to false after completion
        }
    };

    const rowClassName = (rowData) => {

        if (rowData.qty === null || rowData.qty === 0) {
            return ''; // No class applied if QTY is null or 0
        } else if (rowData.expected_QTY !== rowData.qty) {
            return 'row-warning';
        }
    };
    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <div className="no-print md:flex-1">
                <Dropdown
                    filter
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.value)}
                    options={filterData}
                    optionLabel="name"
                    optionValue="id"
                    editable
                    placeholder="Select a Filter"
                    className="w-full md:w-14rem"
                />
            </div>
            <div className="no-print">
                {selectedFilter && (
                    <Button label="Download PDF" icon="pi pi-file-pdf" severity="danger" onClick={downloadPDF} />
                )}

            </div>
            <div className="no-print">
                {selectedFilter && (
                    <Button label="Inbound Transfer Report" icon="pi pi-file-pdf" severity="danger" onClick={downloadTransferPDF} />
                )}

            </div>
        </div>
    );


    return (
        <>
            <Toast ref={toast} />
            {/* <BreadCrumb model={items} home={home} /> */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Receipt Dashboard</h2>
            </div>
            <div className="card">
                {/* <h3>Shipment</h3> */}
                <h1></h1>
                <div className="p-fluid formgrid grid">
                    <div className="field col-12 md:col-4">
                        <h5 id="created_at">Container code</h5>
                        <p htmlFor="created_at">{selectedFilter}</p>

                    </div>
                    <div className="field col-12 md:col-4">
                        <h5 id="warehouse">Receipt Date</h5>
                        <p htmlFor="warehouse">
                            {date && date !== "-" ? `${date}.000` : "-"}
                        </p>
                    </div>

                    {/* <div className="field col-12 md:col-4">
                        <h5 id="status">Status</h5>
                        <Tag value={statusValue} severity={getSeverity(shipmentDetail.status)} />

                    </div> */}
                </div>
            </div>
            <div className="card">
                <div className="flex align-items-center">

                    {/* LEFT */}
                    <div>
                        <h3 className="m-0">Receipt Lines by PO</h3>
                    </div>

                    {/* CENTER (dropdown) */}
                    <div className="flex justify-content-center flex-grow-1">
                        <Dropdown
                            filter
                            value={selectedFilter}
                            onChange={(e) => setSelectedFilter(e.value)}
                            options={filterData}
                            optionLabel="name"
                            optionValue="id"
                            editable
                            placeholder="Select a Filter"
                            className="w-14rem"
                        />
                    </div>

                    {/* RIGHT (buttons) */}
                    <div className="flex align-items-center gap-2 no-print" style={{ minWidth: '330px' }}>

                        {hasActionAccess(PAGE_KEY, "download_pdf") && (<Button
                            label="Download PDF"
                            icon="pi pi-file-pdf"
                            severity="danger"
                            onClick={downloadPDF}
                            style={{ visibility: selectedFilter ? 'visible' : 'hidden' }}
                        />)}

                        {hasActionAccess(PAGE_KEY, "inbound_transfer_report") && (<Button
                            label="Inbound Transfer Report"
                            icon="pi pi-file-pdf"
                            className="bg-indigo-500 hover:bg-indigo-600 border-none text-white"
                            onClick={downloadTransferPDF}
                            style={{ visibility: selectedFilter ? 'visible' : 'hidden' }}
                        />)}

                    </div>

                </div>


                {/* <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
                    <span className="block mt-2 md:mt-0 p-input-icon-left">
                        <h3>Receipt Lines by PO</h3>
                    </span>
                    <span className="block md:mt-0 p-input-icon-left mr-6">
                        <Dropdown
                            filter
                            value={selectedFilter}
                            onChange={(e) => setSelectedFilter(e.value)}
                            options={filterData}
                            optionLabel="name"
                            optionValue="id"
                            editable
                            placeholder="Select a Filter"
                            className="w-full md:w-14rem"
                        />
                    </span>
                    <span className="block mt-2 md:mt-0 p-input-icon-left gap-4">
                        {selectedFilter && (
                            <Button label="Download PDF" icon="pi pi-file-pdf" severity="danger" onClick={downloadPDF} />
                        )}

                    </span>
                     <span className="block mt-2 md:mt-0 p-input-icon-left gap-4">
                                            {selectedFilter && (
                                                <Button label="Inbound Transfer Report" icon="pi pi-file-pdf" 
                                                className="bg-indigo-500 hover:bg-indigo-600 border-none text-white" onClick={downloadTransferPDF}
                                                />
                    
                                            )}
                    
                                        </span>
                </div> */}
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
                        {/* Old Columns */}
                        <Column field="prd_PrimaryCode" header="SKU (mantis)" body={(rowData) => rowData.prd_PrimaryCode} />
                        <Column field="input_sku" header="Input Sku (X3)" body={(rowData) => rowData.input_sku} />
                        <Column field="bpsnum" header="Vendor Code" body={(rowData) => rowData.bpsnum} />
                        <Column field="ponum" header="PO number" body={(rowData) => rowData.ponum} filterMenuStyle={{ width: '14rem' }} />
                        <Column field="expected_QTY" header="Expected QTY" body={(rowData) => rowData.expected_QTY} filterMenuStyle={{ width: '14rem' }} />
                        <Column field="qty" header="Received QTY" body={(rowData) => rowData.qty} filterMenuStyle={{ width: '14rem' }} />
                        <Column field="uom_mantis" header="UOM" body={(rowData) => rowData.uom_mantis} filterMenuStyle={{ width: '14rem' }} />

                        {/* New Columns */}
                        {/* <Column field="lineNumber" header="Line" body={(rowData) => rowData.lineNumber} />
                        <Column field="poref" header="PO" body={(rowData) => rowData.poref} />
                        {<Column field="mantis_sku"  header="SKU (mantis)" body={(rowData) => rowData.mantis_SKU}  />}
                         <Column field="x3_sku"  header="Input Sku (X3)" body={(rowData) => rowData.x3_SKU}  />
                        <Column field="bpsNum"  header="Vendor Code" body={(rowData) => rowData.bpsNum}  />
                        <Column field="expectedQtyDisplay" header="Expected QTY/UOM" body={(rowData) => rowData.expectedQtyDisplay} />
                        <Column field="actualQtyDisplay" header="Actual QTY/UOM" body={(rowData) => rowData.actualQtyDisplay} />
                        <Column field="x3_Qty" header="X3 Qty/UOM" body={(rowData) => rowData.x3_QtyDisplay} />
                        <Column field="actualLotAttrCode" header="Lots" body={(rowData) => rowData.actualLotAttrCode ? parseInt(rowData.actualLotAttrCode, 10) : ''} /> */}
                        {/* <Column header="Planned Lot"body={(rowData) => rowData.plannedLotNumber ?? '-'}/>
                        <Column field="locationCode"  header="Location" body={(rowData) => rowData.locationCode} /> */}

                    </DataTable>
                </div>
                <br />
                <h3>Receipt Lines by LOT</h3>
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
                        {/* Old Columns */}
                        <Column field="prd_PrimaryCode" header="SKU (mantis)" body={(rowData) => rowData.prd_PrimaryCode} />
                        <Column field="input_sku" header="Input Sku (X3)" body={(rowData) => rowData.input_sku} />
                        <Column field="lot" header="LOT" body={(rowData) => rowData.lot} />
                        <Column field="exp_date" header="EXP Date" body={(rowData) => rowData.pohnum} filterMenuStyle={{ width: '14rem' }} />
                        <Column field="qty" header="Received QTY" body={(rowData) => rowData.qty} filterMenuStyle={{ width: '14rem' }} />
                        <Column field="uom_mantis" header="UOM" body={(rowData) => rowData.uom_mantis} filterMenuStyle={{ width: '14rem' }} />

                        {/* New Columns */}
                        {/* <Column field="lineNumber" header="Line" body={(rowData) => rowData.lineNumber} />
                        {<Column field="mantis_sku"  header="SKU (mantis)" body={(rowData) => rowData.mantis_SKU}  />}
                        <Column field="x3_sku"  header="Input Sku (X3)" body={(rowData) => rowData.x3_SKU}  />
                        <Column field="actualLotNumbers" header="Lot Number" body={(rowData) => rowData.actualLotNumbers} />
                        <Column field="exp_date" header="EXP Date" body={(rowData) => rowData.expectedDate} filterMenuStyle={{ width: '14rem' }}  />
                        <Column field="actualQtyDisplay" header="Actual QTY/UOM" body={(rowData) => rowData.actualQtyDisplay} />
                        <Column field="x3_Qty" header="X3 Qty/UOM" body={(rowData) => rowData.x3_QtyDisplay} /> */}

                        {/* {<Column field="poref"  header="PO Ref" body={(rowData) => rowData.poref} />}
                        <Column field="expectedQtyDisplay"  header="Expected" body={(rowData) => rowData.expectedQtyDisplay} />
                      <Column field="actualQtyDisplay"  header="Actual" body={(rowData) => rowData.actualQtyDisplay} />
                         <Column header="Planned Lot"body={(rowData) => rowData.plannedLotNumber ?? '-'}/>
                      <Column field="actualLotAttrCode"header="Lots"body={(rowData) =>rowData.actualLotAttrCode? `${parseInt(rowData.actualLotAttrCode, 10)} lot`: '' }/>  */}

                    </DataTable>
                </div>
            </div>
        </>

    );
}
