
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ShipmentsService } from '../../../../service/inbound/ShipmentService';
import { Link } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Badge } from 'primereact/badge';
import { Helmet } from 'react-helmet';
import titles from '../../../titles';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { Menu } from 'primereact/menu';
import { Dropdown } from 'primereact/dropdown';
import '../../../../assets/styles.css';
import { OverlayPanel } from 'primereact/overlaypanel';
import { ManualContainersService } from '../../../../service/inbound/ManualContainerService';
import { useLazySort } from '../../../../components/useLazySort';
import { Tooltip } from 'primereact/tooltip';
import { useAuth } from '../../../../store/useAuth';



export default function Shipments() {
    const { hasActionAccess } = useAuth();
    const PAGE_KEY = "inbound_shipments";
    const { hasPageAccess } = useAuth();
    const Detail_PAGE_KEY = "Shipment_Details";
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [shipments, setShipments] = useState(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedShipments, setSelectedShipments] = useState([]);
    const [dates, setDates] = useState(null);
    const [displayConfirmation, setDisplayConfirmation] = useState(false);
    const [displayConfirmation1, setDisplayConfirmation1] = useState(false);
    const menuLeft = useRef(null);
    const [btnDisabled, setbtnDisabled] = useState(false);
    const [nextCursor, setNextCursor] = useState(null);
    const [prevCursor, setPrevCursor] = useState(null);
    const [RemoveReservationDisplayConfirmation, setRemoveReservationDisplayConfirmation] = useState(false);
    const [markReceiptCompleteDisplayConfirmation, setMarkReceiptCompleteDisplayConfirmation] = useState(false);
    const [apiSuccess, setApiSuccess] = useState(false);
    const [createContainerDetailDisplayConfirmation, setCreateContainerDetailDisplayConfirmation] = useState(false);


    let data = {};
    const toast = useRef();
    const op = useRef(null);

    const globalFlags = [
        { code: '1', name: 'Yes' },
        { code: '0', name: 'No' },
    ];
    const InvglobalFlags = [
        { code: '1', name: 'Yes' },
        { code: '0', name: 'No' },
    ];
    const rowsOptions = [10, 25, 50, 100];
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 25,
        page: 1,
        sortField: "",
        sortOrder: "",
        cursor: null,
        filters: {
            ship_num: { value: null, matchMode: 'contains' },
            ship_uid: { value: null, matchMode: 'contains' },
            ctrnum: { value: null, matchMode: 'contains' },
            ship_dat: { value: null, matchMode: 'contains' },
            create_dat_tim: { value: null, matchMode: 'contains' },
            fcy: { value: null, matchMode: 'contains' },
            bpsnum: { value: null, matchMode: 'contains' },
            expected_at: { value: null, matchMode: 'contains' },
            is_sync: { value: null, matchMode: 'contains' },
            synced_at: { value: null, matchMode: 'contains' },
            status: { value: null, matchMode: 'contains' },
            invalid_items: { value: null, matchMode: 'contains' },
            is_conveyable: { value: null, matchMode: 'contains' },
            mantis_imported_h: { value: null, matchMode: 'contains' },
            import_ready: { value: null, matchMode: 'contains' },
            invalid_items: { value: null, matchMode: 'contains' },

        }
    });
    const { onSort } = useLazySort(setlazyState);

    const globalRowFilterTemplate = (options) => {
        return (
            <Dropdown style={{ minWidth: '3em', width: '3em' }} value={options.name}
                optionValue="code" optionLabel="name" options={globalFlags}
                onChange={(e) => options.filterApplyCallback(e.value)}
                itemTemplate={flagTemplate} placeholder="Select" className="p-column-filter" showClear />
        );
    };
    const InvglobalRowFilterTemplate = (options) => {
        return (
            <Dropdown style={{ minWidth: '3em', width: '3em' }} value={options.name}
                optionValue="code" optionLabel="name" options={InvglobalFlags}
                onChange={(e) => options.filterApplyCallback(e.value)}
                itemTemplate={InvflagTemplate} placeholder="Select" className="p-column-filter" showClear />
        );
    };

    const [rowsPerPage, setRowsPerPage] = useState(10);
    const handleRowsPerPageChange = (event) => {
        const selectedRows = Number(event.target.value);
        setRowsPerPage(selectedRows);
        setlazyState(prevState => ({
            ...prevState,
            rows: selectedRows
        }));
    };
    const removeReservation = () => {
        data = {
            containers: selectedShipments,

        }
        ManualContainersService.removeReservation(data).then((data) => {
            setLoading(false);
            if (data.error == 0) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message });
                setSelectAll(false);
                setSelectedShipments([]);

                loadLazyData();
            }
            else {
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message });
            }
            setbtnDisabled(false);
            setRemoveReservationDisplayConfirmation(false)

        });


    };
    const items = [{ label: 'Receipt' }, { label: 'Shipments' }];
    const home = { icon: 'pi pi-home', url: '/' }
    const flagTemplate = (option) => {
        return <Badge value={option.name} severity={getSeverity(option.name)} />;
    };
    const InvflagTemplate = (option) => {
        return <Badge value={option.name} severity={getSeverityinv(option.name)} />;
    };
    let networkTimeout = null;

    const getStatusSeverity = (status) => {
        if (status) {
            if (status.includes('Unsyned')) {
                return 'danger';
            } else if (status.includes('Synced')) {
                return 'success';
            } else {
                return 'info';
            }
        }
    };

    const getSeverity = (flag) => {
        switch (flag) {
            case 'Yes':
                return 'success';

            case 'No':
                return 'danger';
        }
    };
    const getSeverityinv = (flag) => {
        switch (flag) {
            case 'Yes':
                return 'danger';

            case 'No':
                return 'success';
        }
    };


    const showCreateShipmentDetail = import.meta.env.VITE_SHOW_SYNC_ORDERS === "true";

    const actionItems = [
        hasActionAccess(PAGE_KEY, "update_import_ready") && {
            label: 'Update Import Ready',
            icon: 'pi pi-sync',
            command: () => {
                if (selectedShipments != null && selectedShipments.length > 0) {
                    onclick(setDisplayConfirmation1(true))
                } else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 shipment' });
                }
            }
        },
        hasActionAccess(PAGE_KEY, "remove_reservation") && {
            label: 'Remove Reservation',
            icon: 'fa fa-remove',
            command: () => {
                if (selectedShipments != null && selectedShipments.length == 1) {
                    onclick(setRemoveReservationDisplayConfirmation(true))
                }
                if (selectedShipments != null && selectedShipments.length > 1) {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'You cannot select multiple shipment at a time.' });
                } else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Kindly select atleast 1 container' });
                }
            }
        },
        hasActionAccess(PAGE_KEY, "mark_receipt_complete") && {
            label: 'Mark Receipt Complete',
            icon: 'pi pi-plus',
            command: () => {
                if (selectedShipments != null && selectedShipments.length > 0) {
                    onclick(setMarkReceiptCompleteDisplayConfirmation(true))
                }
                else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Kindly select atleast 1 shipment' });
                }
            }
        },
        // {
        //     label: 'Create Shipment Detail',
        //     icon: 'pi pi-plus',
        //     command: () => {
        //         if (selectedShipments != null && selectedShipments.length > 0) {
        //             setbtnDisabled(false);  // Reset button state
        //             setApiSuccess(false);
        //             setCreateContainerDetailDisplayConfirmation(true);
        //         } else {
        //             toast.current.show({ severity: 'error', summary: 'Error', detail: 'Kindly select at least 1 shipment' });
        //         }
        //     }
        // },
        hasActionAccess(PAGE_KEY, "create_shipment_detail") && {
            label: 'Create Shipment Detail',
            icon: 'pi pi-plus',
            template: (item, options) => {

                // Disable ONLY when FLAG is false
                const isDisabled = !showCreateShipmentDetail;
                return (
                    <span className={isDisabled ? "disabled-create-shipment-wrapper" : ""}>
                        <Tooltip
                            target=".disabled-create-shipment-wrapper"
                            content="It is not part of Phase-1 plan"
                            position="right"
                        />
                        <a
                            className="p-menuitem-link"
                            style={{
                                cursor: isDisabled ? "default" : "pointer",
                                opacity: isDisabled ? 0.5 : 1
                            }}
                            onClick={(e) => {
                                if (isDisabled) {
                                    e.preventDefault();
                                    return;
                                }
                                setbtnDisabled(false);
                                setApiSuccess(false);
                                setCreateContainerDetailDisplayConfirmation(true);
                            }}
                        >
                            <span className={`${item.icon} mr-2`} />
                            <span>{item.label}</span>
                        </a>
                    </span>
                );
            }
        }
    ].filter(Boolean);
    const markReceiptComplete = () => {
        data = {
            containers: selectedShipments
        }
        setbtnDisabled(true);
        setLoading(true);
        ManualContainersService.MarkReceiptComplete(data).then((data) => {
            setLoading(false);
            if (data.error == 0) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message });
                setSelectAll(false);
                setSelectedShipments([]);
                // getItems(zoneDetail.zon_Description);
                loadLazyData();
            }
            else {
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message });
            }
            setbtnDisabled(false);
            setMarkReceiptCompleteDisplayConfirmation(false)
        });

    };


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
            ShipmentsService.getShipmentsGrid((lazyState)).then((data) => {
                setTotalRecords(data.totalRecords);
                setNextCursor(data.next_cursor);
                setPrevCursor(data.prev_cursor);
                setShipments(data.data);
                setLoading(false);
            });
        }, 300);
    };
    const handleNext = () => {
        setlazyState(prevState => ({
            ...prevState,
            first: prevState.first + prevState.rows,
        }));
    };



    const handlePrev = () => {
        setlazyState(prevState => ({
            ...prevState,
            first: Math.max(prevState.first - prevState.rows, 0),
        }));
    };
    useEffect(() => {
        if (!shipments || shipments.length === 0) {
            setSelectAll(false);
            return;
        }

        const allSelected = shipments.every((s) =>
            selectedShipments.some((sel) => sel.id === s.id)
        );
        setSelectAll(allSelected);
    }, [shipments, selectedShipments]);

    const onPage = (event) => {
        setlazyState(event);
        console.log("asdas"); return false;
        setlazyState(event);
    };

    const onFilter = (event) => {
        event['first'] = 0;
        setlazyState(event);
    };

    // const onSelectionChange = (event) => {
    //     const value = event.value;
    //     setSelectedShipments(value);
    //     setSelectAll(value.length === shipments.length);
    // };
    const onSelectionChange = (event) => {
        const value = event.value;
        setSelectedShipments(value);

        const currentPageShipments = shipments.slice(lazyState.first, lazyState.first + lazyState.rows);
        const allSelected = currentPageShipments.every((s) =>
            value.some((sel) => sel.id === s.id)
        );

        setSelectAll(allSelected);
    };

    const createShipmentDetail = () => {
        const data = {
            shipments: selectedShipments.map(item => ({
                ship_num: item.ship_num,
            })),
        };
        setbtnDisabled(true);
        setLoading(true);
        setApiSuccess(false); // Reset success state when making new call

        ManualContainersService.createShipmentDetail(data).then((response) => {
            setLoading(false);
            if (response.error === 0) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: response.message });
                setSelectAll(false);
                setSelectedShipments([]);
                loadLazyData();
                setCreateContainerDetailDisplayConfirmation(false);
                setApiSuccess(true); // Mark as successful
            } else {
                toast.current.show({ severity: 'error', summary: 'Error', detail: response.message });
                setbtnDisabled(false);
            }
        });
    };
    // const onSelectAllChange = (event) => {
    //     const selectAllChecked = event.checked;
    //     setSelectAll(selectAllChecked);

    //     if (selectAllChecked) {
    //         const currentPageIds = shipments.map((s) => s.id);
    //         setSelectedShipments(shipments.filter((s) => currentPageIds.includes(s.id)));
    //     } else {
    //         setSelectedShipments([]);
    //     }
    // };

    const onSelectAllChange = (event) => {
        const selectAllChecked = event.checked;
        setSelectAll(selectAllChecked);

        // const currentPageShipments = shipments.slice(lazyState.first, lazyState.first + lazyState.rows);
        const currentPageShipments = shipments;

        if (selectAllChecked) {
            const newSelections = [...selectedShipments];

            currentPageShipments.forEach((shipment) => {
                if (!newSelections.some((s) => s.id === shipment.id)) {
                    newSelections.push(shipment);
                }
            });

            setSelectedShipments(newSelections);
        } else {
            const updated = selectedShipments.filter(
                (s) => !currentPageShipments.some((c) => c.id === s.id)
            );
            setSelectedShipments(updated);
        }
    };




    const hasDetailAccess = hasPageAccess(Detail_PAGE_KEY)
    // const shipmentNumberBodyTemplate = (rowData) => {
    //     return (
    //         <>
    //             <span className="p-column-title">Shipment #</span>
    //             <Link to={`${rowData.id}`}>{rowData.ship_num}</Link>
    //         </>
    //     );
    // };
    const shipmentNumberBodyTemplate = (rowData) => {
        return (
            <>
                <span className="p-column-title">Shipment #</span>

                {hasDetailAccess ? (
                    <Link to={`${rowData.id}`}>
                        {rowData.ship_num}
                    </Link>
                ) : (
                    rowData.ship_num
                )}
            </>
        );
    };

    const shipDateBodyTemplate = (rowData) => {
        const formattedDate = rowData.ship_dat
            ? rowData.ship_dat.split("T")[0]
            : '-';

        return (
            <>
                <span className="p-column-title">Shipment Date</span>
                {formattedDate}
            </>
        );
    };
    const shipUIBodyTemplate = (rowData) => {
        return (
            <>
                <span className="p-column-title">Ship UID</span>
                {rowData.ship_uid}
            </>
        );
    };

    const shipCreatedDateBodyTemplate = (rowData) => {
        const d = new Date(rowData.create_dat_tim);

        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const year = d.getFullYear();

        let hours = d.getHours();
        const minutes = String(d.getMinutes()).padStart(2, "0");
        const seconds = String(d.getSeconds()).padStart(2, "0");

        const formatted =
            `${year}-${month}-${day} ${String(hours).padStart(2, "0")}:${minutes}:${seconds}:000`;

        return (
            <>
                <span className="p-column-title">Shipment Created DateTime</span>
                {formatted}
            </>
        );
    };

    const createContainerDetailConfirmationDialogFooter = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => {
                setCreateContainerDetailDisplayConfirmation(false);
                setApiSuccess(false); // Reset when dialog closes
            }} className="p-button-text" />
            <Button
                type="button"
                label="Yes"
                icon="pi pi-check"
                disabled={btnDisabled || apiSuccess}
                onClick={() => createShipmentDetail()}
                className="p-button-text"
                autoFocus
            />
        </>
    );
    const fcyBodyTemplate = (rowData) => {
        return (
            <>
                <span className="p-column-title">FCY</span>
                {rowData.fcy}
            </>
        );
    };

    const supplierBodyTemplate = (rowData) => {
        return (
            <>
                <span className="p-column-title">Supplier</span>
                {rowData.bpsnum}
            </>
        );
    };

    const expectedDateBodyTemplate = (rowData) => {
        const d = new Date(rowData.expected_at);

        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const year = d.getFullYear();

        let hours = d.getHours();
        const minutes = String(d.getMinutes()).padStart(2, "0");
        const seconds = String(d.getSeconds()).padStart(2, "0");

        const formatted =
            `${year}-${month}-${day} ${String(hours).padStart(2, "0")}:${minutes}:${seconds}:000`;

        return (
            <>
                <span className="p-column-title">Expected Date</span>
                {formatted}
            </>
        );
    };

    const mantis_importedBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.mantis_imported_h == 1) ? <Badge value="Yes" severity="success"></Badge> : <Badge value="No" severity="danger"></Badge>}
            </>
        );
    };

    const import_readyBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.import_ready == 1) ? <Badge value="Yes" severity="success"></Badge> : <Badge value="No" severity="danger"></Badge>}
            </>
        );
    };

    const invalid_itemsBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.invalid_items == 1) ? <Badge value="Yes" severity="danger"></Badge> : <Badge value="No" severity="success"></Badge>}
            </>
        );
    };

    const isConveyableBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.is_conveyable == 0) ? <Badge value="No" severity="danger"></Badge> : <Badge value="Yes" severity="success"></Badge>}
            </>
        );
    };

    const syncDetails = () => {
        setDisplayConfirmation(false)
        setLoading(true);
        ShipmentsService.syncData().then((data) => {
            setLoading(false);
            if (data.error == 0) {
                loadLazyData();
                toast.current.show({ severity: 'success', summary: 'Success Message', detail: data.message, life: 3000 });
            } else {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
        });
    };

    const updateImportReady = () => {

        // setbtnDisabled(true);
        data = {
            shipments: selectedShipments,
        }
        let is_invalid = 0;
        selectedShipments.map((shipment, index) => {
            if (shipment.invalid_items == 1) {
                is_invalid = 1;
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Sorry! Could not mark as import-ready because shipment #' + shipment.ship_num + ' contains an invalid item.', life: 4000 });
            }
            return false;
        });

        if (is_invalid == 1) {
            setDisplayConfirmation1(false)
            setLoading(false);
            setbtnDisabled(false);
            setSelectAll(false);
            setSelectedShipments([]);

        } else {

            ShipmentsService.updateImportReadyItems(data).then((data) => {
                setLoading(false);
                if (data.error == 0) {
                    toast.current.show({ severity: 'success', summary: 'Success', detail: data.message });
                    setSelectAll(false);
                    setSelectedShipments([]);
                    // getItems(zoneDetail.zon_Description);
                    loadLazyData();
                }
                else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: data.message });
                }
                setbtnDisabled(false);
                setDisplayConfirmation1(false)
            });
        }


    };

    const confirmationDialogFooter = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => syncDetails()} className="p-button-text" autoFocus />
        </>
    );

    const confirmationDialogFooter1 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation1(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" disabled={btnDisabled} onClick={() => updateImportReady()} className="p-button-text" autoFocus />
        </>
    );

    const RemoveReservationconfirmationDialogFooter = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setRemoveReservationDisplayConfirmation(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" disabled={btnDisabled} onClick={() => removeReservation()} className="p-button-text" autoFocus />
        </>
    );
    const markReceiptCompletetconfirmationDialogFooter = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setMarkReceiptCompleteDisplayConfirmation(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" disabled={btnDisabled} onClick={() => markReceiptComplete()} className="p-button-text" autoFocus />
        </>
    );

    // hide Sync button
    const showSyncShipments = import.meta.env.VITE_SHOW_SYNC_ORDERS === "true";

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className="flex mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                {/* <SplitButton label="Create Delivery" icon="pi pi-plus" onClick={() => setDisplayConfirmation3(true)} model={actionItems} /> */}
                <Menu model={actionItems} popup ref={menuLeft} id="popup_menu_left" />
                {actionItems.length > 0 && (<Button label="Actions" icon="pi pi-align-left" className="mr-2" onClick={(event) => menuLeft.current.toggle(event)} aria-controls="popup_menu_left" aria-haspopup />)}

                <div className="block mt-2 md:mt-0 flex align-items-center bg-bd-cl">
                    <Button
                        onClick={() => {
                            setSelectedShipments([]);
                            setSelectAll(false);
                        }}
                        icon="pi pi-times"
                        className="p-button-text p-button-gray mr-3"
                        tooltip="Clear All"
                        tooltipOptions={{ position: 'top' }}
                    />

                    <label htmlFor="ShipmentList">Shipments Selected: </label>
                    <span className="selected-count ml-2">
                        {selectedShipments.length > 0
                            ? `${selectedShipments.length} Record${selectedShipments.length > 1 ? 's' : ''} Selected`
                            : 'No Records Selected'}
                    </span>

                    <Button
                        icon="pi pi-list"
                        className="p-button-text p-button-gray ml-3"
                        tooltip="View Selected Shipments"
                        tooltipOptions={{ position: 'top' }}
                        onClick={(e) => op.current?.toggle(e)} // Pass the event here!
                    />

                    <OverlayPanel ref={op}>
                        <div className="popover-list">
                            {selectedShipments.length === 0 ? (
                                <span>No shipments selected</span>
                            ) : (
                                selectedShipments.map((shipment) => (
                                    <div
                                        key={shipment.id}
                                        className="popover-item flex justify-between items-center mb-1 border-b pb-1"
                                    >
                                        <span>{shipment.ship_num || shipment.id}</span>
                                        <i
                                            className="pi pi-times cross-icon text-red-500 cursor-pointer ml-2"
                                            onClick={() => removeShipment(shipment.id)}
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                    </OverlayPanel>
                </div>


                {/* <Button label="Create Delivery" icon="pi pi-plus" severity="sucess" className='mr-3' onClick={() => setDisplayConfirmation3(true)} /> */}
                {/* <Button label="Execute Orders" icon="pi pi-sync" severity="sucess" onClick={() => setDisplayConfirmation2(true)} /> */}
            </span>
            {/* <span className="block mt-2 md:mt-0 p-input-icon-left">
                <Button label="Sync Shipments" icon="pi pi-sync" severity="sucess" onClick={() => setDisplayConfirmation(true)} />
            </span> */}
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                {/* <i className="pi pi-search" /> */}
                <Tooltip
                    target=".disabled-sync-shipments-wrapper"
                    content="It is not part of Phase-1 Plan"
                    position="top"
                />
                <span className={!showSyncShipments ? "disabled-sync-shipments-wrapper inline-block" : "inline-block"}>
                    {hasActionAccess(PAGE_KEY, "sync_shipments") && (<Button
                        label="Sync Shipments"
                        icon="pi pi-sync"
                        onClick={() => setDisplayConfirmation(true)}
                        disabled={!showSyncShipments}
                    />)}
                </span>
            </span>
        </div>
    );
    const RefreshEntireList = () => {
        setSelectedContainers([]);
        setSelectAll(false);
    }
    const removeShipment = (idToRemove) => {
        const updated = selectedShipments.filter(item => item.id !== idToRemove);
        setSelectedShipments(updated);
        setSelectAll(updated.length === shipments.length);
    };


    const representativeRowFilterTemplate = (options) => {
        return (
            <Calendar value={dates} onChange={(e) => setDates(e.value)} selectionMode="range" readOnlyInput />

        );
    };

    return (
        <>
            <Helmet>
                <title>{titles.Shipments}</title>
            </Helmet>
            <Toast ref={toast} />
            <BreadCrumb model={items} home={home} />
            <Dialog header="Confirmation" visible={displayConfirmation} onHide={() => setDisplayConfirmation(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to proceed?</span>
                </div>
            </Dialog>
            <Dialog header="Confirmation" visible={markReceiptCompleteDisplayConfirmation} onHide={() => setMarkReceiptCompleteDisplayConfirmation(false)} style={{ width: '350px' }} modal footer={markReceiptCompletetconfirmationDialogFooter}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to proceed?</span>
                </div>
            </Dialog>
            <Dialog header="Confirmation" visible={createContainerDetailDisplayConfirmation} onHide={() => setCreateContainerDetailDisplayConfirmation(false)} style={{ width: '350px' }} modal footer={createContainerDetailConfirmationDialogFooter}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to create shipment details?</span>
                </div>
            </Dialog>
            <Dialog header="Confirmation" visible={displayConfirmation1} onHide={() => setDisplayConfirmation1(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter1}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to proceed?</span>
                </div>
            </Dialog>
            <Dialog header="Confirmation" visible={RemoveReservationDisplayConfirmation} onHide={() => setRemoveReservationDisplayConfirmation(false)} style={{ width: '350px' }} modal footer={RemoveReservationconfirmationDialogFooter}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to proceed?</span>
                </div>
            </Dialog>
            <h1></h1>
            <div className="card">
                <h3>Shipments</h3>
                <DataTable
                    value={shipments}
                    lazy
                    filterDisplay="row"
                    dataKey="id"

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
                    emptyMessage="No shipments found."
                    selection={selectedShipments}
                    onSelectionChange={onSelectionChange}
                    selectAll={selectAll}
                    onSelectAllChange={onSelectAllChange}
                    header={header}
                    scrollable
                    scrollHeight="600px"

                >
                    <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />

                    <Column field="ship_num" header="Shipment #" body={shipmentNumberBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="ship_uid" header="Ship UID" body={shipUIBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="ship_dat" sortable header="Ship At" body={shipDateBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="create_dat_tim" sortable filter header="Created At" body={shipCreatedDateBodyTemplate} showFilterMenu={false} filterPlaceholder="Search" />
                    <Column field="fcy" header="FCY" body={fcyBodyTemplate} sortable showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="bpsnum" header="Supplier" body={supplierBodyTemplate} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="expected_at" sortable header="Expected At" body={expectedDateBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="mantis_imported_h" sortable filter header="Mantis Imported" body={mantis_importedBodyTemplate} showFilterMenu={false} filterElement={globalRowFilterTemplate} />
                    <Column field="import_ready" sortable filter header="Import Ready" body={import_readyBodyTemplate} showFilterMenu={false} filterElement={globalRowFilterTemplate} />
                    <Column field="invalid_items" header="Invalid Items" body={invalid_itemsBodyTemplate} showFilterMenu={false} filter filterElement={InvglobalRowFilterTemplate} />
                    <Column field="is_conveyable" header="Conveyable" body={isConveyableBodyTemplate} showFilterMenu={false} filter filterElement={globalRowFilterTemplate} />

                </DataTable>

                {/* <div className="pagination-container">
                <button onClick={handlePrev} disabled={lazyState.first === 0} className='pagination-button'><i className="fas fa-chevron-left"></i> </button>
                <select  value={rowsPerPage} onChange={handleRowsPerPageChange} className='pagination-select-box'>
                    {rowsOptions.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                </select>
                <button onClick={handleNext} disabled={!nextCursor} className='pagination-button'><i className="fas fa-chevron-right"></i></button>

                
            </div> */}
            </div>
        </>

    );
}
