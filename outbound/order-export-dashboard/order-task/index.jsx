import { Badge } from 'primereact/badge';
import { Dropdown } from 'primereact/dropdown';
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Dialog } from 'primereact/dialog';
import { Helmet } from 'react-helmet';
import { Toast } from 'primereact/toast';
import { useDispatch, useSelector } from 'react-redux';
import { Menu } from 'primereact/menu';
import { ProgressSpinner } from 'primereact/progressspinner';
import { OrdersImportService } from '../../../../service/outbound/OrdersImportService';

export default function Users() {
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [users, setUsers] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState(null);
    const [UserDetail, setUserDetail] = useState([]);
    const [UserDetailModel, setUserDetailModel] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(true);
    const [code, setCode] = useState([]);
    const [modelMsg, setModelMsg] = useState(null);

    const [displayConfirmation9, setDisplayConfirmation9] = useState(false);
    const [usersDropdownlist, setUsersDropdownlist] = useState(null);
    const [btnDisabled, setbtnDisabled] = useState(true);
    const [orderShort, setOrderShort] = useState([]);
    const [selectedOrderShort, setSelectedOrderShort] = useState(null);
    const toast = useRef();
    const navigate = useNavigate();
    const [displayConfirmationRerun, setDisplayConfirmationRerun] = useState(false);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 25,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {

            executed_user: { value: null, matchMode: 'contains' },
            task_status: { value: null, matchMode: 'contains' },
            assigned_user: { value: null, matchMode: 'contains' },

            LotNum: { value: null, matchMode: 'contains' },

            prd_PrimaryCode: { value: null, matchMode: 'contains' },


            task_status: { value: null, matchMode: 'contains' },

        }
    });

    const formMessageDetail = useSelector((state) => state.formMessage.detail)
    const formMessageSeverity = useSelector((state) => state.formMessage.severity)
    const formMessageSummary = useSelector((state) => state.formMessage.summary)

    const dispatch = useDispatch()
    const params = useParams();

    const [userTask, setUsersTask] = useState(params.pick_list_id);
    let networkTimeout = null;


    useEffect(() => {
        loadLazyData();
    }, [lazyState, userTask]);
    useEffect(() => {

        OrdersImportService.getPickListIds().then((data) => {
            if (data.error == 0) {
                setUsersDropdownlist(data.data);
            }
        });
    }, []);

    const loadLazyData = () => {
        setLoading(true);

        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }

        //imitate delay of a backend call
        networkTimeout = setTimeout(() => {
            const data = lazyState;
            data.code = params.pick_list_id;
            OrdersImportService.getOrderTaskDetails((data)).then((data) => {
                setTotalRecords(data.totalRecords);
                setUsers(data.data);

                setLoading(false);
            });
        }, Math.random() * 100 + 250);
        const data = { order: params.pick_list_id };
        OrdersImportService.getOrderShortDataExport(data).then(data => {
            if (!data || !data.data || data.data.length === 0) {
                setOrderShort([]);
            } else {
                setOrderShort(data?.data.grid_data);

            }
        }).finally(() => setLoading(false));

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

        setSelectedUsers(value);
        setSelectAll(value.length === totalRecords);
    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;

        if (selectAll) {
            // OrdersImportService.getOrdersTask().then((data) => {
            setSelectAll(true);
            setSelectedUsers(users);
            // });
        } else {
            setSelectAll(false);
            setSelectedUsers([]);
        }
    };

    const cancleModel = (reload = false) => {
        setUserDetail(null)
        setCode('')
        setUserDetailModel(false);

    }

    const deliveryCreation = () => {
        setDisplayConfirmation9(false)
        setLoading(true);
        const payload = {
            orders: [
                {
                    pick_list_id: params.pick_list_id
                }
            ]
        };
        // console.log(selectedDelivery);
        OrdersImportService.deliveryCreation(payload).then((data) => {
            setLoading(false);
            if (data.error == 0) {
                // loadLazyData();
                setSelectAll(false);
                toast.current.show({ severity: 'success', summary: 'Success Message', detail: data.message, life: 3000 });
            } else {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
        });
    }


    const nameBodyTemplate = (rowData) => {
        return (


            <>    {rowData.final_status === 'Pending' && (
                <Badge value="Pending" severity="warning" />
            )}
                {rowData.final_status === 'Partial Picking' && (
                    <Badge value="Partial Picking" severity="info" />
                )}
                {rowData.final_status == 'Complete' && (
                    <Badge value="Complete" severity="success" />
                )}
            </>
        );


    };
    const Refresh = () => {

        OrdersImportService.getPickListIds().then((data) => {
            if (data.error == 0) {
                setUsersDropdownlist(data.data);
            }
        });
        loadLazyData();
    }
    const actionItems = [
        {
            label: 'Export Order',
            icon: 'pi pi-plus',
            command: () => {

                setbtnDisabled(true)
                setDisplayConfirmation9(true)
            }
        },
        {
            label: 'Rerun Export Order',
            icon: 'pi pi-plus',
            command: () => {
                setDisplayConfirmationRerun(true)
            }
        },
    ]


    const menuLeft = useRef(null);
    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="block mt-2 md:mt-0 p-input-icon-left">

                <Menu model={actionItems} popup ref={menuLeft} id="popup_menu_left" />
                <Button label="Actions" icon="pi pi-align-left" className="mr-2" onClick={(event) => menuLeft.current.toggle(event)} aria-controls="popup_menu_left" aria-haspopup />
            </span>
            <span className="block mt-2 md:mt-0 p-input-icon-left">

                <Dropdown
                    style={{ marginRight: 5, marginLeft: 10 }}
                    value={userTask}
                    options={usersDropdownlist}
                    optionLabel="pick_list_id"
                    optionValue="pick_list_id"
                    onChange={(e) => {
                        const selected = usersDropdownlist.find(u => u.pick_list_id === e.value);

                        if (selected) {
                            const date = new Date(selected.inputDate);
                            const formattedDate = ("0" + date.getDate()).slice(-2) + "-" +
                                ("0" + (date.getMonth() + 1)).slice(-2) + "-" +
                                date.getFullYear();
                            navigate(`/outbound/orders-export/${selected.pick_list_id}/${selected.customer_code}/${formattedDate}/${selected.is_exported}`);
                        }

                        setUsersTask(e.value);
                    }}
                    placeholder="Select Order"
                    filter
                    virtualScrollerOptions={{ itemSize: 38 }}
                />
            </span>


        </div>
    );

    const rerunFailedJobs = () => {
        setLoading(true);
        const payload = {
            orders: [
                {
                    pick_list_id: params.pick_list_id,
                    is_exported: params.is_exported
                }
            ],
            failJobs: 'fail-jobs'
        };

        OrdersImportService.deliveryCreation(payload).then((data) => {
            setLoading(false);
            if (data.error === 0) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message });
                setSelectAll(false);
                loadLazyData();
            } else {
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message });
            }
            setDisplayConfirmationRerun(false);
        });
    };

    const getOrderDetail = (PrimaryCode) => {
        setUserDetail(null)
        setUserDetailModel(true)
        setCode(PrimaryCode)
        setLoadingDetail(true);
        const data = {
            primary_code: PrimaryCode,
        }
        OrdersImportService.getOrderDetail((data)).then((res) => {
            if (res?.error === 1) {
                setUserDetailModel(false);
                setLoadingDetail(false);
                toast.current.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: res.message || 'Something went wrong.',
                });

            }
            else {
                setUserDetail(res.data);
                setLoadingDetail(false);
            }
        })
            .catch((err) => {
                console.error(err);
                toast.current.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to fetch order details.',
                });

                // Close popup and stop loading
                setUserDetailModel(false);
                setLoadingDetail(false);
            });
    };

    const confirmationDialogFooter3 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation9(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => deliveryCreation()} className="p-button-text" autoFocus />
        </>
    );

    const confirmationDialogFooterRerun = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmationRerun(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => rerunFailedJobs()} className="p-button-text" autoFocus />
        </>
    );
    const rowClassName = (rowData) => {
        return rowData.qty_Free === 'no Stock' ? 'row-success' : 'row-red';
    };

    return (
        <>
            <Dialog header={`Item Code: ${code}`} receivingModel visible={UserDetailModel} style={{ width: '50vw' }}
                position='top' onHide={() => { if (!UserDetailModel) return; cancleModel(); }}
            >

                <p className="m-0">
                    <div className="flex flex-column px-8 py-5 gap-4" style={{ borderRadius: '12px', backgroundColor: '#f9f9f9' }}>
                        {(modelMsg != '') ? (<p className="p-error font-semibold">{modelMsg}</p>) : ''}
                    </div>
                </p>
                {(!UserDetail) ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <ProgressSpinner />
                    </div>
                ) : (
                    <div className="card p-0 " >
                        <DataTable removableSort
                            value={UserDetail}
                            className="datatable-responsive"
                            emptyMessage="No records found."
                            showGridlines
                            sort
                            tableStyle={{ minWidth: '40rem' }}
                            size="small"
                            stripedRows
                            loading={loadingDetail} scrollable scrollHeight="350px"
                        >
                            <Column header="Location Code" field="loc_Code" body={(data) => data.loc_Code} />
                            <Column header="Available Quantity" field="SPTQuantityFree" body={(data) => data.sptQuantityFree} />
                            <Column header="Quantity" field="SPTQuantity" body={(data) => data.sptQuantity} />
                            <Column header="Lot Number" field="LotNum" body={(data) => data.lotNum} />
                            <Column header="Reserve Reason" field="ReserveReasonDescr" body={(data) => data.reserveReasonDescr || ''} />
                            <Column header="Expiration Date" field="exp_date" body={(data) => data.exp_date || ''} />

                        </DataTable>
                    </div>
                )}

            </Dialog>


            <div className="flex justify-content-between align-items-center mb-3">
                <Button
                    label="Back"
                    icon="pi pi-arrow-left"
                    className="p-button-primary"
                    onClick={() => navigate("/outbound/orders-export")}
                    style={{ margin: '10px 0' }}
                />
                <Dialog header="Confirmation" visible={displayConfirmation9} onHide={() => setDisplayConfirmation9(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter3}>
                    <div className="flex align-items-center justify-content-center">
                        <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                        <span>Are you sure you want to proceed?</span>
                    </div>
                </Dialog>

                <Dialog header="Confirmation" visible={displayConfirmationRerun} onHide={() => setDisplayConfirmationRerun(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooterRerun}>
                    <div className="flex align-items-center justify-content-center">
                        <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                        <span>Are you sure you want to rerun the failed jobs?</span>
                    </div>
                </Dialog>
                <Button
                    label="Refresh"
                    loading={loading}
                    onClick={Refresh}
                    severity="success"
                    icon="pi pi-refresh"
                    className="align-item-right"
                    size="small"
                />
            </div>
            <Helmet>
                <title>Order Task</title>
            </Helmet>
            <div className="card">
                {/* <h3>Shipment</h3> */}
                <h1></h1>
                <div className="p-fluid formgrid grid">
                    <div className="field col-12 md:col-4">
                        <h5 id="created_at">Order:</h5>
                        <p htmlFor="created_at">{params.pick_list_id}</p>

                    </div>
                    <div className="field col-12 md:col-4">
                        <h5 id="created_at">Customer Code:</h5>
                        <p htmlFor="created_at">{params.cus}</p>

                    </div>
                    <div className="field col-12 md:col-4">
                        <h5 id="created_at">Date:</h5>
                        <p htmlFor="created_at">{params.date}</p>

                    </div>

                </div>
            </div>
            <Toast ref={toast} />


            <h1></h1>
            <div className="card">
                <h3>Order Task</h3>
                <DataTable
                    value={users}
                    lazy
                    filterDisplay="row"
                    dataKey="tsk_FromLocationCode"
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
                    rowsPerPageOptions={[25, 50, 100, 500, 1000]}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                    loading={loading}
                    tableStyle={{ minWidth: '75rem' }}
                    emptyMessage="No records found."
                    selection={selectedUsers}
                    onSelectionChange={onSelectionChange}
                    selectAll={selectAll}
                    onSelectAllChange={onSelectAllChange}
                    header={header}
                    scrollable
                    scrollHeight="600px"
                    removableSort

                >
                    {/* <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} /> */}
                    <Column field="prd_PrimaryCode" header="Item" body={(rowData) => rowData.prd_PrimaryCode} sortable filter showFilterMenu={false} filterPlaceholder="Search" />
                    <Column field="LotNum" header="Lot Num" body={(rowData) => rowData.lotNum} sortable filter showFilterMenu={false} filterPlaceholder="Search" />
                    <Column field="assigned_user" header="Assigned User" body={(rowData) => rowData.assigned_user} sortable filter showFilterMenu={false} filterPlaceholder="Search" />
                    <Column field="ComboDescription" header="Product Pack Type" body={(rowData) => rowData.comboDescription} />
                    <Column field="total_quantity" header="QTY on Task" body={(rowData) => rowData.total_quantity} />
                    <Column field="picked_quantity" header="QTY Picked" body={(rowData) => rowData.picked_quantity} />
                    <Column field="remaining_quantity" header="QTY Remaining" body={(rowData) => rowData.remaining_quantity} />
                    <Column field="final_status" header="Task Status" body={nameBodyTemplate} />
                </DataTable>
            </div>

            <div className="card " style={{ height: '100%', minHeight: '250px' }}>
                <h3>Order Shortage</h3>
                <DataTable removableSort value={orderShort}
                    className="datatable-responsive"
                    selection={selectedOrderShort}
                    onSelectionChange={onSelectionChange}
                    emptyMessage="No records found."
                    showGridlines
                    sort="true"
                    tableStyle={{ minWidth: '100%', width: 'auto' }}
                    size="small"
                    stripedRows
                    loading={loading} scrollable
                    scrollHeight="600px"
                    rowClassName={rowClassName}
                >
                    <Column selectionMode="single" headerStyle={{ width: '3rem' }} />
                    <Column header="ID" field="pick_list_id" body={(data) => data.pick_list_id} />
                    <Column header="Code" field="prd_PrimaryCode" body={(data) => data.prd_PrimaryCode} />
                    <Column header="QTY" field="qty" body={(data) => data.qty ?? 0} />
                    <Column header="Outer QTY" field="outer_QTY" headerStyle={{ width: '8%', minWidth: '6rem' }} body={(data) => data.outer_QTY ?? 0} />
                    <Column header="Inner QTY" field='inner_QTY' headerStyle={{ width: '8%', minWidth: '6rem' }} body={(data) => data.inner_QTY ?? 0} />
                    <Column header="Date" field='create_datetime' headerStyle={{ width: '20%', minWidth: '6rem' }} body={(data) => data.create_datetime} />
                    <Column header="Status" field='ors_MessageCode' body={(data) => data.pst_MessageCode ?? '--'} />
                    <Column header="Issue" field='Item_issues' body={(data) => data.item_issues ?? '--'} />
                    <Column header="QTY Free" field='Qty_Free' body={(data) => data.qty_Free ?? '--'} />
                    <Column
                        header="View Detail"
                        field="outer_QTY"
                        headerStyle={{ width: '8%', minWidth: '6rem' }}
                        body={(data) =>
                            data.Qty_Free !== 'no Stock' ? (
                                <Button
                                    label="View"
                                    severity="secondary"
                                    size="small"
                                    outlined
                                    onClick={() => getOrderDetail(data.prd_PrimaryCode)}
                                />
                            ) : null
                        }
                    />
                </DataTable>
            </div>
        </>

    );
}
