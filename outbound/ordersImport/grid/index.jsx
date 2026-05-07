
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link } from 'react-router-dom';
import { Button } from 'primereact/button';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Helmet } from 'react-helmet';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { FileUpload } from 'primereact/fileupload';
import { OrdersImportService } from '../../../../service/outbound/OrdersImportService';
import { Tag } from 'primereact/tag';
import { Badge } from 'primereact/badge';
import { SplitButton } from 'primereact/splitbutton';
import { Menu } from 'primereact/menu';
import { UserSettingService } from '../../../../service/settings/UserSettingService';
import { Dropdown } from 'primereact/dropdown';
import { LocationsService } from '../../../../service/misc/LocationsService';
import { MultiSelect } from 'primereact/multiselect';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import '../../../../assets/styles.css';
import * as XLSX from 'xlsx';
import { OverlayPanel } from 'primereact/overlaypanel';
import { useLazySort } from '../../../../components/useLazySort';
import { DashboardService } from '../../../../service/DashboardService';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tooltip } from 'primereact/tooltip';
import { useAuth } from '../../../../store/useAuth';

export default function OrderImport() {
    const {hasActionAccess,hasPageAccess} = useAuth();
     const PAGE_KEY = "outbound_manualOrdersImport";
     const Detail_Page_Key="order_details"
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [orders, setOrders] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState(() => {
        const savedSelection = localStorage.getItem("selectedOrders");
        return savedSelection ? JSON.parse(savedSelection) : [];
    });

    const [shippingLocations, setShippingLocations] = useState(null);
    const [selectedLocations, setSelectedLocations] = useState(null);
    const [selectedLocationLimit, setSelectedLocationLimit] = useState(3);

    const [laneslist, setLanesList] = useState(null);
    const [selectedLanes, setSelectedLanes] = useState(null);
    const [noOfPallets, setNoOfPallets] = useState(0);
    const [nextCursor, setNextCursor] = useState(null);
    const [prevCursor, setPrevCursor] = useState(null);
    const [dates, setDates] = useState(null);
    const [displayConfirmation, setDisplayConfirmation] = useState(false);
    const [displayConfirmation2, setDisplayConfirmation2] = useState(false);
    const [displayConfirmation3, setDisplayConfirmation3] = useState(false);
    const [displayConfirmation4, setDisplayConfirmation4] = useState(false);
    const [displayConfirmation5, setDisplayConfirmation5] = useState(false);
    const [displayConfirmation6, setDisplayConfirmation6] = useState(false);
    const [displayConfirmation7, setDisplayConfirmation7] = useState(false);
    const [displayConfirmation8, setDisplayConfirmation8] = useState(false);
    const [displayConfirmation20, setDisplayConfirmation20] = useState(false);
    const [displayConfirmation9, setDisplayConfirmation9] = useState(false);
    const [displayConfirmation10, setDisplayConfirmation10] = useState(false);
    const [displayConfirmation11, setDisplayConfirmation11] = useState(false);
    const [displayConfirmation12, setDisplayConfirmation12] = useState(false);
    const [displayConfirmation13, setDisplayConfirmation13] = useState(false);
    const [displayConfirmation14, setDisplayConfirmation14] = useState(false);
    const [displayConfirmation15, setDisplayConfirmation15] = useState(false);
    const [displayConfirmation16, setDisplayConfirmation16] = useState(false);
    const [displayConfirmation17, setDisplayConfirmation17] = useState(false);
    const [displayConfirmation18, setDisplayConfirmation18] = useState(false);
    const [displayConfirmation19, setDisplayConfirmation19] = useState(false);
    const [cancelOrderDisplayConfirmation, setCancelOrderDisplayConfirmation] = useState(false);
    const [displaySyncConfirmation, setDisplaySyncConfirmation] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [displayConfirmationRerun, setDisplayConfirmationRerun] = useState(false);
    const [displayConfirmationRerunPick, setDisplayConfirmationRerunPick] = useState(false);
    const [orderTypepopup, setOrderTypepopup] = useState(false);
    const [selectedOption, setSelectedOption] = useState([]);
    const [optionsList, setOptionsList] = useState([]);
    const op = useRef(null);
    const [UserDetail, setUserDetail] = useState([]);
    const [UserDetailModel, setUserDetailModel] = useState(false);
    const [loadingDetail, setLoadingDetail] = useState(true);
    const [modelMsg, setModelMsg] = useState(null);
    const [code, setCode] = useState([]); 
    const tableRef = useRef(null);

    // const [globalFlags] = useState([ { code: '1', name: 'Yes' },
    // { code: '0', name: 'No' }]);
    // const [exportedFlags] = useState(['Pending', 'Partial','Completed','Failed', 'Skipped', 'Unexportable', 'Manual Complete']);
    const rowsOptions = [10, 25, 50, 100];
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

    const orderTypeFlags = [
        { "name": "Regular", "code": "ltl" },
        { "name": "Full Truck Load", "code": "ftl" },
        { "name": "Transfer", "code": "tr" },
        { "name": "Small Picking", "code": "sp" },
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
const getSeverityre = (flag) => {
        switch (flag) {
            case 'Yes':
                return 'success';

            case 'No':
                return 'secondary';

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

    const [assigntouseruom, setAssigntouseruom] = useState(null);
    // const orderTypeDropdownlist = [
    //     {"name": "Regular","value": "regular_order"},
    //     {"name": "Inter Transfer","value": "inter_transfer_order"},
    //     {"name": "Full Truck Load","value": "full_truck_load"},
    // ];

    const [usersDropdownlist, setUsersDropdownlist] = useState(null);
    const [selectedOrderType, setSelectedOrderType] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [assignSelectedOrderType, setassignSelectedOrderType] = useState(null);
    const [orderAssignTypeDropdownlist, setOrderAssignTypeDropdownlist] = useState(null);


    const [templateUrl, setTemplateUrl] = useState(false);
    const [bulkOrderTemplateUrl, setBulkOrderTemplateUrl] = useState(false);
    const [btnDisabled, setbtnDisabled] = useState(true);

    let data = {};
    let fileRef = useRef();
    const menuLeft = useRef(null);

    const toast = useRef();
    const [rowsPerPage, setRowsPerPage] = useState(() => {
        return parseInt(localStorage.getItem("rowsPerPage"), 10) || 10;
    })
    const [lazyState, setlazyState] = useState({
        first: 0,
        // back:prevCursor,
        // current:localStorage.getItem('next_cursor') ? localStorage.getItem('next_cursor') : null,
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

    const showPickListDetail = import.meta.env.VITE_SHOW_SYNC_ORDERS === "true";
    const showSyncDetails = import.meta.env.VITE_SHOW_SYNC_ORDERS === "true";

    const actionItems = [
        // {
        //     label: 'Sync Details',
        //     icon: 'pi pi-sync',
        //     command: () => {
        //         if (selectedDelivery != null && selectedDelivery.length == 1) {
        //             onclick(setDisplayConfirmation9(true))
        //         } else {
        //             toast.current.show({ severity: 'error', summary: 'Error', detail: 'Please select 1 order only' });
        //         }
        //     }
        // },
         hasActionAccess(PAGE_KEY, "sync_details") && {
            label: 'Sync Details',
            icon: 'pi pi-sync',
            template: (item, options) => {
                return (
                    <span
                        className={
                            !showSyncDetails
                                ? "disabled-sync-details-wrapper inline-block"
                                : "inline-block"
                        }
                    >
                        <Tooltip
                            target=".disabled-sync-details-wrapper"
                            content="It is not part of Phase-1 plan"
                            position="right"
                        />
        
                        <a
                            className="p-menuitem-link"
                            style={{
                                cursor: !showSyncDetails ? "default" : "pointer",
                                opacity: !showSyncDetails ? 0.5 : 1,
                                pointerEvents: !showSyncDetails ? "auto" : "auto"
                            }}
                            onClick={(e) => {
                                if (!showSyncDetails) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    return;
                                }
                                setDisplayConfirmation9(true);
                            }}
                        >
                            <span className={`${item.icon} mr-2`} />
                            <span className="p-menuitem-text">{item.label}</span>
                        </a>
                    </span>
                );
            }
        },
        // {
        //     // label: 'Create Delivery',
        //     label: 'Export Order',
        //     icon: 'pi pi-plus',
        //     command: () => {
        //         if (selectedDelivery != null && selectedDelivery.length > 0) {
        //             onclick(setDisplayConfirmation3(true))
        //         } else {
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
        // {
        //     label: 'Get PickList Detail',
        //     icon: 'pi pi-plus',
        //     command: () => {
        //         console.log(selectedDelivery)
        //         if (selectedDelivery != null && selectedDelivery.length > 0) {
        //             onclick(setDisplayConfirmationRerunPick(true));
        //         } else {
        //             toast.current.show({ severity: 'error', summary: 'Error', detail: 'At least select 1 order' });
        //         }
        //     }
        // },
        hasActionAccess(PAGE_KEY, "get_picklist_detail") &&{
            label: 'Get PickList Detail',
            icon: 'pi pi-plus',
            template: (item, options) => {
                return (
                    <span
                        className={
                            !showPickListDetail
                                ? "disabled-picklist-wrapper inline-block"
                                : "inline-block"
                        }
                    >
                        <Tooltip
                            target=".disabled-picklist-wrapper"
                            content="It is not part of Phase-1 plan"
                            position="right"
                        />
        
                        <a
                            className="p-menuitem-link"
                            style={{
                                cursor: !showPickListDetail ? "default" : "pointer",
                                opacity: !showPickListDetail ? 0.5 : 1,
                                pointerEvents: !showPickListDetail ? "auto" : "auto"
                            }}
                            onClick={(e) => {
                                if (!showPickListDetail) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    return;
                                }
                                setDisplayConfirmationRerunPick(true);
                            }}
                        >
                            <span className={`${item.icon} mr-2`} />
                            <span className="p-menuitem-text">{item.label}</span>
                        </a>
                    </span>
                );
            }
        },
        // {
        //     label: 'Mark as Manual Complete',
        //     icon: 'pi pi-plus',
        //     command: () => {
        //         if (selectedDelivery != null && selectedDelivery.length > 0) {
        //             onclick(setDisplayConfirmation10(true))
        //         } else {
        //             toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 order' });
        //         }
        //     }
        // },
        hasActionAccess(PAGE_KEY, "check_order_status")&&{
            label: 'Check Order Status',
            icon: 'pi pi-plus',
            command: () => {
                if (selectedDelivery != null && selectedDelivery.length > 0) {
                    onclick(setDisplayConfirmation11(true))
                } else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 order' });
                }
            }
        },
        hasActionAccess(PAGE_KEY, "release_shipment_location")&&{
            label: 'Release Shipment Location',
            icon: 'pi pi-map',
            command: () => {

                if (selectedDelivery != null) {
                    onclick(setDisplayConfirmation12(true))
                }
                else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 order' });
                }

            }
        },
        hasActionAccess(PAGE_KEY, "assign_order_type")&&{
            label: 'Assign Order Type',
            icon: 'pi pi-plus',
            command: () => {
                if (selectedDelivery != null && selectedDelivery.length > 0) {

                    setOrderTypepopup(true)

                } else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 order' });
                }
            }
        },
        hasActionAccess(PAGE_KEY, "assign_user_loc_case")&&{
            label: 'Assign User Loc for Case',
            icon: 'pi pi-user',
            command: () => {
                if (selectedDelivery != null && selectedDelivery.length >= 1) {
                    getShippingLocations(selectedDelivery)
                    setSelectedLocations(null)
                    setSelectedUser(null)
                    setbtnDisabled(true)
                    setAssigntouseruom('cs')
                    onclick(setDisplayConfirmation7(true))
                } else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 order' });
                }
            }
        },
         hasActionAccess(PAGE_KEY, "assign_user_loc_pallet")&&{
            label: 'Assign User Loc for Pallet',
            icon: 'pi pi-user',
            command: () => {
                if (selectedDelivery != null && selectedDelivery.length >= 1) {
                    getShippingLocations(selectedDelivery)
                    setSelectedLocations(null)
                    setSelectedUser(null)
                    setbtnDisabled(true)
                    setAssigntouseruom('pallet')
                    onclick(setDisplayConfirmation7(true))
                } else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 order' });
                }
            }
        },
        hasActionAccess(PAGE_KEY, "delete")&&{
            label: 'Delete',
            icon: 'fa fa-trash',
            command: () => {
                if (selectedDelivery != null && selectedDelivery.length == 1) {
                    setbtnDisabled(true)
                    onclick(setDisplayConfirmation17(true))
                }
                if (selectedDelivery != null && selectedDelivery.length > 1) {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'You cannot select multiple orders at a time.' });
                } else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 order' });
                }
            }
        },
        hasActionAccess(PAGE_KEY, "assign_to_lanes")&&{
            label: 'Assign To Lanes',
            icon: 'pi pi-map-marker',
            command: () => {
                if (selectedDelivery != null && selectedDelivery.length > 0) {
                    getLanes()

                    setNoOfPallets(0)
                    getAllOrderPalletsCount()

                    setSelectedLanes(null)

                    setbtnDisabled(true)
                    onclick(setDisplayConfirmation6(true))
                } else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 order' });
                }
            }
        },
        hasActionAccess(PAGE_KEY, "load_orders")&&{
            label: 'Load Orders',
            icon: 'pi pi-sync',
            command: () => {
                if (selectedDelivery != null && selectedDelivery.length > 0) {
                    setbtnDisabled(true)
                    const completedValue = selectedDelivery[0]?.completed;

                    if (completedValue == null || completedValue === 0) {
                        // Hide old popup before showing the new one
                        setDisplayConfirmation8(false);
                        setDisplayConfirmation20(true);
                    } else {
                        setDisplayConfirmation8(true);
                    }
                } else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Please select 1 order' });
                }
            }
        },
         hasActionAccess(PAGE_KEY, "re_execute_order")&&{
            label: 'Re-execute Order',
            icon: 'pi pi-sync',
            command: () => {
                if (selectedDelivery != null && selectedDelivery.length > 0) {
                    setbtnDisabled(true)
                    onclick(setDisplayConfirmation14(true))
                } else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 order' });
                }
            }
        },
        hasActionAccess(PAGE_KEY, "append_order")&&{
            label: 'Append Order',
            icon: 'pi pi-sync',
            command: () => {
                if (selectedDelivery != null && selectedDelivery.length > 0) {
                    setbtnDisabled(true)
                    onclick(setDisplayConfirmation15(true))
                } else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 order' });
                }
            }
        },
        hasActionAccess(PAGE_KEY, "mark_not_reexecute")&&{
            label: 'Mark as not re-execute',
            icon: 'pi pi-sync',
            command: () => {
                if (selectedDelivery != null && selectedDelivery.length > 0) {
                    setbtnDisabled(true)
                    onclick(setDisplayConfirmation18(true))
                } else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 order' });
                }
            }
        },
        hasActionAccess(PAGE_KEY, "archive_completed_orders")&&{
            label: 'Archive Completed Orders',
            icon: 'fa-regular fa-file-zipper',
            command: () => {

                onclick(setDisplayConfirmation16(true))

            }
        },
        // {
        //     label: 'Cancel Order',
        //     icon: 'fa fa-times',
        //     command: () => {
        //         if (selectedDelivery != null && selectedDelivery.length > 0) {
        //             onclick(setCancelOrderDisplayConfirmation(true))
        //         }
        //         else {
        //             toast.current.show({ severity: 'error', summary: 'Error', detail: 'Kindly select atleast 1 order' });
        //         }
        //     }
        // },
    ].filter(Boolean);

    const items = [{ label: 'Orders' }, { label: 'Orders' }];
    const home = { icon: 'pi pi-home', url: '/' }

    // let networkTimeout = null;
    const networkTimeoutRef = useRef(null);
    const requestSeqRef = useRef(0);

    const getStatusSeverity = (status) => {
        if (status) {
            if (status.includes('1-')) {
                return 'primary';
            } else if (status.includes('3-')) {
                return 'success';
            } else {
                return 'info';
            }
        }
    };

    useEffect(() => {

    }, []);

    useEffect(() => {
        loadLazyData();
    }, [lazyState]);


    const pickList = () => {

        OrdersImportService.getOrdersList().then((data) => {

        });
    }

    const syncOrders = () => {

        //Block API call completely when feature disabled
        if (!showSyncOrders) {
            return;
        }

        if (isSyncing) {
            return;
        }
        setDisplaySyncConfirmation(false);
        setIsSyncing(true); // Set the flag to true to indicate that the API call is in progress
        setLoading(true); // Show loading indicator

        OrdersImportService.getOrdersList().then((data) => {
            setDisplaySyncConfirmation(false);
            setLoading(false); // Hide loading indicator
            setIsSyncing(false); // Reset the flag after the API call is complete

            if (data.error === 0) {
                setDisplaySyncConfirmation(false);
                // Close the confirmation dialog only if the API call is successful
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message });
                loadLazyData(); // Reload the data after syncing
            } else {
                // Show error message without closing the dialog
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message });
            }
        }).catch((error) => {
            setLoading(false); // Hide loading indicator in case of error
            setIsSyncing(false); // Reset the flag
            console.error("Error syncing orders:", error);
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'An error occurred while syncing orders.', life: 3000 });
        });
    };
    const loadLazyData = () => {
  // bump request version so only the latest response updates state
  const mySeq = ++requestSeqRef.current;

  // clear pending debounce
  if (networkTimeoutRef.current) {
    clearTimeout(networkTimeoutRef.current);
  }

  // debounce the grid call
  networkTimeoutRef.current = setTimeout(() => {
    setLoading(true);

    const sanitizedLazyState = {
      ...lazyState,
      filters: Object.fromEntries(
        Object.entries(lazyState.filters || {}).map(([key, f]) => {
          if (!f) return [key, f];
          const v = f.value;
          const cleanValue = typeof v === "string" && v.trim() === "" ? null : v;
          return [key, { ...f, value: cleanValue }];
        })
      ),
    };

    const ordersPromise = OrdersImportService.getOrdersGrid(sanitizedLazyState).then((data) => {
      if (mySeq !== requestSeqRef.current) return; // ignore old response

      setTotalRecords(data.totalRecords);
      setOrders(data.data);
      setNextCursor(data.next_cursor);
      setPrevCursor(data.prev_cursor);
      setTemplateUrl(data.template_url);
      setBulkOrderTemplateUrl(data.bulk_order_template_url);
    });

    // const usersPromise = UserSettingService.getMantisUsers().then((data) => {
    //   if (mySeq !== requestSeqRef.current) return;

    //   if (data.error === 0 && Array.isArray(data.data)) {
    //     const formattedUsers = data.data.map((user) => ({
    //       emp_ID: user.emp_ID || user.id,
    //       Name: user.name || user.username,
    //     }));
    //     setUsersDropdownlist(formattedUsers);
    //   }
    // });
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
    //   if (mySeq !== requestSeqRef.current) return;
      setOrderAssignTypeDropdownlist(data.data);
    });

    Promise.all([ordersPromise, usersPromise, orderTypesPromise]).finally(() => {
      if (mySeq === requestSeqRef.current) setLoading(false);
    });

    // optional: only if you really want to force default rowsPerPage always
    localStorage.setItem("rowsPerPage", 10);
  }, 300);
};
    //     // wrap your APIs in promises
    //     const ordersPromise = new Promise((resolve) => {
    //         networkTimeout = setTimeout(() => {
    //             OrdersImportService.getOrdersGrid(lazyState).then((data) => {
    //                 setTotalRecords(data.totalRecords);
    //                 setOrders(data.data);
    //                 setNextCursor(data.next_cursor);
    //                 setPrevCursor(data.prev_cursor);
    //                 setTemplateUrl(data.template_url);
    //                 setBulkOrderTemplateUrl(data.bulk_order_template_url);
    //                 resolve();
    //             });
    //         }, 300);
    //     });

    //     const usersPromise = UserSettingService.getMantisUsers().then((data) => {
    //         if (data.error === 0 && Array.isArray(data.data)) {
    //             const formattedUsers = data.data.map(user => ({
    //                 emp_ID: user.emp_ID || user.id,
    //                 Name: user.name || user.username
    //             }));
    //             setUsersDropdownlist(formattedUsers);
    //         } else {
    //             console.error("Invalid response:", data);
    //         }
    //     });

    //     const orderTypesPromise = OrdersImportService.getOrderTypes().then((data) => {
    //         setOrderAssignTypeDropdownlist(data.data);
    //     });

            //Old Code
    //     // wait for all promises to finish
    //     Promise.all([ordersPromise, usersPromise, orderTypesPromise])
    //         .finally(() => setLoading(false));
            //  Old Code
    //     // just for checking the data 
    //     const DefaultRowValue = 10;
    //     localStorage.setItem("rowsPerPage", DefaultRowValue);
    // };
   
    const getShippingLocations = (selectedDelivery) => {
        OrdersImportService.getOrderPalletsCount((selectedDelivery)).then((data) => {
            if (data.data == '0') {
                setSelectedLocationLimit(1);
            } else {
                setSelectedLocationLimit(data.data);
            }
        });
        OrdersImportService.gettaskwiseMantisUsers(selectedDelivery).then((data) => {
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
        LocationsService.getShippingLocations((selectedDelivery)).then((data) => {
            // setLoading(false);
            if (data.error == 0) {
                setShippingLocations(data.data);
                setSelectedLocations(data.selectedLocations)
            }
        });
    }

    const getAllOrderPalletsCount = () => {
        OrdersImportService.getAllOrderPalletsCount((selectedDelivery)).then((data) => {
            if (data.error == 0) {
                setNoOfPallets(data.data);
            }
        });
    }

    const getLanes = () => {
        LocationsService.getLanes().then((data) => {
            if (data.error === 0 && Array.isArray(data.data)) {
                const formattedLanes = data.data.map(item => ({
                    lane: item.lane,
                    lane_count: item.laneCount
                }));

                setLanesList(formattedLanes);
                setSelectedLanes(data.selectedLanes || []);
            }
        });
    };

    const handleFirst = () => {
        setlazyState(prevState => ({
            ...prevState,
            first: 0,
        }));
    };

    const handleLast = () => {
        const lastPageFirstIndex = Math.floor((totalRecords - 1) / lazyState.rows) * lazyState.rows;

        setlazyState(prevState => ({
            ...prevState,
            first: lastPageFirstIndex,
        }));
    };


    const handleNext = () => {
        if (lazyState.first + lazyState.rows < totalRecords) {
            setlazyState(prevState => ({
                ...prevState,
                first: prevState.first + prevState.rows,
            }));
            setSelectedOption([]); // Reset selection for new page
            setSelectAll(false);
        }
    };


    const handleRowsPerPageChange = (event) => {

        const selectedRows = Number(event.target.value);
        setRowsPerPage(selectedRows);
        setlazyState({
            ...lazyState,
            rows: selectedRows,
            first: 0 // Reset to first page
        });
        localStorage.setItem("rowsPerPage", selectedRows);
    };


    const handlePrev = () => {
        setlazyState(prevState => ({
            ...prevState,
            first: Math.max(prevState.first - prevState.rows, 0),
        }));

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
        // Clone to avoid mutating PrimeReact’s internal object
        const filters = { ...event.filters };

        //  Normalise order_type → number (or null)
        if (filters.order_type?.value !== null && filters.order_type?.value !== undefined) {
            const asInt = filters.order_type.value.toString();
            filters.order_type.value = isNaN(asInt) ? null : asInt;
        }

        //  Keep pagination in sync
        setlazyState({
            ...event,
            first: 0,          // reset to first page
            filters            // use our cleaned filter set
        });
    };

    // const onSelectionChange = (event) => { 
    //     const value = event.value;
    //     // console.log(value)
    //     setSelectedDelivery(value);
    //     setSelectAll(value.length === totalRecords);

    //     localStorage.setItem("selectedOrders", JSON.stringify(value));

    //     if (value.length === 0) {
    //         // Remove the next_cursor from localStorage when unchecking all
    //         localStorage.removeItem('next_cursor');
    //     } else {
    //         // Otherwise, store the next_cursor value in localStorage
    //         localStorage.setItem('next_cursor', nextCursor);
    //     }

    // };

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



    // const picklist_idBodyTemplate = (rowData) => {
    //     return (
    //         <>
    //             <Link to={`${rowData.id}/${rowData.pick_list_id}`}>{rowData.pick_list_id}</Link>
    //         </>
    //     );
    // };

    const picklist_idBodyTemplate = (rowData) => {
    const hasDetailAccess = hasPageAccess(Detail_Page_Key);

    return (
        <>
            {hasDetailAccess ? (
                <Link to={`${rowData.id}/${rowData.pick_list_id}`}>
                    {rowData.pick_list_id}
                </Link>
            ) : (
                rowData.pick_list_id
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

    // const statusBodyTemplate = (rowData) => {
    //     return (
    //         <>
    //             <Tag value={rowData.status} severity={getStatusSeverity(rowData.status)} />
    //         </>
    //     );
    // };

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
    const REflagTemplate = (option) => {
        return <Badge value={option.name} severity={getSeverityre(option.name)} />;
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
            <Dropdown style={{ minWidth: '3em', width: '4em' }} value={options.id} optionValue="id" optionLabel="order_type" options={orderAssignTypeDropdownlist} onChange={(e) => options.filterApplyCallback(e.value)} placeholder="Select One" className="p-column-filter" showClear />
        );
    };
    const statusRowFilterTemplate = (options) => {
        return (
            <Dropdown style={{ minWidth: '3em', width: '3em' }} value={options.name} optionValue="code" optionLabel="name" options={globalFlags} onChange={(e) => options.filterApplyCallback(e.value)} itemTemplate={REflagTemplate} placeholder="Select One" className="p-column-filter" showClear />
        );
    };
    const mantisImportedtatusRowFilterTemplate = (options) => {
        return (
            <Dropdown style={{ minWidth: '3em', width: '3em' }} value={options.name} optionValue="code" optionLabel="name" options={matisImportedFlags} onChange={(e) => options.filterApplyCallback(e.value)} itemTemplate={flagTemplate} placeholder="Select One" className="p-column-filter" showClear />
        );
    };
    const LocationRowFilterTemplate = (options) => {
        return (
            <Dropdown style={{ minWidth: '3em', width: '4em' }} value={options.name} optionValue="code" optionLabel="name" options={LocationFlags} onChange={(e) => options.filterApplyCallback(e.value)} itemTemplate={flagTemplate} placeholder="Select One" className="p-column-filter" showClear />
        );
    };
    const invalidStatusRowFilterTemplate = (options) => {
        return (
            <Dropdown style={{ minWidth: '3em', width: '3em' }} value={options.name} optionValue="code" optionLabel="name" options={globalFlags} onChange={(e) => options.filterApplyCallback(e.value)} itemTemplate={invalidFlagTemplate} placeholder="Select One" className="p-column-filter" showClear />
        );
    };
    const exportStatusRowFilterTemplate = (options) => {
        return (
            <Dropdown style={{ minWidth: '1em', width: '3em' }} value={options.name} optionValue="code" optionLabel="name" options={exportedFlags} onChange={(e) => options.filterApplyCallback(e.value)} itemTemplate={flagTemplate} placeholder="Select One" className="p-column-filter" showClear />
        );
    };

    // hide Sync Order button 
    const showSyncOrders = import.meta.env.VITE_SHOW_SYNC_ORDERS === "true";

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="flex mt-2 md:mt-0 p-input-icon-left">
                {actionItems.length > 0 && (<><i className="pi pi-search" />
                {/* <SplitButton label="Create Delivery" icon="pi pi-plus" onClick={() => setDisplayConfirmation3(true)} model={actionItems} /> */}
                <Menu model={actionItems} popup ref={menuLeft} id="popup_menu_left" />
                <Button label="Actions" icon="pi pi-align-left" className="mr-2" onClick={(event) => menuLeft.current.toggle(event)} aria-controls="popup_menu_left" aria-haspopup /> </>)}

                {/* <Button label="Create Delivery" icon="pi pi-plus" severity="sucess" className='mr-3' onClick={() => setDisplayConfirmation3(true)} /> */}
                {/* <Button label="Execute Orders" icon="pi pi-sync" severity="sucess" onClick={() => setDisplayConfirmation2(true)} /> */}
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


            <span className="block mt-2 md:mt-0 p-input-icon-left">
                <Tooltip
                    target=".disabled-sync-btn-wrapper"
                    content="It is not part of Phase-1 Plan"
                    position="top"
 
                />
 
                <span
                    className={
                        !showSyncOrders
                            ? "disabled-sync-btn-wrapper inline-block"
                            : "inline-block"
                    }
                >
                    {hasActionAccess(PAGE_KEY, "sync_orders") &&(<Button
                        label="Sync Orders"
                        icon="pi pi-sync"
                        severity="secondary"
                        disabled={!showSyncOrders}
                        onClick={() => setDisplaySyncConfirmation(true)}
                    />
                    )}
                </span>
                &nbsp;
                {hasActionAccess(PAGE_KEY, "upload") &&(<Button label="Upload" icon="pi pi-upload" severity="secondary" onClick={() => setDisplayConfirmation(true)} />)}
                &nbsp;
                {hasActionAccess(PAGE_KEY, "bulk_load_order") &&(<Button label="Bulk Load Order" icon="pi pi-upload" severity="secondary" onClick={() => setDisplayConfirmation19(true)} /> )}
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

        // then disable the select-all icon
        if (filteredOrders.length !== allSelectedOrders.length) {
            setSelectAll(false);
        } else {
            setSelectAll(true);
        }

        // COMMENT :: refresh the local storage Data 
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


    const status_orders = {
        1: '1-Pending',
        2: '2-Processing',
        3: '3-Completed'
    };

    const status_orders_details = {
        1: '1-Unprocessed',
        2: '2-MantisImported',
        3: '3-Execution(Mantis)',
        4: '3-Suspend(Mantis)',
        5: '4-Complete(Mantis)',
        6: 'Cancel(Mantis)',
        7: '5-DeliverySent',
        8: '6-DeliveryCreated',
        9: '7-DeliveryFailed',
        10: '8-PL_DeleteSent',
        11: '9-PL_Deleted',
        12: '10-PL_DeleteFailed'
    };
    const lvstatus = {
        1: 'In-Progress',
    };
    const fileUploadHandler = ({ files }) => {
        const [file] = files;
        uploadFile(file);
    };

    const loadOrderfileUploadHandler = ({ files }) => {
        const [file] = files;
        uploadLoadOrderFile(file);
    };

    const uploadLoadOrderFile = async (inputFile) => {
        setLoading(true);
        setDisplayConfirmation19(false);
        fileRef.clear();

        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const datas = new Uint8Array(e.target.result);
                const workbook = XLSX.read(datas, { type: 'array' });

                // Check sheet exists
                if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
                    showError("The Excel file does not contain any sheets.");
                    return;
                }

                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

                // Check completely blank file
                if (!rows || rows.length === 0) {
                    showError("No data found in the Excel file. Please provide at least one row with data.");
                    return;
                }

                // Validate header
                const header = rows[0]?.[0]?.toString().trim().toLowerCase();

                if (!header || header !== "picklist_id") {
                    showError("Invalid file format. Please upload a valid Bulk Order Import template.");
                    return;
                }

                // Extract picklist IDs
                const picklistIds = rows
                    .slice(1)
                    .map(row => row[0]?.toString().trim())
                    .filter(id => id);

                // Header exists but no data
                if (picklistIds.length === 0) {
                    showError("No valid picklist IDs found. Please provide at least one row with data.");
                    return;
                }

                const userName = JSON.parse(localStorage.getItem("user"))?.user?.name;
                const payload = { picklistIds, userName };

                const data = await OrdersImportService.loadOrderUploadData(payload);

                if (data?.error === 0) {
                    toast.current.show({
                        severity: 'success',
                        summary: 'File Upload',
                        detail: data.message
                    });
                    loadLazyData();
                } else {
                    showError(data?.message || "Something went wrong while processing the file.");
                }

            } catch (err) {
                console.error("Error processing file:", err);
                showError("Error reading file. Please upload a valid Excel file.");
            } finally {
                setLoading(false);
            }
        };

        reader.readAsArrayBuffer(inputFile);
    };

    // Common Error Function (Cleaner Code)
    const showError = (message) => {
        toast.current.show({
            severity: 'error',
            summary: 'File Upload',
            detail: message,
            sticky: true
        });

        setTimeout(() => {
            toast.current.clear();
        }, 800);
    };
    // const uploadLoadOrderFile = async (inputFile) => {

    //     let formData = new FormData();

    //     formData.append('test', 'inputFile');
    //     formData.append('inputFile', inputFile);
    //     console.log(Object.fromEntries(formData));
    //     fileRef.clear();
    //     setLoading(true);
    //     setDisplayConfirmation19(false);
    //     OrdersImportService.loadOrderUploadData( formData ).then((data) => {
    //         if(data.error == 0){

    //             toast.current.show({ severity: 'success', summary: 'File Upload', detail: data.message});
    //             loadLazyData()                

    //         } else{
    //             toast.current.show({ severity: 'error', summary: 'File Upload', detail: data.message, sticky: true});
    //             networkTimeout = setTimeout(() => {
    //                toast.current.clear();
    //             }, 3000);
    //         }

    //     });
    // };

    const uploadFile = async (inputFile) => {
        fileRef.clear();
        setLoading(true);
        setDisplayConfirmation(false);

        // Check if a file is selected
        if (!inputFile) {
            toast.current.show({
                severity: 'error',
                summary: 'Validation Error',
                detail: 'File is required.',
                sticky: true,
            });
            setLoading(false);
            networkTimeout = setTimeout(() => {
                toast.current.clear();
            }, 1500);
            return;
        }

        // Check for valid MIME types
        const validTypes = [
            'text/csv',
            'application/vnd.ms-excel', // .xls
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // .xlsx
        ];

        if (!validTypes.includes(inputFile.type)) {
            toast.current.show({
                severity: 'error',
                summary: 'Validation Error',
                detail: 'Invalid file type. Please upload a CSV, XLS, or XLSX file.',
                sticky: true,
            });
            setLoading(false);
            networkTimeout = setTimeout(() => {
                toast.current.clear();
            }, 1500);
            return;
        }

        const reader = new FileReader();

        reader.onload = async (e) => {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'binary' });

            const sheetName = workbook.SheetNames[2];
            const worksheet = workbook.Sheets[sheetName];

            // Convert sheet to JSON
            let jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

            // Check if the file only contains headers and no rows
            if (jsonData.length === 0) {
                toast.current.show({
                    severity: 'error',
                    summary: 'Validation Error',
                    detail: 'No data found in the Excel file. Please provide at least one row with data.',
                    sticky: true,
                });
                setLoading(false);
                networkTimeout = setTimeout(() => {
                    toast.current.clear();
                }, 1500);
                return;
            }

            // Add extra columns to each record 
            jsonData = jsonData.map((row) => ({
                ...row,
                order_code: row.order_code.toString(),
                item_reference: typeof row.item_reference === 'object' && row.item_reference !== null
                    ? row.item_reference.name || '' : (row.item_reference ?? '').toString(),
                status: status_orders[1],
                status_orders_details: status_orders_details[1],
            }));

            // Client-side validation (before sending to backend)
            for (let i = 0; i < jsonData.length; i++) {
                const row = jsonData[i];
                const rowNumber = i + 2;

                if (!row.picklist_id || row.picklist_id.trim() === '') {
                    toast.current.show({
                        severity: 'error',
                        summary: 'Validation Error',
                        detail: `picklist_id is missing from row ${rowNumber}`,
                        sticky: true,
                    });
                    setLoading(false);
                    networkTimeout = setTimeout(() => {
                        toast.current.clear();
                    }, 1500);
                    return;
                }

                if (!row.order_code || row.order_code === 0) {
                    toast.current.show({
                        severity: 'error',
                        summary: 'Validation Error',
                        detail: `order_code is missing from row ${rowNumber}`,
                        sticky: true,
                    });
                    setLoading(false);
                    networkTimeout = setTimeout(() => {
                        toast.current.clear();
                    }, 1500);
                    return;
                }
            }
            //console.log('Final JSON with extra columns:', jsonData);
            OrdersImportService.uploadData(jsonData).then((data) => {
                if (data.error === 0) {
                    toast.current.show({
                        severity: 'success',
                        summary: 'File Upload',
                        detail: data.message || 'Upload successful',
                        life: 3000 // optional auto-close
                    });

                    OrdersImportService.getOrdersGrid(lazyState).then((data) => {
                        setTotalRecords(data.totalRecords);
                        setOrders(data.data);
                        setTemplateUrl(data.template_url);
                        setLoading(false);
                    });
                    networkTimeout = setTimeout(() => {
                        toast.current.clear();
                    }, 1500);
                } else {
                    toast.current.show({
                        severity: 'error',
                        summary: 'File Upload Failed',
                        detail: data.message || 'An unknown error occurred during upload.',
                        sticky: true
                    });
                    setLoading(false);

                    networkTimeout = setTimeout(() => {
                        toast.current.clear();
                    }, 1500);
                }
            })
            //.catch((err) => {
            //     toast.current.show({
            //         severity: 'error',
            //         summary: 'File Upload Error',
            //         detail: err.message || 'Network or server error occurred.',
            //         sticky: true
            //     });
            //     setLoading(false);
            //     networkTimeout = setTimeout(() => {
            //         toast.current.clear();
            //     }, 1500);
            // });
        }

        reader.onerror = (error) => {
            console.error('File reading error:', error);
            toast.current.show({
                severity: 'error',
                summary: 'File Read Error',
                detail: 'Failed to read file',
                sticky: true
            });
            setLoading(false);
            networkTimeout = setTimeout(() => {
                toast.current.clear();
            }, 1500);
        };

        reader.readAsBinaryString(inputFile);
    };


    const orderExecution = () => {
        setDisplayConfirmation2(false)
        setLoading(true);
        // console.log(selectedDelivery);
        OrdersImportService.orderExecution(selectedDelivery).then((data) => {
            setLoading(false);
            if (data.error == 0) {
                loadLazyData();
                setSelectAll(false);
                setSelectedDelivery([]);
                toast.current.show({ severity: 'success', summary: 'Success Message', detail: data.message, life: 3000 });
            } else {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
        });
    }
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
    const cancelOrders = () => {
        setCancelOrderDisplayConfirmation(false)
        setLoading(true);
        // console.log(selectedDelivery);
        const pick_list_ids = selectedDelivery.map(item => item.pick_list_id);
        const data = { ids: pick_list_ids }
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
    const orderLoad = () => {
        setDisplayConfirmation8(false)
        setDisplayConfirmation20(false)
        setLoading(true);
        const userName = JSON.parse(localStorage.getItem("user"))?.user?.name;
        const payload = {
            selectedDelivery,
            userName
        }
        OrdersImportService.orderLoad(payload).then((data) => {
            setLoading(false);
            if (data.error == 0) {
                loadLazyData();
                setSelectAll(false);
                setSelectedDelivery([]);
                toast.current.show({ severity: 'success', summary: 'Success Message', detail: data.message, life: 3000 });
            } else {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
        });
    }

    const confirmationDialogFooter = (
        <>

            <Button type="button" label="Close" icon="pi pi-times" onClick={() => setDisplayConfirmation(false)} className="p-button-text" />
        </>
    );
    const confirmationDialogFooter19 = (
        <>

            <Button type="button" label="Close" icon="pi pi-times" onClick={() => setDisplayConfirmation19(false)} className="p-button-text" />
        </>
    );

    const confirmationDialogFooter2 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation2(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => orderExecution()} className="p-button-text" autoFocus />
        </>
    );
    const cancelOrderConfirmationDialogFooter = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setCancelOrderDisplayConfirmation(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => cancelOrders()} className="p-button-text" autoFocus />
        </>
    );
    const confirmationDialogFooter3 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation3(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => deliveryCreation()} className="p-button-text" autoFocus />
        </>
    );
    const confirmationDialogFooter4 = (
        <div>
            <Button label="Submit" disabled={btnDisabled} icon="pi pi-check" onClick={() => onSubmitUser()} />
        </div>
    );

    const confirmationDialogFooter5 = (
        <div>
            <Button label="Submit" disabled={btnDisabled} icon="pi pi-check" onClick={() => onSubmitLocation()} />
        </div>
    );

    const confirmationDialogFooter6 = (
        <div>
            <Button label="Submit" disabled={btnDisabled} icon="pi pi-check" onClick={() => onSubmitLanes()} />
        </div>
    );

    const confirmationDialogFooter7 = (
        <div>
            <Button label="Submit" disabled={btnDisabled} icon="pi pi-check" onClick={() => onSubmitUserLoc()} />
        </div>
    );

    const confirmationDialogFooter8 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation8(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => orderLoad()} className="p-button-text" autoFocus />
        </>
    );

    const confirmationDialogFooter20 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation20(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => orderLoad()} className="p-button-text" autoFocus />
        </>
    );

    const confirmationDialogFooter9 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation9(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => manualDetailsSync()} className="p-button-text" autoFocus />
        </>
    );

    const confirmationDialogFooter10 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation10(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => markOrderManualComplete()} className="p-button-text" autoFocus />
        </>
    );

    const confirmationDialogFooter11 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation11(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => markOrderStatusComplete()} className="p-button-text" autoFocus />
        </>
    );
    const confirmationDialogFooter12 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation12(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => releaseLoction()} className="p-button-text" autoFocus />
        </>
    );
    const confirmationDialogFooter13 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation13(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => releaseLoction(true)} className="p-button-text" autoFocus />
        </>
    );
    const confirmationDialogFooter14 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation14(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => reexecuteOrder()} className="p-button-text" autoFocus />
        </>
    );
    const confirmationDialogFooter15 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation15(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => appendOrder()} className="p-button-text" autoFocus />
        </>
    );

    const confirmationDialogFooter16 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation16(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => archiveCompeletedOrder()} className="p-button-text" autoFocus />
        </>
    );
    const confirmationDialogFooter17 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation17(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => deleteOrder()} className="p-button-text" autoFocus />
        </>
    );
    const confirmationDialogFooter18 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation18(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => markNotReRun()} className="p-button-text" autoFocus />
        </>
    );
    const confirmationDialogFooterRerun = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmationRerun(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => rerunFailedJobs()} className="p-button-text" autoFocus />
        </>
    );
    const confirmationDialogFooterRerunPick = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmationRerunPick(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => PickListDetail()} className="p-button-text" autoFocus />
        </>
    );
    const confirmationDialogFooterSync = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplaySyncConfirmation(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => syncOrders()} className="p-button-text" autoFocus />
        </>
    );
    const multiselectFooterTemplate = () => {
        const length = selectedLocations ? selectedLocations.length : 0;

        return (
            <div className="py-2 px-3">
                <b>{length}</b> item{length > 1 ? 's' : ''} selected.
            </div>
        );
    };


    const manualDetailsSync = () => {

        // setbtnDisabled(true);
        data = {
            order: selectedDelivery,
        }
        // console.log(data)
        setDisplayConfirmation9(false)
        setLoading(true);

        OrdersImportService.manualDetailsSync((data)).then((data) => {
            // setbtnDisabled(false);

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

        });

    };

    const onSubmitUser = () => {

        setbtnDisabled(true);
        data = {
            orders: selectedDelivery,
            user: selectedUser,
            uom: assigntouseruom,
        }
        // console.log(data)
        OrdersImportService.assignUser((data)).then((data) => {
            setLoading(false);
            if (data.error == 0) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message });
                setSelectAll(false);
                setSelectedDelivery([]);
                // getItems(zoneDetail.zon_Description);
            }
            else {
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message });
            }
            setbtnDisabled(false);
            setDisplayConfirmation4(false)
        });

    };

    const onSubmitUserLoc = () => {


        setbtnDisabled(true);
        data = {
            orders: selectedDelivery,
            user: selectedUser,
            uom: assigntouseruom,
            locations: selectedLocations,
            no_of_pallets: selectedLocationLimit.toString(),
            order_type: selectedOrderType,
            assigned_type: 1,
        }
        // console.log(data)
        OrdersImportService.assignUserLoc((data)).then((data) => {
            setLoading(false);

            if (data.error == 0) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message });
                setSelectAll(false);
                setSelectedDelivery([]);
                loadLazyData();
                // getItems(zoneDetail.zon_Description);
            }
            else {
                setSelectAll(false);
                setSelectedDelivery([]);
                setbtnDisabled(false);
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message });
            }
            setbtnDisabled(false);
            setDisplayConfirmation7(false)
        });

    };

    const onSubmitLocation = () => {

        setbtnDisabled(true);
        data = {
            order: selectedDelivery,
            locations: selectedLocations,
        }
        // console.log(data)
        OrdersImportService.assignLocations((data)).then((data) => {
            setLoading(false);
            if (data.error == 0) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message });
                setSelectAll(false);
                setSelectedDelivery([]);
                loadLazyData();
                // getItems(zoneDetail.zon_Description);
            }
            else {
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message });
            }
            setbtnDisabled(false);
            setDisplayConfirmation5(false)
        });

    };

    const onSubmitLanes = () => {

        setbtnDisabled(true);
        data = {
            order: selectedDelivery,
            lanes: selectedLanes,
        }
        OrdersImportService.assignLanes((data)).then((data) => {
            setLoading(false);
            if (data.error == 0) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message });
                setSelectAll(false);
                setSelectedDelivery([]);
                loadLazyData();
            }
            else {
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message });
            }
            setbtnDisabled(false);
            setDisplayConfirmation6(false)
        });

    };

    const markOrderManualComplete = () => {
        setLoading(true);
        setbtnDisabled(true);
        data = {
            orders: selectedDelivery,
        }

        setDisplayConfirmation10(false)
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

    const releaseLoction = (flag = false) => {

        setLoading(true);
        setbtnDisabled(true);
        if (selectedDelivery[0].is_location_assigned == 0) {
            setLoading(false);
            setbtnDisabled(false);
            setDisplayConfirmation12(false)
            toast.current.show({ severity: 'error', summary: 'Error', detail: "Location is not assigned." });
            return false;
        }
        data = {
            order: selectedDelivery[0],
            flag: flag
        }

        setDisplayConfirmation12(false);
        setDisplayConfirmation13(false);
        OrdersImportService.releaseLoction((data)).then((data) => {

            if (data.error == 0) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message });
                setSelectAll(false);
                setSelectedDelivery([]);
                loadLazyData();
            }
            else {
                if (data?.error == 1) {
                    setLoading(false);
                    setbtnDisabled(false);
                    setDisplayConfirmation13(true);
                }
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message });
            }
            setLoading(false);
            setbtnDisabled(false);

        });
    };

    const reexecuteOrder = () => {

        setLoading(true);
        setbtnDisabled(true);

        data = {
            orders: selectedDelivery,
        }


        OrdersImportService.reexecuteOrder((data)).then((data) => {

            if (data.error == 0) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message });
                setSelectAll(false);
                setSelectedDelivery([]);
                loadLazyData();
            }
            else {
                if (data?.code == 409) {
                    setLoading(false);
                    setbtnDisabled(false);

                }
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message });
            }
            setDisplayConfirmation14(false);
            setLoading(false);
            setbtnDisabled(false);

        });
    };

    const markNotReRun = () => {

        setLoading(true);
        setbtnDisabled(true);

        data = {
            orders: selectedDelivery,
        }


        OrdersImportService.markNotReRun((data)).then((data) => {

            if (data.error == 0) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message });
                setSelectAll(false);
                setSelectedDelivery([]);
                loadLazyData();
            }
            else {
                if (data?.code == 409) {
                    setLoading(false);
                    setbtnDisabled(false);

                }
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message });
            }
            setDisplayConfirmation18(false);
            setLoading(false);
            setbtnDisabled(false);

        });
    };
    const archiveCompeletedOrder = () => {

        setLoading(true);
        setbtnDisabled(true);
        OrdersImportService.archiveCompeletedOrder().then((data) => {

            if (data.error == 0) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message });
                setSelectAll(false);
                setSelectedDelivery([]);
                loadLazyData();
            }
            else {

                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message });
            }
            setDisplayConfirmation16(false);
            setLoading(false);
            setbtnDisabled(false);

        });
    }

    const deleteOrder = () => {

        setLoading(true);
        setbtnDisabled(true);
        const ids = selectedDelivery.map(item => item.id);
        const data = { orderIds: ids };
        // Check if any selected item is imported
        const hasImported = selectedDelivery.some(item => item.mantis_imported == 1);

        if (hasImported) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Imported orders cannot be deleted.' });
            setLoading(false);
            setbtnDisabled(false);
            return;
        }
        OrdersImportService.deleteOrder((data)).then((data) => {

            if (data.error == 0) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message });

                // ✅ Remove deleted orders from localStorage
                const allSelectedOrders = JSON.parse(localStorage.getItem("selectedOrders")) || [];
                const updatedOrders = allSelectedOrders.filter(order => !ids.includes(order.id));
                localStorage.setItem("selectedOrders", JSON.stringify(updatedOrders))


                // Also clear next_cursor if no orders left
                if (updatedOrders.length === 0) {
                    localStorage.removeItem("next_cursor");
                }

                setSelectAll(false);
                setSelectedDelivery([]);
                loadLazyData();
            }
            else {

                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message });
            }
            setDisplayConfirmation17(false);
            setLoading(false);
            setbtnDisabled(false);

        });
    }
    const appendOrder = () => {

        setLoading(true);
        setbtnDisabled(true);

        data = {
            orders: selectedDelivery,
        }


        OrdersImportService.appendOrders((data)).then((data) => {

            if (data.error == 0) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message });
                setSelectAll(false);
                setSelectedDelivery([]);
                loadLazyData();
            }
            else {
                if (data?.code == 409) {
                    setLoading(false);
                    setbtnDisabled(false);

                }
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message });
            }
            setDisplayConfirmation15(false);
            setLoading(false);
            setbtnDisabled(false);

        });
    };

    const assignOrderTypeFun = () => {

        if (assignSelectedOrderType === undefined || assignSelectedOrderType == null || assignSelectedOrderType.length <= 0) {
            toast.current.show({ severity: 'error', summary: 'Error', detail: "Select Order Type" });
            return false;
        }
        setLoading(true);

        data = {
            orders: selectedDelivery,
            order_type: assignSelectedOrderType
        }

        setOrderTypepopup(false)
        OrdersImportService.assignOrderType((data)).then((data) => {

            if (data.error == 0) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message });
                setSelectAll(false);
                setSelectedDelivery([]);
                setassignSelectedOrderType(null);
                loadLazyData();
            }
            else {
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message });
            }
            setLoading(false);


        });
    };

    const markOrderStatusComplete = () => {
        setLoading(true);
        setbtnDisabled(true);
        data = {
            orders: selectedDelivery,
        }

        setDisplayConfirmation11(false)
        OrdersImportService.orderStatusComplete((data)).then((data) => {

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

    const rerunFailedJobs = () => {
        setLoading(true);
        const payload = {
            orders: selectedDelivery,
            failJobs: 'fail-jobs'
        };

        OrdersImportService.deliveryCreation(payload).then((data) => {
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
    const userId = JSON.parse(localStorage.getItem("user"))?.user?.id;
    const userEmail = JSON.parse(localStorage.getItem("user"))?.user?.email;
    const PickListDetail = () => {
        setLoading(true);
        const payload = {
            orders: selectedDelivery.map(order => order.pick_list_id),
            userName : userName,
            userId: userId,
            userEmail: userEmail
        };

        OrdersImportService.getPickListDetail(payload).then((data) => {
            setLoading(false);
            if (data.error === 0) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message });
                setSelectAll(false);
                setSelectedDelivery([]);
                loadLazyData();
            } else {
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message });
            }
            setDisplayConfirmationRerunPick(false);
        });
    };

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
                {/* <div className="m-0">
                    <div className="flex flex-column px-8 py-5 gap-4" style={{ borderRadius: '12px', backgroundColor: '#f9f9f9' }}>
                        {modelMsg !== '' ? (<p className="p-error font-semibold">{modelMsg}</p>) : ''}
                    </div>
                </div> */}

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
            <Dialog header="Upload" visible={displayConfirmation19} onHide={() => setDisplayConfirmation19(false)} style={{ width: '550px' }} modal footer={confirmationDialogFooter19}>
                <Link to={bulkOrderTemplateUrl} >Download Template</Link>
                <h1></h1>
                <FileUpload name="file[]"
                    ref={(el) => fileRef = el}
                    customUpload={true}
                    uploadHandler={loadOrderfileUploadHandler}
                    accept=".xls,.csv,.xlsx"
                    maxFileSize={10000000000}
                    emptyTemplate={<p className="m-0">Drag and drop file here to upload.</p>}
                />
            </Dialog>
            <Dialog header="Confirmation" visible={displayConfirmationRerun} onHide={() => setDisplayConfirmationRerun(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooterRerun}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to rerun the failed jobs?</span>
                </div>
            </Dialog>
            <Dialog header="Confirmation" visible={displayConfirmationRerunPick} onHide={() => setDisplayConfirmationRerunPick(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooterRerunPick}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to get the Picklist details?</span>
                </div>
            </Dialog>
            <Dialog header="Upload" visible={displayConfirmation} onHide={() => setDisplayConfirmation(false)} style={{ width: '550px' }} modal footer={confirmationDialogFooter}>
                <Link to={templateUrl} >Download Template</Link>
                <h1></h1>
                <FileUpload name="file[]"
                    ref={(el) => fileRef = el}
                    customUpload={true}
                    uploadHandler={fileUploadHandler}
                    accept=".xls,.csv,.xlsx"
                    maxFileSize={10000000000}
                    emptyTemplate={<p className="m-0">Drag and drop file here to upload.</p>}
                />
            </Dialog>
            <Dialog header="Confirmation" visible={displayConfirmation2} onHide={() => setDisplayConfirmation2(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter2}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to proceed?</span>
                </div>
            </Dialog>
            <Dialog header="Confirmation" visible={cancelOrderDisplayConfirmation} onHide={() => cancelOrderDisplayConfirmation(false)} style={{ width: '350px' }} modal footer={cancelOrderConfirmationDialogFooter}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to proceed?</span>
                </div>
            </Dialog>
            <Dialog header="Confirmation" visible={displayConfirmation9} onHide={() => setDisplayConfirmation9(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter9}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to proceed?</span>
                </div>
            </Dialog>
            <Dialog header="Confirmation" visible={displayConfirmation3} onHide={() => setDisplayConfirmation3(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter3}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to proceed?</span>
                </div>
            </Dialog>
            <Dialog header="Confirmation" visible={displaySyncConfirmation} onHide={() => setDisplaySyncConfirmation(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooterSync}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to sync orders?</span>
                </div>
            </Dialog>
            <Dialog header="Select Order Type" visible={orderTypepopup} onHide={() => setOrderTypepopup(false)} style={{ width: '350px' }} modal>
                <div className="flex align-items-center justify-content-center">

                    <Dropdown
                        style={{ marginRight: 5, marginLeft: 10 }}
                        value={assignSelectedOrderType}
                        optionValue="id"
                        optionLabel="order_type"
                        onChange={(e) => {
                            setassignSelectedOrderType(e.value)

                        }}
                        options={orderAssignTypeDropdownlist}
                        placeholder="Select Order Type"
                        filter={true}
                    />

                    <span className="block mt-2 md:mt-0 p-input-icon-left">
                        <Button label="Assign" icon="pi pi-plus" severity="secondary" onClick={() => assignOrderTypeFun()} />
                    </span>
                </div>
            </Dialog>
            <Dialog header="Assign Locations" visible={displayConfirmation5} style={{ width: '50vw' }} onHide={() => setDisplayConfirmation5(false)} footer={confirmationDialogFooter5}>
                <div className="p-fluid formgrid grid">
                    <div className="field col-12 md:col-9">
                        <label>No of Pallets*</label>
                        <InputNumber
                            value={selectedLocationLimit}
                            min={1}
                            onChange={(e) => {
                                setSelectedLocationLimit(e.value)
                            }}
                            required={true}
                        />
                    </div>
                    <div className="field col-12 md:col-9">
                        <label>Locations*</label>
                        <MultiSelect
                            // style={{marginRight:5, marginLeft:10}} 
                            value={selectedLocations}
                            optionValue="id"
                            optionLabel="loc_Code"
                            display="comma"
                            onChange={(e) => {
                                setSelectedLocations(e.value)
                                setbtnDisabled(false)
                            }}
                            panelFooterTemplate={multiselectFooterTemplate}
                            options={shippingLocations}
                            placeholder="Select Locations"
                            filter={true}
                            selectionLimit={selectedLocationLimit}
                            showSelectAll={false}
                        // optionDisabled={}
                        />
                    </div>
                </div>
            </Dialog>
            <Dialog header="Assign User" visible={displayConfirmation4} style={{ width: '50vw' }} onHide={() => setDisplayConfirmation4(false)} footer={confirmationDialogFooter4}>
                <div className="p-fluid formgrid grid">
                    <div className="field col-12 md:col-9">
                        <label>Users*</label>
                        <Dropdown
                            style={{ marginRight: 5, marginLeft: 10 }}
                            value={selectedUser}
                            optionValue="emp_ID"
                            optionLabel="Name"
                            onChange={(e) => {
                                setSelectedUser(e.value)
                                setbtnDisabled(false)
                            }}
                            options={usersDropdownlist}
                            placeholder="Select User"
                            filter={true}
                        />
                    </div>
                </div>
            </Dialog>

            <Dialog header="Assign User" visible={displayConfirmation7} style={{ width: '50vw' }} onHide={() => setDisplayConfirmation7(false)} footer={confirmationDialogFooter7}>
                <div className="p-fluid formgrid grid">
                    <div className="field col-12 md:col-9">
                        <label>Users*</label>
                        <Dropdown
                            style={{ marginRight: 5, marginLeft: 10 }}
                            value={selectedUser}
                            optionValue="emp_ID"
                            optionLabel="Name"
                            onChange={(e) => {
                                setSelectedUser(e.value)
                                setbtnDisabled(false)
                            }}
                            options={usersDropdownlist}
                            placeholder="Select User"
                            filter={true}
                        />
                    </div>
                    {(selectedDelivery == null || selectedDelivery.length == 0 || (selectedDelivery[0].is_location_assigned == 0 || selectedDelivery[0].is_location_assigned == 3)) ?
                        <div className="field col-12 md:col-9">
                            <label>No of Pallets*</label>
                            <InputNumber
                                value={selectedLocationLimit}
                                min={1}
                                onChange={(e) => {
                                    setSelectedLocationLimit(e.value)
                                }}
                                required={true}
                            />
                        </div>
                        : ''}
                    {/* <div className="field col-12 md:col-9">
                        <label>Order Type*</label>
                        <Dropdown 
                            style={{marginRight:5, marginLeft:10}} 
                            value={selectedOrderType}
                            optionValue="order_type_code" 
                            optionLabel="order_type" 
                            onChange={(e) => {
                                setSelectedOrderType(e.value)     
                                setbtnDisabled(false)                           
                            }} 
                            options={orderAssignTypeDropdownlist} 
                        
                            filter={true}
                        />
                    </div> */}
                    {(selectedDelivery == null || selectedDelivery.length == 0 || selectedDelivery[0].is_location_assigned == 0) ?
                        // <div className="field col-12 md:col-9">
                        //     <label>Locations*</label>
                        //     <MultiSelect  
                        //         // style={{marginRight:5, marginLeft:10}} 
                        //         value={selectedLocations}
                        //         optionValue="id" 
                        //         optionLabel="loc_Code" 
                        //         display="comma"
                        //         onChange={(e) => {
                        //             setSelectedLocations(e.value)
                        //             setbtnDisabled(false) 
                        //         }} 
                        //         panelFooterTemplate={multiselectFooterTemplate}
                        //         options={shippingLocations} 
                        //         placeholder="Select Locations"  
                        //         filter={true}
                        //         selectionLimit={selectedLocationLimit}
                        //         showSelectAll={false}
                        //         // optionDisabled={}
                        //     />
                        // </div>
                        <span></span>
                        : ''}
                </div>
            </Dialog>

            <Dialog header="Assign Lanes" visible={displayConfirmation6} style={{ width: '50vw' }} onHide={() => setDisplayConfirmation6(false)} footer={confirmationDialogFooter6}>
                <div className="p-fluid formgrid grid">
                    <div className="field col-12 md:col-9">
                        <p>Number of Pallets: <b>{noOfPallets}</b></p>

                        <label>Lanes*</label>
                        <MultiSelect
                            // style={{marginRight:5, marginLeft:10}} 
                            value={selectedLanes}
                            optionValue="lane"
                            optionLabel="lane_count"
                            display="chip"
                            onChange={(e) => {
                                setSelectedLanes(e.value)
                                setbtnDisabled(false)
                            }}
                            panelFooterTemplate={multiselectFooterTemplate}
                            options={laneslist}
                            placeholder="Select Lanes"
                            filter={true}
                            showSelectAll={false}
                        // optionDisabled={}
                        />
                    </div>
                </div>
            </Dialog>
            <Dialog header="Confirmation" visible={displayConfirmation20} onHide={() => setDisplayConfirmation20(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter20}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <div class="confirmation-text">
                        <div class="upper-text">
                            Items without executed tasks will be canceled.
                            The load order will proceed with executed items.
                        </div>
                        <div class="lower-text">
                            Are you sure you want to proceed?
                        </div>
                    </div>
                </div>
            </Dialog>
            <Dialog header="Confirmation" visible={displayConfirmation8} onHide={() => setDisplayConfirmation8(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter8}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to proceed?</span>
                </div>
            </Dialog>
            <Dialog header="Confirmation" visible={displayConfirmation10} onHide={() => setDisplayConfirmation10(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter10}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to proceed?</span>
                </div>
            </Dialog>
            <Dialog header="Confirmation" visible={displayConfirmation11} onHide={() => setDisplayConfirmation11(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter11}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to proceed?</span>
                </div>
            </Dialog>
            <Dialog header="Confirmation" visible={displayConfirmation12} onHide={() => setDisplayConfirmation12(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter12}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to proceed?</span>
                </div>
            </Dialog>
            <Dialog header="Confirmation" visible={displayConfirmation14} onHide={() => setDisplayConfirmation14(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter14}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to proceed?</span>
                </div>
            </Dialog>
            <Dialog header="Confirmation" visible={displayConfirmation15} onHide={() => setDisplayConfirmation15(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter15}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to proceed?</span>
                </div>
            </Dialog>
            <Dialog header="Confirmation" visible={displayConfirmation16} onHide={() => setDisplayConfirmation16(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter16}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to proceed?</span>
                </div>
            </Dialog>
            <Dialog header="Confirmation" visible={displayConfirmation17} onHide={() => setDisplayConfirmation17(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter17}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to proceed?</span>
                </div>
            </Dialog>
            <Dialog header="Confirmation" visible={displayConfirmation18} onHide={() => setDisplayConfirmation18(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter18}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to proceed?</span>
                </div>
            </Dialog>
            <Dialog header="Confirmation" visible={displayConfirmation13} onHide={() => setDisplayConfirmation13(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter13}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Order is not completely transferred! Do you still want to release shipment locations?</span>
                </div>
            </Dialog>
            <h1></h1>
            <div className="card">
                <h3>Orders</h3>
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
                    <Column field="pallet_count" headerStyle={{ width: '4rem' }} header="Pallet Count" body={palletCountBodyTemplate} />

                    <Column field="created_at" sortable header="Created At" headerStyle={{ width: '14rem' }} body={created_atBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />

                    <Column field="lv_status" sortable header="Status" body={lv_statusBodyTemplate} showFilterMenu={false} filter filterElement={lvStatusRowFilterTemplate} />

                    <Column field="mantis_imported" header="Mantis Imported" body={mantis_importedBodyTemplate} filter showFilterMenu={false} filterElement={mantisImportedtatusRowFilterTemplate} />
                    <Column field="invalid_items" header="Invalid Items" body={invalid_itemsBodyTemplate} filter showFilterMenu={false} filterElement={invalidStatusRowFilterTemplate} />
                    {/* <Column field="api_export"  header="Api Export" body={api_exportBodyTemplate}  /> */}
                    <Column field="is_exported" header="Is Exported" body={is_exportedBodyTemplate} filter showFilterMenu={false} filterElement={exportStatusRowFilterTemplate} />

                    <Column field="is_location_assigned" header="Ship Loc Status" body={is_location_assignedBodyTemplate} filter showFilterMenu={false} filterElement={LocationRowFilterTemplate} />

                    <Column field="is_sync" header="Is Detail Synced" body={is_syncBodyTemplate} />
                    <Column field="order_type" header="Order Type" body={orderTypedBodyTemplate} showFilterMenu={false} filter filterElement={OrderTypeRowFilterTemplate} />
                    <Column field="ReExecute" header="Re Execute" body={reExecuteBodyTemplate} filter showFilterMenu={false} filterElement={statusRowFilterTemplate} />

                    <Column field="total" header="Total Task" body={TaskAssignBodyTemplate} filter showFilterMenu={false} filterPlaceholder="Search" />
                    <Column field="assigned" header="Task Assign" body={TaskUserBodyTemplate} filter showFilterMenu={false} filterPlaceholder="Search" />
                    <Column field="completed" header="Task Completion" body={TaskCompletionBodyTemplate} />

                </DataTable>
                <div className="pagination-container flex justify-center items-center p-2 border-t mt-4">


                    {/* Right Side - Navigation controls */}
                    {/* <div className="flex items-center space-x-2">
      <button onClick={handleFirst} disabled={lazyState.first === 0} className='pagination-button'>
            <i className="fas fa-angle-double-left"></i>
        </button>
        <button onClick={handlePrev} disabled={!prevCursor || loading || lazyState.first === 0} className='pagination-button'>
            <i className="fas fa-chevron-left"></i>
        </button>

        <span className="text-sm pagination-center mx-2">
            Page {Math.floor(lazyState.first / lazyState.rows) + 1} of {Math.ceil(totalRecords / lazyState.rows) || 1}
        </span>

        <button onClick={handleNext} disabled={!nextCursor || loading || lazyState.first + lazyState.rows >= totalRecords} className='pagination-button'>
            <i className="fas fa-chevron-right"></i>
        </button>

           <button onClick={handleLast} disabled={lazyState.first + lazyState.rows >= totalRecords} className='pagination-button'>
            <i className="fas fa-angle-double-right"></i>
        </button>

          <div className="text-sm showing-total mx-4 text-gray-700">
        {totalRecords > 0 ? (
            <>
                Showing {lazyState.first + 1}–{Math.min(lazyState.first + lazyState.rows, totalRecords)} of {totalRecords} Records
            </>
        ) : (
            <>No Records</>
        )}
    </div>

        <select value={rowsPerPage} onChange={handleRowsPerPageChange} className='pagination-select-box ml-2'>
            {rowsOptions.map((option) => (
                <option key={option} value={option}>{option}</option>
            ))}
        </select>
    </div> */}

                </div>

            </div>
        </>

    );
}
