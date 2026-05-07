
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Helmet } from 'react-helmet';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { OrdersImportService } from '../../../../service/outbound/OrdersImportService';
import { Tag } from 'primereact/tag';
import { Badge } from 'primereact/badge';
import { Menu } from 'primereact/menu';
import { Dropdown } from 'primereact/dropdown';
import { useAuth } from '../../../../store/useAuth';


import '../../../../assets/styles.css';

export default function OrderImport() {
    const { hasActionAccess } = useAuth();
    const PAGE_KEY = "outbound_orderexport_new";
    const { hasPageAccess } = useAuth()
    const Detail_PAGE_KEY = "order_Export_details";

    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [orders, setOrders] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState(null);

    const [displayConfirmation3, setDisplayConfirmation3] = useState(false);
    const [displayConfirmation4, setDisplayConfirmation4] = useState(false);

    const [displayConfirmationRerun, setDisplayConfirmationRerun] = useState(false);
    const [btnDisabled, setbtnDisabled] = useState(true);
    const [exportType, setExportType] = useState(null);


    const getLvStatusSeverity = (flag) => {
        switch (flag) {
            case 'Completed':
                return 'success';

            case 'Pending':
                return 'warning';

            case 'Executing':
                return 'secondary';

            case 'Not Exported':
            case 'Partial Failed':
            case 'Canceled':
                return 'danger';

            default:
                return 'success';
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

            pick_list_id: { value: null, matchMode: 'contains' },
            customer_code: { value: null, matchMode: 'contains' },
            lv_status: { value: null, matchMode: 'contains' },
            mantis_imported: { value: null, matchMode: 'contains' },
            invalid_items: { value: null, matchMode: 'contains' },
            is_exported: { value: null, matchMode: 'contains' },
            is_location_assigned: { value: null, matchMode: 'contains' },
            created_at: { value: null, matchMode: 'contains' },
            order_type: { value: null, matchMode: 'contains' },
            ReExecute: { value: null, matchMode: 'contains' },
            total: { value: null, matchMode: 'equal' },
            assigned: { value: null, matchMode: 'equal' },
            export_status: { value: null, matchMode: 'equal' },
        }
    });



    const actionItems = [
        hasActionAccess(PAGE_KEY, "export_order_new") && {
            // label: 'Create Delivery',
            label: 'Export Order New',
            icon: 'pi pi-plus',
            command: () => {
                if (selectedDelivery != null && selectedDelivery.length > 0) {
                    const allCompleted = selectedDelivery.every(delivery => delivery.status === "Completed");

                    if (allCompleted) {
                        setExportType('new');
                        onclick(setDisplayConfirmation3(true));
                    } else {
                        toast.current.show({
                            severity: 'error',
                            summary: 'Error',
                            detail: 'Selected orders must be completed before export'
                        });
                    }

                } else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 order' });
                }
            }
        },
        // {
        //     // label: 'Create Delivery',
        //     label: 'Export Order',
        //     icon: 'pi pi-plus',
        //     command: () => {
        //         if(selectedDelivery != null && selectedDelivery.length > 0){
        //         const allCompleted = selectedDelivery.every(delivery => delivery.status === "Completed");

        //         if (allCompleted) {
        //             setExportType('old');
        //             onclick(setDisplayConfirmation3(true));
        //         } else {
        //             toast.current.show({
        //                 severity: 'error',
        //                 summary: 'Error',
        //                 detail: 'Selected orders must be completed before export'
        //             });
        //         }

        //         } else{
        //             toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 order' });
        //         }
        //     }
        // },


        // {
        //     label: 'Rerun Export Order',
        //     icon: 'pi pi-plus',
        //     command: () => {
        //         console.log(selectedDelivery)
        //         if (selectedDelivery != null && selectedDelivery.length > 0) {
        //             onclick(setDisplayConfirmationRerun(true));
        //         } else {
        //             toast.current.show({ severity: 'error', summary: 'Error', detail: 'At least select 1 order' });
        //         }
        //     }
        // },

        hasActionAccess(PAGE_KEY, "mark_manual_complete") && {
            label: 'Mark as Manual Complete',
            icon: 'pi pi-plus',
            command: () => {
                if (selectedDelivery != null && selectedDelivery.length > 0) {
                    onclick(setDisplayConfirmation4(true));
                } else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 order' });
                }
            }
        },

    ].filter(Boolean);

    const items = [{ label: 'Outbound' }, { label: 'Orders' }];
    const home = { icon: 'pi pi-home', url: '/' }

    let networkTimeout = null;


    useEffect(() => {

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
            OrdersImportService.getOrderExport((lazyState)).then((data) => {
                setTotalRecords(data.totalRecords);

                setOrders(data.data);
                setLoading(false)
            });
        }, Math.random() * 100 + 250);


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
        // console.log(value)
        setSelectedDelivery(value);
        setSelectAll(value.length === totalRecords);




    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;

        if (selectAll) {
            // OrdersImportService.getOrdersGrid().then((data) => {
            setSelectAll(true);
            setSelectedDelivery(orders);
            // });
        } else {
            setSelectAll(false);
            setSelectedDelivery([]);
        }

    };

    const markOrderManualComplete = () => {
        setLoading(true);
        setbtnDisabled(true);
        const data = {
            orders: selectedDelivery,
        }

        setDisplayConfirmation4(false)
        OrdersImportService.manualOrderComplete((data)).then((data) => {

            if (data.error == 0) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message });
                setSelectAll(false);
                setSelectedDelivery([]);
                loadLazyData();
            }
            else {
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message });
            }
            setLoading(false);
            setbtnDisabled(false);

        });
    };


    const picklist_idBodyTemplate = (rowData) => {
        return (
            <>
                <Link to={`${rowData.pick_list_id}/${rowData.customer_code}/${rowData.created_at}/${rowData.is_exported}`}>{rowData.pick_list_id}</Link>

            </>
        );
    };

    // const orderNumber_BodyTemplate = (rowData) => {
    //     const orderNumber = rowData["Order Number"];
    //     const customerCode = rowData["Customer Code"];
    //     const dateCreated = rowData["Date Created"];
    //     const isExported = rowData["Export Status"];
    //     const picklist_id = rowData["id"];
    //     // console.log(rowData.pick_list_id,customerCode,dateCreated,isExported);

    //     return (
    //         <Link to={`${rowData.pick_list_id}/${customerCode}/${dateCreated}/${isExported}/${picklist_id}`}>
    //             {rowData.pick_list_id}
    //         </Link>
    //     );
    // };

    const orderNumber_BodyTemplate = (rowData) => {
        const customerCode = rowData["Customer Code"];
        const dateCreated = rowData["Date Created"];
        const isExported = rowData["Export Status"];
        const picklist_id = rowData["id"];

        const url = `${rowData.pick_list_id}/${customerCode}/${dateCreated}/${isExported}/${picklist_id}`;

        return hasPageAccess(Detail_PAGE_KEY) ? (
            <Link to={url}>
                {rowData.pick_list_id}
            </Link>
        ) : (
            rowData.pick_list_id   //  simple text, not clickable
        );
    };



    const lv_statusBodyTemplate = (rowData) => {
        return (
            <>
                <Tag value={rowData.status} severity={getLvStatusSeverity(rowData.status)} />
            </>
        );
    };

    const export_statusBodyTemplate = (rowData) => {
        return (
            <>
                <Tag value={rowData["Export Status"]} severity={getLvStatusSeverity(rowData["Export Status"])} />
            </>
        );
    };


    const TotalTaskBodyTemplate = (rowData) => {
        return (
            <>
                {rowData["Total Tasks"]}
            </>
        );
    };

    const TaskCheckBodyTemplate = (rowData) => {
        return (
            <>
                {rowData["Task Check"]}
            </>
        );
    };

    const TaskCompletionBodyTemplate = (rowData) => {
        return (
            <>{rowData.picked_task}
            </>
        );
    };

    const lvStatusFlags = [
        { code: 'Completed', name: 'Completed' },
        { code: 'Pending', name: 'Pending' },
        { code: 'Canceled', name: 'Canceled' },
        { code: 'Executing', name: 'Executing' },
    ];

    const ExportStatusFlags = [
        { code: 'Not Exported', name: 'Not Exported' },
        { code: 'Partial Failed', name: 'Partial Failed' },
        { code: 'Completed', name: 'Completed' },
    ];

    const lvStatusflagTemplate = (option) => {
        return <Badge value={option.name} severity={getLvStatusSeverity(option.name)} />;
    };

    const lvStatusRowFilterTemplate = (options) => {
        return (
            <Dropdown style={{ minWidth: '3em', width: '5em' }} value={options.name} optionValue="code" optionLabel="name" options={lvStatusFlags} onChange={(e) => options.filterApplyCallback(e.value)} itemTemplate={lvStatusflagTemplate} placeholder="Select One" className="p-column-filter" showClear />
        );
    };

    const ExportStatusflagTemplate = (option) => {
        return <Badge value={option.name} severity={getLvStatusSeverity(option.name)} />;
    };

    const ExportStatusRowFilterTemplate = (options) => {
        return (
            <Dropdown style={{ minWidth: '3em', width: '5em' }} value={options.value} optionValue="code" optionLabel="name" options={ExportStatusFlags} onChange={(e) => options.filterApplyCallback(e.value)} itemTemplate={ExportStatusflagTemplate} placeholder="Select One" className="p-column-filter" showClear />
        );
    };
    const userName = JSON.parse(localStorage.getItem("user"))?.user?.name;

    const deliveryCreation = () => {
        setDisplayConfirmation3(false)
        setLoading(true);
        const payload = {
            orders: selectedDelivery,
            userName: userName
        };
        // console.log(selectedDelivery);
        OrdersImportService.deliveryCreation(payload).then((data) => {
            setLoading(false);
            if (data.error == 0) {
                // loadLazyData();
                setSelectAll(false);
                setSelectedDelivery([]);
                toast.current.show({ severity: 'success', summary: 'Success Message', detail: data.message, life: 3000 });
            } else {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
        });
    }


    const deliveryCreationNew = () => {
        setDisplayConfirmation3(false)
        setLoading(true);
        const payload = {
            orders: selectedDelivery,
            userName: userName
        };
        // console.log(selectedDelivery);
        OrdersImportService.deliveryCreationNewChanges(payload).then((data) => {
            setLoading(false);
            if (data.error == 0) {
                // loadLazyData();
                setSelectAll(false);
                setSelectedDelivery([]);
                toast.current.show({ severity: 'success', summary: 'Success Message', detail: data.message, life: 3000 });
            } else {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
        });
    }




    const Refresh = () => {
        loadLazyData();
    }

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                {/* <SplitButton label="Create Delivery" icon="pi pi-plus" onClick={() => setDisplayConfirmation3(true)} model={actionItems} /> */}
                <Menu model={actionItems} popup ref={menuLeft} id="popup_menu_left" />
                {actionItems.length > 0 && (<Button label="Actions" icon="pi pi-align-left" className="mr-2" onClick={(event) => menuLeft.current.toggle(event)} aria-controls="popup_menu_left" aria-haspopup />)}

                {/* <Button label="Create Delivery" icon="pi pi-plus" severity="sucess" className='mr-3' onClick={() => setDisplayConfirmation3(true)} /> */}
                {/* <Button label="Execute Orders" icon="pi pi-sync" severity="sucess" onClick={() => setDisplayConfirmation2(true)} /> */}
            </span>
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
    );
    const handleDeliveryConfirmation = () => {
        setDisplayConfirmation3(false);

        if (exportType === 'new') {
            deliveryCreationNew();
        } else if (exportType === 'old') {
            deliveryCreation();
        }

        setExportType(null);
    };


    const confirmationDialogFooter3 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation3(false)} className="p-button-text" />
            {/* <Button type="button" label="Yes" icon="pi pi-check" onClick={() => deliveryCreation()} className="p-button-text" autoFocus />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => deliveryCreationNew()} className="p-button-text" autoFocus /> */}
            <Button type="button" label="Yes" icon="pi pi-check" onClick={handleDeliveryConfirmation} className="p-button-text" autoFocus />
        </>
    );
    const confirmationDialogFooter4 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation4(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => markOrderManualComplete()} className="p-button-text" autoFocus />
        </>
    );

    const confirmationDialogFooterRerun = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmationRerun(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => rerunFailedJobs()} className="p-button-text" autoFocus />
        </>
    );




    const rerunFailedJobs = () => {
        setLoading(true);
        const payload = {
            orders: selectedDelivery,
            failJobs: 'fail-jobs',
            userName: userName

        };

        // OrdersImportService.deliveryCreation(payload).then((data) => {
        //     setLoading(false);
        //     if (data.error === 0) {
        //         toast.current.show({ severity: 'success', summary: 'Success', detail: data.message });
        //         setSelectAll(false);
        //         setSelectedDelivery([]);
        //         loadLazyData();
        //     } else {
        //         toast.current.show({ severity: 'error', summary: 'Error', detail: data.message });
        //     }
        //     setDisplayConfirmationRerun(false);
        // });

        OrdersImportService.deliveryCreationNewChanges(payload).then((data) => {
            setLoading(false);
            if (data.error === 0) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message });
                setSelectAll(false);
                setSelectedDelivery([]);
                loadLazyData();
            } else {
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message });
            }
            setDisplayConfirmationRerun(false);
        });
    };

    return (
        <>

            <Helmet>
                <title>Orders</title>
            </Helmet>
            <Toast ref={toast} />

            <Dialog header="Confirmation" visible={displayConfirmationRerun} onHide={() => setDisplayConfirmationRerun(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooterRerun}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to rerun the failed jobs?</span>
                </div>
            </Dialog>
            <Dialog header="Confirmation" visible={displayConfirmation3} onHide={() => setDisplayConfirmation3(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter3}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to proceed?</span>
                </div>
            </Dialog>
            <Dialog header="Confirmation" visible={displayConfirmation4} onHide={() => setDisplayConfirmation4(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter4}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to proceed?</span>
                </div>
            </Dialog>

            <div className="card">
                <h3>Order Export Dashboard</h3>
                <DataTable
                    value={orders}
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
                    rowsPerPageOptions={[25, 50, 100, 500, 1000, 5000]}
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
                    removableSort

                >
                    <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />

                    <Column field="pick_list_id" header="Order Number" headerStyle={{ width: '14rem' }} body={orderNumber_BodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="order_details_count" header="N. Of Lines" headerStyle={{ width: '4rem' }} body={(rowData) => rowData.order_details_count} />
                    <Column field="customer_code" sortable headerStyle={{ width: '8rem' }} header="Customer Code" body={(rowData) => rowData["Customer Code"]} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="created_at" header="Created At" headerStyle={{ width: '8rem' }} body={(rowData) => rowData["Date Created"]} />
                    <Column field="lv_status" header="Status" body={lv_statusBodyTemplate} showFilterMenu={false} filter filterElement={lvStatusRowFilterTemplate} />
                    <Column field="assigned_to" header="Assigned To" body={(rowData) => rowData["Assigned To"]} />
                    <Column field="task_check" header="Task Check" body={TaskCheckBodyTemplate} />
                    <Column field="total" header="Total Task" body={TotalTaskBodyTemplate} />
                    <Column field="picked_percentage" header="Picked Percentage" body={(rowData) => rowData["Picked Percentage"]} />
                    <Column field="export_status" header="Export Status" body={export_statusBodyTemplate} showFilterMenu={false} filter filterElement={ExportStatusRowFilterTemplate} />

                </DataTable>
            </div>
        </>

    );
}
