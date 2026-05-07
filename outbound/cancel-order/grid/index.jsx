import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link } from 'react-router-dom';
import { Button } from 'primereact/button';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Helmet } from 'react-helmet';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { OrdersImportService } from '../../../../service/outbound/OrdersImportService';
import { Tag } from 'primereact/tag';
import { Badge } from 'primereact/badge';
import { Menu } from 'primereact/menu';
import { UserSettingService } from '../../../../service/settings/UserSettingService';
import { Dropdown } from 'primereact/dropdown';
import { OverlayPanel } from 'primereact/overlaypanel';
import { useLazySort } from '../../../../components/useLazySort';
import { DashboardService } from '../../../../service/DashboardService';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tooltip } from 'primereact/tooltip';
import { useAuth } from '../../../../store/useAuth';


export default function CancelOrder() {
    const {hasActionAccess} = useAuth();
    const {hasPageAccess}= useAuth();
        const PAGE_KEY = "outbound_manualCancelOrder";
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [orders, setOrders] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState(() => {
        const savedSelection = localStorage.getItem("selectedOrders");
        return savedSelection ? JSON.parse(savedSelection) : [];
    });
    const [nextCursor, setNextCursor] = useState(null);
    const [cancelOrderDisplayConfirmation, setCancelOrderDisplayConfirmation] = useState(false);
    const [selectedOption, setSelectedOption] = useState([]);
    const [optionsList, setOptionsList] = useState([]);
    const op = useRef(null);
    const [UserDetail, setUserDetail] = useState([]);
    const [UserDetailModel, setUserDetailModel] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(true);
    const [code, setCode] = useState([]);
    const tableRef = useRef(null);

    const globalFlags = [
        { code: '1', name: 'Yes' },
        { code: '0', name: 'No' },
    ];

    const LocationFlags = [
        { code: '1', name: 'Assigned' },
        { code: '2', name: 'Partially Assigned' },
        { code: '0', name: 'Not Assigned' },
        { code: '3', name: 'Released' },
    ];

    const matisImportedFlags = [
        { code: '1', name: 'Yes' },
        { code: '0', name: 'No' },
        { code: '2', name: 'Partially' },
    ];

    const exportedFlags = [
        { code: '0', name: 'Pending' },
        { code: '1', name: 'Partial' },
        { code: '2', name: 'Completed' },
        { code: '3', name: 'Failed' },
        { code: '4', name: 'Skipped' },
        { code: '5', name: 'Unexportable' },
        { code: '6', name: 'Manual Complete' },
    ];

    const lvStatusFlags = [
        { code: 'Pending', name: 'Pending' },
        { code: 'Task Completed', name: 'Task Completed' },
        { code: 'Completed', name: 'Completed' },
        { code: 'In-Progress', name: 'In-Progress' },
        { code: 'Closed', name: 'Closed' },
        { code: 'Cancelled', name: 'Cancelled' },
    ];

    const getInvalidSeverity = (flag) => {
        switch (flag) {
            case 'Yes':
                return 'danger';

            case 'No':
                return 'success';
        }
    };

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

            case 'Skipped':
                return 'warning';

            case 'Unexportable':
                return 'warning';

            case 'Manual Complete':
                return 'success';
            case 'Assigned':
                return 'success';
            case 'Not Assigned':
                return 'danger';
            case 'Released':
                return 'primary';
            case 'Partially Assigned':
                return 'info';
        }
    };

    const [usersDropdownlist, setUsersDropdownlist] = useState(null);
    const [orderAssignTypeDropdownlist, setOrderAssignTypeDropdownlist] = useState(null);
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
        }
    });

    const { onSort } = useLazySort(setlazyState);
    // hide Cancel Order button 
    const showCancelOrders = import.meta.env.VITE_SHOW_CANCEL_ORDERS === "true";

    const actionItems = [
        hasActionAccess(PAGE_KEY,"cancel_order")&&{
            label: 'Cancel Order',
            icon: 'fa fa-times',
            command: () => {
                if (selectedDelivery != null && selectedDelivery.length > 0) {
                    onclick(setCancelOrderDisplayConfirmation(true))
                }
                else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Kindly select atleast 1 order' });
                }
            }
        },
    ].filter(Boolean);
    // const actionItems = [
    //     {
    //         label: 'Cancel Order',
    //         icon: 'fa fa-times',
    //         template: (item, options) => {
    //             return (
    //                 <span
    //                     className={
    //                         !showCancelOrders
    //                             ? "disabled-cancelorder-wrapper inline-block"
    //                             : "inline-block"
    //                     }
    //                 >
    //                     <Tooltip
    //                         target=".disabled-cancelorder-wrapper"
    //                         content="It is not part of Phase-1 Plan"
    //                         position="right"
    //                     />

    //                     <a
    //                         className="p-menuitem-link"
    //                         style={{
    //                             cursor: !showCancelOrders ? "default" : "pointer",
    //                             opacity: !showCancelOrders ? 0.5 : 1,
    //                             pointerEvents: "auto"
    //                         }}
    //                         onClick={(e) => {
    //                             if (!showCancelOrders) {
    //                                 e.preventDefault();
    //                                 e.stopPropagation();
    //                                 return;
    //                             }

    //                             if (selectedDelivery && selectedDelivery.length > 0) {
    //                                 setCancelOrderDisplayConfirmation(true);
    //                             } else {
    //                                 toast.current.show({
    //                                     severity: 'error',
    //                                     summary: 'Error',
    //                                     detail: 'Kindly select at least 1 order'
    //                                 });
    //                             }
    //                         }}
    //                     >
    //                         <span className={`${item.icon} mr-2`} />
    //                         <span className="p-menuitem-text">{item.label}</span>
    //                     </a>
    //                 </span>
    //             );
    //         }
    //     }
    // ];

    const items = [{ label: 'Orders' }, { label: 'Cancel Order' }];
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
        const ordersPromise = new Promise((resolve) => {
            networkTimeout = setTimeout(() => {
                OrdersImportService.getOrdersGrid(lazyState).then((data) => {
                    setTotalRecords(data.totalRecords);
                    setOrders(data.data);
                    resolve();
                });
            }, 300);
        });

        const usersPromise = UserSettingService.getMantisUsers().then((data) => {
            if (data.error === 0 && Array.isArray(data.data)) {
                const formattedUsers = data.data.map(user => ({
                    emp_ID: user.emp_ID || user.id,
                    Name: user.name || user.username
                }));
                setUsersDropdownlist(formattedUsers);
            } else {
                console.error("Invalid response:", data);
            }
        });

        const orderTypesPromise = OrdersImportService.getOrderTypes().then((data) => {
            setOrderAssignTypeDropdownlist(data.data);
        });

        // wait for all promises to finish
        Promise.all([ordersPromise, usersPromise, orderTypesPromise])
            .finally(() => setLoading(false));

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

        if (filters.order_type?.value !== null && filters.order_type?.value !== undefined) {
            const asInt = filters.order_type.value.toString();
            filters.order_type.value = isNaN(asInt) ? null : asInt;
        }

        setlazyState({
            ...event,
            first: 0,
            filters
        });
    };

    const onSelectAllChange = (event) => {
        const selectAll = event.checked;
        const currentPageOrderIds = orders.map(order => order.pick_list_id);

        const existingSelected = JSON.parse(localStorage.getItem("selectedOrders")) || [];

        if (selectAll) {
            setSelectAll(true);

            // Merge current page orders with existing selections
            const newSelected = [...existingSelected];

            orders.forEach(order => {
                if (!newSelected.find(o => o.pick_list_id === order.pick_list_id)) {
                    newSelected.push(order);
                }
            });

            localStorage.setItem("selectedOrders", JSON.stringify(newSelected));
        } else {
            setSelectAll(false);

            // Remove current page orders from selected
            const filteredSelected = existingSelected.filter(order =>
                !currentPageOrderIds.includes(order.pick_list_id)
            );

            localStorage.setItem("selectedOrders", JSON.stringify(filteredSelected));
        }

        pickListData();
    };

    const picklist_idBodyTemplate = (rowData) => {
    const canView = hasPageAccess("Cancel_order_details");

    return (
        <>
            {canView ? (
                <Link to={`/outbound/cancel-order/order-item/${rowData.id}/${rowData.pick_list_id}`}>
                    {rowData.pick_list_id}
                </Link>
            ) : (
                <span style={{ color: '#999', cursor: 'not-allowed' }}>
                    {rowData.pick_list_id}
                </span>
            )}
        </>
    );
};

    const noOfLinesBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.order_details_count}
            </>
        );
    };

    const customerCodeBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.customer_code}
            </>
        );
    };

    const palletCountBodyTemplate = (rowData) => {
        return (
            <a
                href="#"
                onClick={(e) => {
                    e.preventDefault();
                    getPalletInfo(rowData.pick_list_id);
                }}
            >
                {rowData.total_pallet_info}
            </a>
        );
    };

    const getPalletInfo = (orderCode) => {
        setUserDetail(null)
        setUserDetailModel(true)
        setCode(orderCode)
        setLoadingDetail(true);
        const data = {
            order_code: orderCode,
        }
        DashboardService.getPalletInfo(data).then((data) => {
            setUserDetail(data.data?.grid_data || []);
        }).finally(() => setLoadingDetail(false));
    }


    const created_atBodyTemplate = (rowData) => {
        if (!rowData.created_at) return "";

        // Extract date part directly from the string without JS Date conversion
        const datePart = rowData.created_at.split("T")[0];
        return <>{datePart}</>;
    };

    const lv_statusBodyTemplate = (rowData) => {
        return (
            <>
                <Tag value={rowData.lv_status} severity={getLvStatusSeverity(rowData.lv_status)} />
            </>
        );
    };

    const mantis_importedBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.mantis_imported == 2) ? <Badge value="Partially" severity="primary">P</Badge> : (rowData.mantis_imported == 1) ? <Badge value="Yes" severity="success">N</Badge> : <Badge value="No" severity="danger"></Badge>}
            </>
        );
    };
    const invalid_itemsBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.invalid_items == 1) ? <Badge value="Yes" severity="danger">N</Badge> : <Badge value="No" severity="success"></Badge>}
            </>
        );
    };

    const api_exportBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.api_export == 1) ? <Badge value="Yes" severity="success">N</Badge> : <Badge value="No" severity="danger"></Badge>}
            </>
        );
    };

    const is_location_assignedBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.is_location_assigned == 2) ? <Badge value="Partially" severity="info "></Badge> : (rowData.is_location_assigned == 1) ? <Badge value="Assigned" severity="success"></Badge> : (rowData.is_location_assigned == 3) ? <Badge value="Released" severity="primary"></Badge> : <Badge value="Not Assigned" severity="danger"></Badge>}
            </>
        );
    };
    const is_syncBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.is_sync == 0) ? <Badge value="Pending" severity="secondary"></Badge> : ((rowData.is_sync == 1) ? <Badge value="Success" severity="success"></Badge> : <Badge value="Failed" severity="danger"></Badge>)}
            </>
        );
    };
    const reExecuteBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.reExecute == 1) ? <Badge value="Yes" severity="success"></Badge> : <Badge value="No" severity="secondary"></Badge>}
            </>
        );
    };
    const TaskUserBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.assigned}
            </>
        );
    };
    const TaskAssignBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.total}
            </>
        );
    };
    const TaskCompletionBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.completed == null || rowData.completed == 0) ? <Badge value="No" severity="danger"></Badge> : <Badge value="Yes" severity="success"></Badge>}
            </>
        );
    };

    const is_exportedBodyTemplate = (rowData) => {
        if (rowData.is_exported == 1) {
            return (
                <>
                    {<Badge value="Partial"></Badge>}
                </>
            );
        } else if (rowData.is_exported == 2) {
            return (
                <>
                    {<Badge value="Completed" severity="success"></Badge>}
                </>
            );
        } else if (rowData.is_exported == 3) {
            return (
                <>
                    {<Badge value="Failed" severity="danger"></Badge>}
                </>
            );
        } else if (rowData.is_exported == 4) {
            return (
                <>
                    {<Badge value="Skipped" severity="warning"></Badge>}
                </>
            );
        } else if (rowData.is_exported == 5) {
            return (
                <>
                    {<Badge value="Unexportable" severity="warning"></Badge>}
                </>
            );
        } else if (rowData.is_exported == 6) {
            return (
                <>
                    {<Badge value="Manual Complete" severity="success"></Badge>}
                </>
            );
        } else {
            return (
                <>
                    {<Badge value="Pending" severity="secondary"></Badge>}
                </>
            );
        }

    };


    const orderTypedBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.order_type}
            </>
        );
    };
    const flagTemplate = (option) => {
        return <Badge value={option.name} severity={getSeverity(option.name)} />;
    };
    const invalidFlagTemplate = (option) => {
        return <Badge value={option.name} severity={getInvalidSeverity(option.name)} />;
    };
    const lvStatusflagTemplate = (option) => {
        return <Badge value={option.name} severity={getLvStatusSeverity(option.name)} />;
    };

    const lvStatusRowFilterTemplate = (options) => {
        return (
            <Dropdown style={{ minWidth: '3em', width: '5em' }} value={options.name} optionValue="code" optionLabel="name" options={lvStatusFlags} onChange={(e) => options.filterApplyCallback(e.value)} itemTemplate={lvStatusflagTemplate} placeholder="Select One" className="p-column-filter" showClear />
        );
    };
    const OrderTypeRowFilterTemplate = (options) => {
        return (
            <Dropdown style={{ minWidth: '3em', width: '5em' }} value={options.id} optionValue="id" optionLabel="order_type" options={orderAssignTypeDropdownlist} onChange={(e) => options.filterApplyCallback(e.value)} placeholder="Select One" className="p-column-filter" showClear />
        );
    };
    const statusRowFilterTemplate = (options) => {
        return (
            <Dropdown style={{ minWidth: '3em', width: '3em' }} value={options.name} optionValue="code" optionLabel="name" options={globalFlags} onChange={(e) => options.filterApplyCallback(e.value)} itemTemplate={flagTemplate} placeholder="Select One" className="p-column-filter" showClear />
        );
    };
    const mantisImportedtatusRowFilterTemplate = (options) => {
        return (
            <Dropdown style={{ minWidth: '3em', width: '5em' }} value={options.name} optionValue="code" optionLabel="name" options={matisImportedFlags} onChange={(e) => options.filterApplyCallback(e.value)} itemTemplate={flagTemplate} placeholder="Select One" className="p-column-filter" showClear />
        );
    };
    const LocationRowFilterTemplate = (options) => {
        return (
            <Dropdown style={{ minWidth: '3em', width: '4em' }} value={options.name} optionValue="code" optionLabel="name" options={LocationFlags} onChange={(e) => options.filterApplyCallback(e.value)} itemTemplate={flagTemplate} placeholder="Select One" className="p-column-filter" showClear />
        );
    };
    const invalidStatusRowFilterTemplate = (options) => {
        return (
            <Dropdown style={{ minWidth: '3em', width: '5em' }} value={options.name} optionValue="code" optionLabel="name" options={globalFlags} onChange={(e) => options.filterApplyCallback(e.value)} itemTemplate={invalidFlagTemplate} placeholder="Select One" className="p-column-filter" showClear />
        );
    };
    const exportStatusRowFilterTemplate = (options) => {
        return (
            <Dropdown style={{ minWidth: '1em', width: '3em' }} value={options.name} optionValue="code" optionLabel="name" options={exportedFlags} onChange={(e) => options.filterApplyCallback(e.value)} itemTemplate={flagTemplate} placeholder="Select One" className="p-column-filter" showClear />
        );
    };

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="flex mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                 {actionItems.length > 0 && (<><Menu model={actionItems} popup ref={menuLeft} id="popup_menu_left" />
                <Button label="Actions" icon="pi pi-align-left" className="mr-2" onClick={(event) => menuLeft.current.toggle(event)} aria-controls="popup_menu_left" aria-haspopup /> </> )}

                <div className="block mt-2 md:mt-0 flex align-items-center bg-bd-cl">
                    <Button
                        onClick={() => RefreshEntireList()}
                        icon="pi pi-times"
                        className="p-button-text p-button-gray mr-3"
                        tooltip="Close"
                        tooltipOptions={{ position: 'top' }}
                    />
                    <label htmlFor="PickList ID">PickList ID : </label>
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
        pickListData();
        setSelectAll(false);
    }

    const handleMultiSelectChange = (e) => {
        const selectedPickListIds = e.value;
        const allSelectedOrders = JSON.parse(localStorage.getItem("selectedOrders")) || [];
        const filteredOrders = allSelectedOrders.filter(order =>
            selectedPickListIds.includes(order.pick_list_id)
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
        pickListData();
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
        if (!orders || orders.length === 0) {
            setSelectAll(false);
            setSelectedOption([]);
            return;
        }

        const selectedOrders = JSON.parse(localStorage.getItem("selectedOrders")) || [];
        const selectedIds = selectedOrders.map(order => order.pick_list_id);

        const isAllSelected = orders.every(order => selectedIds.includes(order.pick_list_id));

        setSelectAll(isAllSelected);

        setSelectedOption(orders
            .filter(order => selectedIds.includes(order.pick_list_id))
            .map(order => order.pick_list_id)
        );

        pickListData();

    }, [orders]);


    const pickListData = () => { 
        localStorage.removeItem("list-Id");

        const selectedOrders = JSON.parse(localStorage.getItem("selectedOrders")) || [];
        const options = selectedOrders.map(order => ({
            label: `${order.pick_list_id} - ${order.lv_status}`,
            value: order.pick_list_id

        }));
        setOptionsList(options);
        setSelectedOption(selectedOrders.map(order => order.pick_list_id));
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
        pickListData();

    };
    const userName = JSON.parse(localStorage.getItem("user"))?.user?.name;
    const userId = JSON.parse(localStorage.getItem("user"))?.user?.id;
    const userEmail = JSON.parse(localStorage.getItem("user"))?.user?.email;
    const cancelOrders = () => {
        setCancelOrderDisplayConfirmation(false)
        setLoading(true);
        // console.log(selectedDelivery);
        const pick_list_ids = selectedDelivery.map(item => item.pick_list_id);
        const data = { 
            ids: pick_list_ids ,
            userName: userName,
            userId: userId,
            userEmail: userEmail
        }
        OrdersImportService.cancelOrders(data).then((data) => {
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

    const cancelOrderConfirmationDialogFooter = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setCancelOrderDisplayConfirmation(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => cancelOrders()} className="p-button-text" autoFocus />
        </>
    );

    const cancleModel = (reload = false) => {
        setUserDetail(null)
        setCode('')
        setUserDetailModel(false);
    }

    return (
        <>
            <Helmet>
                <title>Orders</title>
            </Helmet>
            <Toast ref={toast} />
            <BreadCrumb model={items} home={home} />
            <Dialog header={`Order Code: ${code}`} visible={UserDetailModel} style={{ width: '50vw' }}
                position="top" onHide={() => { if (!UserDetailModel) return; cancleModel(); }}
            >
                {!UserDetail ? (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <ProgressSpinner />
                    </div>
                ) : (
                    <div className="card p-0">
                        <DataTable
                            removableSort
                            value={UserDetail}
                            className="datatable-responsive"
                            emptyMessage="No records found."
                            showGridlines
                            sort
                            tableStyle={{ minWidth: '40rem' }}
                            size="small"
                            stripedRows
                            loading={loadingDetail}
                            scrollable
                            scrollHeight="350px"
                        >
                            <Column header="Location Code" field="loc_Code" body={(data) => data.loc_code} />
                            <Column header="SSCC" field="SPTQuantityFree" body={(data) => data.sscc} />
                            <Column header="Dimensions" field="SPTQuantity" body={(data) => data.dimensions} />
                        </DataTable>
                    </div>
                )}
            </Dialog>
            <Dialog header="Confirmation" visible={cancelOrderDisplayConfirmation} onHide={() => setCancelOrderDisplayConfirmation(false)} style={{ width: '350px' }} modal footer={cancelOrderConfirmationDialogFooter}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Warning: Please close any open Sage X3 window for this order before proceeding. If not closed, the cancellation will apply only in Mantis, not in Sage X3.Are you sure you want to proceed?</span>
                </div>
            </Dialog>
            <h1></h1>
            <div className="card">
                <h3>Cancel Order</h3>
                <DataTable
                    value={orders}
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
                    rowsPerPageOptions={[25, 50, 100, 500, 1000, 5000]}
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
                    <Column field="pick_list_id" header="PickList ID" headerStyle={{ width: '14rem' }} body={picklist_idBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="order_details_count" header="No. of Lines" headerStyle={{ width: '4rem' }} body={noOfLinesBodyTemplate} />
                    <Column field="customer_code" sortable headerStyle={{ width: '14rem' }} header="Customer Code" body={customerCodeBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    {/* <Column field="pallet_count" headerStyle={{ width: '4rem' }} header="Pallet Count" body={palletCountBodyTemplate} /> */}
                    <Column field="created_at" sortable header="Created At" headerStyle={{ width: '14rem' }} body={created_atBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="lv_status" sortable header="Status" body={lv_statusBodyTemplate} showFilterMenu={false} filter filterElement={lvStatusRowFilterTemplate} />
                    <Column field="mantis_imported" header="Mantis Imported" body={mantis_importedBodyTemplate} filter showFilterMenu={false} filterElement={mantisImportedtatusRowFilterTemplate} />
                    <Column field="invalid_items" header="Invalid Items" body={invalid_itemsBodyTemplate} filter showFilterMenu={false} filterElement={invalidStatusRowFilterTemplate} />
                    {/* <Column field="is_exported" header="Is Exported" body={is_exportedBodyTemplate} filter showFilterMenu={false} filterElement={exportStatusRowFilterTemplate} /> */}
                    {/* <Column field="is_location_assigned" header="Ship Loc Status" body={is_location_assignedBodyTemplate} filter showFilterMenu={false} filterElement={LocationRowFilterTemplate} /> */}
                    {/* <Column field="is_sync" header="Is Detail Synced" body={is_syncBodyTemplate} /> */}
                    <Column field="order_type" header="Order Type" body={orderTypedBodyTemplate} showFilterMenu={false} filter filterElement={OrderTypeRowFilterTemplate} />
                    {/* <Column field="ReExecute" header="Re Execute" body={reExecuteBodyTemplate} filter showFilterMenu={false} filterElement={statusRowFilterTemplate} /> */}
                    <Column field="total" header="Total Task" body={TaskAssignBodyTemplate} filter showFilterMenu={false} filterPlaceholder="Search" />
                    <Column field="assigned" header="Task Assign" body={TaskUserBodyTemplate} filter showFilterMenu={false} filterPlaceholder="Search" />
                    <Column field="completed" header="Task Completion" body={TaskCompletionBodyTemplate} />

                </DataTable>
            </div>
        </>

    );
}
