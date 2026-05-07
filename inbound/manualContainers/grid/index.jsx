
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Link } from 'react-router-dom';
import { Button } from 'primereact/button';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Helmet } from 'react-helmet';
import titles from '../../../titles';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { ManualContainersService } from '../../../../service/inbound/ManualContainerService';
import { FileUpload } from 'primereact/fileupload';
import { Badge } from 'primereact/badge';
import { Menu } from 'primereact/menu';
import { Dropdown } from 'primereact/dropdown';
import * as XLSX from 'xlsx';
import { OverlayPanel } from 'primereact/overlaypanel';
import { useLazySort } from '../../../../components/useLazySort';
import { Tooltip } from 'primereact/tooltip';
import { useAuth } from '../../../../store/useAuth';


export default function ManualContainers() {
    const { hasActionAccess } = useAuth();
    const PAGE_KEY = "inbound_manual_containers";
    const { hasPageAccess } = useAuth();
    const Detail_PAGE_KEY = "inbound_manual_containers_Details"
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const [containers, setContainers] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedContainers, setSelectedContainers] = useState([]);
    const [selectedShipments, setSelectedShipments] = useState(null);
    const [displayConfirmation, setDisplayConfirmation] = useState(false);
    const [displayBulkConfirmation, setDisplayBulkConfirmation] = useState(false);
    const [isBulkUpload, setIsBulkUpload] = useState(false);
    const [displayConfirmation1, setDisplayConfirmation1] = useState(false);
    const [importReadyDisplayConfirmation, setimportReadyDisplayConfirmation] = useState(false);
    const [RemoveReservationDisplayConfirmation, setRemoveReservationDisplayConfirmation] = useState(false);
    const [markReceiptCompleteDisplayConfirmation, setMarkReceiptCompleteDisplayConfirmation] = useState(false);
    const [createContainerDetailDisplayConfirmation, setCreateContainerDetailDisplayConfirmation] = useState(false);
    const [delteContainerDisplayConfirmation, setDelteContainerDisplayConfirmation] = useState(false);
    const [btnDisabled, setbtnDisabled] = useState(false);
    const toast = useRef();
    const op = useRef(null);

    let data = {};
    const menuLeft = useRef(null);
    const [templateUrl, setTemplateUrl] = useState(false);
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 25,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {
            ctrnum: { value: null, matchMode: 'contains' },
            contain_invalid_items: { value: null, matchMode: 'contains' },
            formatted_created_at: { value: null, matchMode: 'contains' },
            status: { value: null, matchMode: 'contains' },
            is_transfer: { value: null, matchMode: 'contains' },
            conveyable: { value: null, matchMode: 'contains' },
            import_ready: { value: null, matchMode: 'contains' },
            mantis_imported_H: { value: null, matchMode: 'contains' },
            shipnum: { value: null, matchMode: 'contains' },
            hasLotInfo: { value: null, matchMode: 'contains' },

        }
    });

    const { onSort } = useLazySort(setlazyState);
    const items = [{ label: 'Receipt' }, { label: 'Manual Containers' }];
    const home = { icon: 'pi pi-home', url: '/' }
    const optionsList = selectedContainers.map(container => ({
        label: `${container.ctrnum} - ${container.status}`,
        value: container.id
    }));

    let networkTimeout = null;
    let fileRef = useRef();
    const globalFlags = [
        { code: '1', name: 'Yes' },
        { code: '0', name: 'No' },
    ];
    const globalFlags1 = [
        { code: '0', name: 'Yes' },
        { code: '1', name: 'No' },
    ];
    const flagTemplate = (option) => {
        return <Badge value={option.name} severity={getSeverity(option.name)} />;
    };
    const flagTemplate1 = (option) => {
        return <Badge value={option.name} severity={getSeverity1(option.name)} />;
    };
    const flagTemplate2 = (option) => {
        return <Badge value={option.name} severity={getSeverity2(option.name)} />;
    };
    const globalRowFilterTemplate = (options) => {
        return (
            <Dropdown style={{ minWidth: '5em', width: '5em' }} value={options.name}
                optionValue="code" optionLabel="name" options={globalFlags}
                onChange={(e) => options.filterApplyCallback(e.value)}
                itemTemplate={flagTemplate} placeholder="Select" className="p-column-filter" showClear />
        );
    };
    const globalRowFilterTemplate2 = (options) => {
        return (
            <Dropdown style={{ minWidth: '5em', width: '5em' }} value={options.name}
                optionValue="code" optionLabel="name" options={globalFlags}
                onChange={(e) => options.filterApplyCallback(e.value)}
                itemTemplate={flagTemplate2} placeholder="Select" className="p-column-filter" showClear />
        );
    };
    const globalRowFilterTemplate3 = (options) => {
        return (
            <Dropdown style={{ minWidth: '5em', width: '5em' }} value={options.name}
                optionValue="code" optionLabel="name" options={globalFlags1}
                onChange={(e) => options.filterApplyCallback(e.value)}
                itemTemplate={flagTemplate2} placeholder="Select" className="p-column-filter" showClear />
        );
    };
    const globalRowFilterTemplate1 = (options) => {
        return (
            <Dropdown style={{ minWidth: '5em', width: '5em' }} value={options.name}
                optionValue="code" optionLabel="name" options={globalFlags}
                onChange={(e) => options.filterApplyCallback(e.value)}
                itemTemplate={flagTemplate1} placeholder="Select" className="p-column-filter" showClear />
        );
    };
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

    const getSeverity = (status) => {

        switch (status) {
            case 'Yes':
                return 'info';

            case 'No':
                return 'primary';

        }
    };
    const getSeverity1 = (status) => {

        switch (status) {
            case 'Yes':
                return 'danger';

            case 'No':
                return 'success';

        }
    };
    const getSeverity2 = (status) => {

        switch (status) {
            case 'No':
                return 'danger';

            case 'Yes':
                return 'success';

        }
    };


    useEffect(() => {
        loadLazyData(isBulkUpload);
    }, [lazyState, isBulkUpload]);
    useEffect(() => {
        const currentPageIds = containers.map(c => c.id);
        const isAllCurrentPageSelected = currentPageIds.every(id =>
            selectedContainers.some(sel => sel.id === id)
        );

        setSelectAll(isAllCurrentPageSelected);
    }, [containers, selectedContainers]);

    const loadLazyData = (isBulkUpload) => {
        setLoading(true);

        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }

        //imitate delay of a backend call
        networkTimeout = setTimeout(() => {
            ManualContainersService.getGrid((lazyState)).then((data) => {
                setTotalRecords(data.totalRecords);
                setContainers(data.data);
                // Check if Bulk Upload was clicked, and set the appropriate template URL
                if (isBulkUpload) {
                    setTemplateUrl(data.bulk_template_url);  // Use the bulk template URL
                } else {
                    setTemplateUrl(data.template_url);  // Use the regular template URL
                }
                setLoading(false);
            });
        }, Math.random() * 100 + 250);
    };

    const onPage = (event) => {
        setlazyState(event);
        // setSelectAll(false);
    };
    const onFilter = (event) => {
        event['first'] = 0;
        setlazyState(event);
    };

    const onSelectionChange = (event) => {

        const value = event.value;
        setSelectedContainers(value);
        setSelectAll(value.length === totalRecords);
    };

    // const onSelectAllChange = (event) => {
    //     const selectAll = event.checked;

    //     if (selectAll) {

    //             console.log(data);
    //             setSelectAll(true);
    //             setSelectedContainers(containers);

    //     } else {
    //         setSelectAll(false);
    //         setSelectedContainers([]);
    //     }
    // };
    const onSelectAllChange = (event) => {
        const selectAll = event.checked;

        if (selectAll) {
            setSelectAll(true);

            setSelectedContainers(prevSelected => {
                const currentPageIds = containers.map(c => c.id);
                const newSelection = [...prevSelected];

                containers.forEach(c => {
                    if (!newSelection.some(sel => sel.id === c.id)) {
                        newSelection.push(c);
                    }
                });

                return newSelection;
            });
        } else {
            setSelectAll(false);

            // Remove only current page containers from selection
            setSelectedContainers(prevSelected =>
                prevSelected.filter(item => !containers.some(c => c.id === item.id))
            );
        }
    };

    const hasDetailAccess = (Detail_PAGE_KEY)
    const handleClick = (e) => {
        if (!hasDetailAccess) {
            e.preventDefault();
        }
    };

    const renderLink = (value, id) => (
        <Link to={`${id}`} onClick={handleClick}>
            {value}
        </Link>
    );

    // use in both columns
    const ctrnumBodyTemplate = (rowData) =>
        renderLink(rowData.ctrnum, rowData.id);

    const shipNumBodyTemplate = (rowData) =>
        renderLink(rowData.shipnum, rowData.id);
    // const ctrnumBodyTemplate = (rowData) => {
    //     return (
    //         <Link to={`${rowData.id}`}>{rowData.ctrnum}</Link>
    //     );
    // };
    // const shipNumBodyTemplate = (rowData) => {
    //     return (
    //         <Link to={`${rowData.id}`}>{rowData.shipnum}</Link>
    //     );
    // };
    const contain_invalid_itemsBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.contain_invalid_items == 1) ? <Badge value="Yes" severity="danger">N</Badge> : <Badge value="No" severity="success"></Badge>}
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
    const mantis_importedBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.mantis_imported_h == 1) ? <Badge value="Yes" severity="success"></Badge> : <Badge value="No" severity="danger"></Badge>}
            </>
        );
    };

    const statusBodyTemplate = (rowData) => {

        return (
            <Tag value={rowData.status} severity={getStatusSeverity(rowData.status)} />
        );
    };


    const confirmationDialogFooter = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" className="p-button-text" autoFocus />
        </>
    );
    const updateImportReady = () => {
        data = {
            containers: selectedContainers,
        }
        let is_invalid = 0;
        selectedContainers.map((container, index) => {

            if (container.contain_invalid_items == 1) {
                is_invalid = 1;
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Sorry! Could not mark as import-ready because container #' + container.ctrnum + ' contains an invalid item.', life: 4000 });
            }

        });
        if (is_invalid == 1) {
            setSelectedContainers([]);
            setimportReadyDisplayConfirmation(false);
            setbtnDisabled(false);
            setSelectAll(false);
            setLoading(false);

        } else {

            ManualContainersService.updateImportReadyItems(data).then((data) => {
                setLoading(false);
                if (data.error == 0) {
                    toast.current.show({ severity: 'success', summary: 'Success', detail: data.message });
                    setSelectAll(false);
                    setSelectedContainers([]);
                    // getItems(zoneDetail.zon_Description);
                    loadLazyData();
                }
                else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: data.message });
                }
                setbtnDisabled(false);
                setimportReadyDisplayConfirmation(false)
            });
        }


    };
    const removeReservation = () => {
        data = {
            containers: selectedContainers,
        }



        ManualContainersService.removeReservation(data).then((data) => {
            setLoading(false);
            if (data.error == 0) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message });
                setSelectAll(false);
                setSelectedContainers([]);

                loadLazyData();
            }
            else {
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message });
            }
            setbtnDisabled(false);
            setRemoveReservationDisplayConfirmation(false)

        });


    };
    const deleteContainer = () => {
        //  loop through get only ids for deletion 
        const container_ids = selectedContainers.map(item => item.id);
        data = {
            containers: container_ids
        }
        setbtnDisabled(true);
        setLoading(true);
        ManualContainersService.deleteContainers(data).then((data) => {
            setLoading(false);
            if (data.error == 0) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message });
                setSelectAll(false);
                setSelectedContainers([]);
                loadLazyData();
            }
            else {
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message });
            }
            setbtnDisabled(false);
            setDelteContainerDisplayConfirmation(false)
        });

    };
    const markReceiptComplete = () => {
        data = {
            containers: selectedContainers
        }
        setbtnDisabled(true);
        setLoading(true);
        ManualContainersService.MarkReceiptComplete(data).then((data) => {
            setLoading(false);
            if (data.error == 0) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message });
                setSelectAll(false);
                setSelectedContainers([]);
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
    const conveyableBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.conveyable == 1) ? <Badge value="No" severity="danger">N</Badge> : <Badge value="Yes" severity="success"></Badge>}
            </>
        );
    };
    const hasLotBodyTemplate = (rowData) => {
        return rowData.hasLotInfo === 1
            ? <Badge value="Yes" severity="success" />
            : <Badge value="No" severity="danger" />;
    };
    const isTransferBodyTemplate = (rowData) => {
        return (
            <>
                {(rowData.is_transfer == 1) ? <Badge value="Yes" severity="info">Y</Badge> : <Badge value="No" severity="primary"></Badge>}
            </>
        );
    };

    const importReadtconfirmationDialogFooter = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setimportReadyDisplayConfirmation(false)} className="p-button-text" />
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
    const deleteContainerConfirmationDialogFooter = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDelteContainerDisplayConfirmation(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" disabled={btnDisabled} onClick={() => deleteContainer()} className="p-button-text" autoFocus />
        </>
    );
    const confirmationDialogFooter2 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation1(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => syncIntersite()} className="p-button-text" autoFocus />
        </>
    );

    const showCreateContainerDetail = import.meta.env.VITE_SHOW_SYNC_ORDERS === "true";

    const actionItems = [
        hasActionAccess(PAGE_KEY, "update_import_ready") && {
            label: 'Update Import Ready',
            icon: 'pi pi-sync',
            command: () => {
                if (selectedContainers != null && selectedContainers.length > 0) {
                    onclick(setimportReadyDisplayConfirmation(true))
                } else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Kindly select atleast 1 container' });
                }
            }
        },
        hasActionAccess(PAGE_KEY, "remove_reservation") && {
            label: 'Remove Reservation',
            icon: 'fa fa-remove',
            command: () => {
                if (selectedContainers != null && selectedContainers.length > 0) {
                    onclick(setRemoveReservationDisplayConfirmation(true))
                }
                if (selectedContainers != null && selectedContainers.length > 1) {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'You cannot select multiple container at a time.' });
                }
                else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Kindly select atleast 1 container' });
                }
            }
        },
        hasActionAccess(PAGE_KEY, "mark_receipt_complete") && {
            label: 'Mark Receipt Complete',
            icon: 'pi pi-plus',
            command: () => {
                if (selectedContainers != null && selectedContainers.length > 0) {
                    onclick(setMarkReceiptCompleteDisplayConfirmation(true))
                }

                else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Kindly select atleast 1 container' });
                }
            }
        },
        // {
        //     label: 'Create Container Detail',
        //     icon: 'pi pi-plus',
        //     command: () => {
        //         if (selectedContainers != null && selectedContainers.length > 0) {
        //             setCreateContainerDetailDisplayConfirmation(true);
        //         } else {
        //             toast.current.show({ severity: 'error', summary: 'Error', detail: 'Kindly select at least 1 container' });
        //         }
        //     }
        // },
        hasActionAccess(PAGE_KEY, "create_container_detail") && {
            label: 'Create Container Detail',
            icon: 'pi pi-plus',
            template: (item, options) => {
                const disabled = !showCreateContainerDetail;

                return (
                    <span className={disabled ? "disabled-container-wrapper" : ""}>
                        <Tooltip
                            target=".disabled-container-wrapper"
                            content="It is not part of Phase-1 plan"
                            position="right"
                        />
                        <a
                            className="p-menuitem-link"
                            style={{
                                cursor: disabled ? "default" : "pointer",
                                opacity: disabled ? 0.5 : 1
                            }}
                            onClick={(e) => {
                                if (disabled) {
                                    e.preventDefault();
                                    return;
                                }
                                options.onClick(e);
                                setCreateContainerDetailDisplayConfirmation(true);
                            }}
                        >
                            <span className={`${item.icon} mr-2`} />
                            <span className="p-menuitem-text">{item.label}</span>
                        </a>
                    </span>
                );
            }
        },
        hasActionAccess(PAGE_KEY, "delete") && {
            label: 'Delete',
            icon: 'pi pi-trash',
            command: () => {
                if (selectedContainers != null && selectedContainers.length > 0) {
                    onclick(setDelteContainerDisplayConfirmation(true))
                } else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Kindly select atleast 1 container' });
                }
            }
        },

    ].filter(Boolean);

    // hide Sync Order button
    const showSyncIntersiteShipment = import.meta.env.VITE_SHOW_SYNC_ORDERS === "true";

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">
            <span className=" flex mt-2 md:mt-0 p-input-icon-left">
                <i className="pi pi-search" />
                <Menu model={actionItems} popup ref={menuLeft} id="popup_menu_left" />
                {actionItems.length > 0 && (<Button label="Actions" icon="pi pi-align-left" className="mr-2" onClick={(event) => menuLeft.current.toggle(event)} aria-controls="popup_menu_left" aria-haspopup />)}
                {/* <Button label="Sync Intersite Shipment" icon="pi pi-sync" className="mr-2" onClick={(event) => setDisplayConfirmation1(true)} /> */}
                <Tooltip
                    target=".disabled-sync-intersite-wrapper"
                    content="It is not part of Phase-1 Plan"
                    position="top"

                />
                <span className={!showSyncIntersiteShipment ? "disabled-sync-intersite-wrapper inline-block" : "inline-block"}>
                    {hasActionAccess(PAGE_KEY, "sync_intersite_shipment") && (<Button
                        label="Sync Intersite Shipment"
                        icon="pi pi-sync"
                        className="mr-2"
                        onClick={() => setDisplayConfirmation1(true)}
                        disabled={!showSyncIntersiteShipment}
                    />)}
                </span>
                <div className="block mt-2 md:mt-0 flex align-items-center bg-bd-cl">
                    <Button
                        onClick={() => RefreshEntireList()}
                        icon="pi pi-times"
                        className="p-button-text p-button-gray mr-3"
                        tooltip="Close"
                        tooltipOptions={{ position: 'top' }}
                    />
                    <label htmlFor="PickList ID">Container ID : </label>
                    <span className="selected-count ml-2">
                        {selectedContainers.length > 0
                            ? `${selectedContainers.length} Record${selectedContainers.length > 1 ? 's' : ''} Selected`
                            : 'No Records Selected'}
                    </span>

                    <Button
                        icon="pi pi-list"
                        className="p-button-text p-button-gray mr-3"
                        tooltip="Selected Containers"
                        tooltipOptions={{ position: 'top' }}
                        onClick={(e) => op.current.toggle(e)}
                    />

                    <OverlayPanel ref={op}>
                        <div className="popover-list">
                            {optionsList.length === 0 ? (
                                <span>No containers selected</span>
                            ) : (
                                optionsList.map((option) => (
                                    <div key={option.value} className="popover-item flex justify-between items-center mb-1 border-b pb-1">
                                        <span>{option.label}</span>
                                        <i
                                            className="pi pi-times cross-icon text-red-500 cursor-pointer ml-2"
                                            onClick={() => removeContainer(option.value)}
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                    </OverlayPanel>


                </div>
            </span>
            <span className="block mt-2 md:mt-0 p-input-icon-left">
                {hasActionAccess(PAGE_KEY, "bulk_load_complete") && hasActionAccess(PAGE_KEY, "create_container_detail") && (<Button
                    label="Bulk Load & Complete"
                    icon="pi pi-upload"
                    severity="secondary"
                    onClick={() => {
                        setDisplayBulkConfirmation(true);
                        setIsBulkUpload(true);
                    }}
                />)}
                <span>&nbsp;&nbsp;&nbsp;</span>
                {hasActionAccess(PAGE_KEY, "upload") && hasActionAccess(PAGE_KEY, "create_container_detail") && (<Button
                    label="Upload"
                    icon="pi pi-upload"
                    severity="secondary"
                    onClick={() => {
                        setDisplayConfirmation(true);
                        setIsBulkUpload(false);
                    }}
                />)}
            </span>
        </div>
    );
    const RefreshEntireList = () => {
        setSelectedContainers([]);
        setSelectAll(false);
    }
    const removeContainer = (idToRemove) => {
        const updated = selectedContainers.filter(item => item.id !== idToRemove);
        setSelectedContainers(updated);
        setSelectAll(updated.length === totalRecords);
    };

    const container_statuses = {
        1: '1-Pending',
        2: '2-Processing',
        3: '3-Completed'
    }

    const container_details_statuses = {
        1: '1-Unprocessed',
        2: '2-MantisImported',
        3: '3-ReceiptComplete',
        4: '4-ReceiptSent',
        5: '5-ReceiptSuccessful'
    }

    const fileUploadHandler = ({ files }) => {
        const [file] = files;
        uploadFile(file);
    };
    const syncIntersite = async (inputFile) => {
        setDisplayConfirmation1(false)
        setLoading(true);

        ManualContainersService.syncData().then((data) => {
            setLoading(false);
            if (data.error == 0) {
                loadLazyData();
                toast.current.show({ severity: 'success', summary: 'Success Message', detail: data.message, life: 3000 });
            } else {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
        });
    }

    const uploadFile = async (inputFile) => {
        fileRef.clear();
        setLoading(true);
        setDisplayConfirmation(false);
        setDisplayBulkConfirmation(false);

        if (!inputFile) {
            toast.current.show({
                severity: 'error',
                summary: 'Validation Error',
                detail: 'File is required.',
                sticky: true,
            });
            setLoading(false);
            setTimeout(() => toast.current.clear(), 1500);
            return;
        }

        const validTypes = [
            'text/csv',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];

        if (!validTypes.includes(inputFile.type)) {
            toast.current.show({
                severity: 'error',
                summary: 'Validation Error',
                detail: 'Invalid file type. Please upload a CSV, XLS, or XLSX file.',
                sticky: true,
            });
            setLoading(false);
            setTimeout(() => toast.current.clear(), 1500);
            return;
        }

        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const data = e.target.result;

                // Enable Excel date parsing
                const workbook = XLSX.read(data, {
                    type: 'binary',
                    cellDates: true
                });

                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                    defval: '',
                    raw: true
                });

                if (jsonData.length === 0) {
                    toast.current.show({
                        severity: 'error',
                        summary: 'Validation Error',
                        detail: 'No data found in the Excel file.',
                        sticky: true,
                    });
                    setLoading(false);
                    setTimeout(() => toast.current.clear(), 1500);
                    return;
                }

                let payload = {};

                if (displayBulkConfirmation) {

                    const ctrnums = jsonData.map((row, index) => {
                        const rowNumber = index + 2;
                        if (!row.ctrnum || row.ctrnum.trim() === '') {
                            throw new Error(`ctrnum is missing from row ${rowNumber}`);
                        }
                        return row.ctrnum;
                    });

                    payload = { ctrnums, bulkLoad: true };

                } else {
                    const orders = jsonData.map((row, index) => {
                        const rowNumber = index + 2;

                        if (!row.ctrnum || row.ctrnum.trim() === '') {
                            throw new Error(`ctrnum is missing from row ${rowNumber}`);
                        }

                        // INLINE & SAFE DATE NORMALIZATION
                        let extrcpdat = "";
                        const rawDate = row.extrcpdat;

                        if (rawDate) {
                            if (rawDate instanceof Date && !isNaN(rawDate)) {
                                extrcpdat = rawDate.toISOString();
                            } else if (typeof rawDate === "number") {
                                const excelEpoch = new Date(Date.UTC(1899, 11, 30));
                                extrcpdat = new Date(
                                    excelEpoch.getTime() + rawDate * 86400000
                                ).toISOString();
                            } else {
                                const parsed = new Date(rawDate);
                                if (!isNaN(parsed)) {
                                    extrcpdat = parsed.toISOString();
                                }
                            }
                        }

                        return {
                            ...row,
                            ctrnum: row.ctrnum.trim(),
                            bpsnum: row.bpsnum ? row.bpsnum.toString() : "",
                            pohnum: isNaN(Number(row.pohnum)) ? null : Number(row.pohnum),
                            poplin: isNaN(Number(row.poplin)) ? null : Number(row.poplin),
                            poqseq: isNaN(Number(row.poqseq)) ? null : Number(row.poqseq),
                            ctrlin: isNaN(Number(row.ctrlin)) ? null : Number(row.ctrlin),
                            itmref: row.itmref ? row.itmref.toString() : "",
                            qtyweu: isNaN(Number(row.qtyweu)) ? null : Number(row.qtyweu),
                            qtyvou: isNaN(Number(row.qtyvou)) ? null : Number(row.qtyvou),
                            extrcpdat,
                            status: container_statuses[1],
                            containerdetails_statuses: container_details_statuses[1]
                        };
                    });
                    const ctrnums = [...new Set(orders.map(o => o.ctrnum))];
                    payload = { bulkLoad: false, orders, ctrnums: ctrnums };
                }

                const dataa = await ManualContainersService.uploadData(payload);

                if (dataa.error === 0) {
                    toast.current.show({
                        severity: 'success',
                        summary: 'File Upload',
                        detail: dataa.message
                    });

                    const gridData = await ManualContainersService.getGrid(lazyState);
                    setTotalRecords(gridData.totalRecords);
                    setContainers(gridData.data);
                    setTemplateUrl(gridData.template_url);
                } else {
                    toast.current.show({
                        severity: 'error',
                        summary: 'File Upload',
                        detail: dataa.message,
                        sticky: true
                    });
                    setTimeout(() => toast.current.clear(), 2000);
                }

                setLoading(false);

            } catch (error) {
                console.error('Processing error:', error);
                toast.current.show({
                    severity: 'error',
                    summary: 'Processing Error',
                    detail: error.message || 'Failed to process file',
                    sticky: true
                });
                setLoading(false);
                setTimeout(() => toast.current.clear(), 1500);
            }
        };

        reader.onerror = () => {
            toast.current.show({
                severity: 'error',
                summary: 'File Read Error',
                detail: 'Failed to read file',
                sticky: true
            });
            setLoading(false);
            setTimeout(() => toast.current.clear(), 1500);
        };

        reader.readAsBinaryString(inputFile);
    };

    const createContainerDetail = () => {
        const data = {
            containers: selectedContainers.map(item => ({
                ctrnum: item.ctrnum,
                shipnum: item.shipnum
            })),
        };
        setbtnDisabled(true);
        setLoading(true);

        ManualContainersService.createContainerDetail(data).then((response) => {
            setLoading(false);
            if (response.error === 0) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: response.message });
                setSelectAll(false);
                setSelectedContainers([]);
                loadLazyData();
            } else {
                toast.current.show({ severity: 'error', summary: 'Error', detail: response.message });
            }
            setbtnDisabled(false);
            setCreateContainerDetailDisplayConfirmation(false);
        });
    };
    const confirmationDialogFooter1 = (
        <>

            <Button type="button" label="Close" icon="pi pi-times" onClick={() => setDisplayConfirmation(false)} className="p-button-text" />
        </>
    );
    const confirmationBulkDialogFooter1 = (
        <>

            <Button type="button" label="Close" icon="pi pi-times" onClick={() => setDisplayBulkConfirmation(false)} className="p-button-text" />
        </>
    );
    const createContainerDetailConfirmationDialogFooter = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setCreateContainerDetailDisplayConfirmation(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" disabled={btnDisabled} onClick={() => createContainerDetail()} className="p-button-text" autoFocus />
        </>
    );


    return (
        <>
            <Helmet>
                <title>{titles.Containers}</title>
            </Helmet>
            <Toast ref={toast} />
            <BreadCrumb model={items} home={home} />
            <Dialog header="Confirmation" visible={importReadyDisplayConfirmation} onHide={() => setimportReadyDisplayConfirmation(false)} style={{ width: '350px' }} modal footer={importReadtconfirmationDialogFooter}>
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
            <Dialog header="Confirmation" visible={markReceiptCompleteDisplayConfirmation} onHide={() => setMarkReceiptCompleteDisplayConfirmation(false)} style={{ width: '350px' }} modal footer={markReceiptCompletetconfirmationDialogFooter}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to proceed?</span>
                </div>
            </Dialog>
            <Dialog header="Confirmation" visible={createContainerDetailDisplayConfirmation} onHide={() => setCreateContainerDetailDisplayConfirmation(false)} style={{ width: '350px' }} modal footer={createContainerDetailConfirmationDialogFooter}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to create container details for the selected containers?</span>
                </div>
            </Dialog>
            <Dialog header="Confirmation" visible={delteContainerDisplayConfirmation} onHide={() => setDelteContainerDisplayConfirmation(false)} style={{ width: '350px' }} modal footer={deleteContainerConfirmationDialogFooter}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to proceed?</span>
                </div>
            </Dialog>
            <Dialog header="Confirmation" visible={displayConfirmation1} onHide={() => setDisplayConfirmation1(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter2}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to proceed?</span>
                </div>
            </Dialog>
            <Dialog header="Upload" visible={displayConfirmation} onHide={() => setDisplayConfirmation(false)} style={{ width: '550px' }} modal footer={confirmationDialogFooter1}>
                <Link to={templateUrl} >Download Template</Link>
                <h1></h1>
                <FileUpload name="file[]"
                    ref={(el) => fileRef = el}
                    customUpload={true}
                    uploadHandler={fileUploadHandler}
                    accept=".xls,.csv,.xlsx"
                    emptyTemplate={<p className="m-0">Drag and drop file here to upload.</p>}
                />
            </Dialog>
            <Dialog header="Bulk Load & Complete" visible={displayBulkConfirmation} onHide={() => setDisplayBulkConfirmation(false)} style={{ width: '550px' }} modal footer={confirmationBulkDialogFooter1}>
                <Link to={templateUrl} >Download Template</Link>
                <h1></h1>
                <FileUpload name="file[]"
                    ref={(el) => fileRef = el}
                    customUpload={true}
                    uploadHandler={fileUploadHandler}
                    accept=".xls,.csv,.xlsx"
                    emptyTemplate={<p className="m-0">Drag and drop file here to upload.</p>}
                />
            </Dialog>
            <h1></h1>
            <div className="card">
                <h3>Containers</h3>
                <DataTable
                    value={containers}
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
                    rowsPerPageOptions={[25, 50, 100, 500, 1000]}
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords} records"
                    loading={loading}
                    tableStyle={{ minWidth: '75rem' }}
                    emptyMessage="No Container found."
                    selection={selectedContainers}
                    onSelectionChange={onSelectionChange}
                    selectAll={selectAll}
                    onSelectAllChange={onSelectAllChange}
                    header={header}
                    scrollable
                    scrollHeight="600px"

                >
                    <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
                    <Column field="ctrnum" header="Container #" body={ctrnumBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="shipnum" header="Shipment #" body={shipNumBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="formatted_created_at" header="Created At" body={(rowData) => rowData.formatted_created_at} headerStyle={{ width: '10rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="contain_invalid_items" header="Contains Invalid Items" body={contain_invalid_itemsBodyTemplate} showFilterMenu={false} filter filterElement={globalRowFilterTemplate1} />
                    <Column field="mantis_imported_H" sortable filter header="Mantis Imported" body={mantis_importedBodyTemplate} showFilterMenu={false} filterElement={globalRowFilterTemplate2} />
                    <Column field="import_ready" sortable filter header="Import Ready" body={import_readyBodyTemplate} showFilterMenu={false} filterElement={globalRowFilterTemplate2} />
                    <Column field="conveyable" header="Conveyable" body={conveyableBodyTemplate} filter showFilterMenu={false} filterElement={globalRowFilterTemplate3} />
                    <Column field="is_transfer" header="Intersite Trans." body={isTransferBodyTemplate} filter showFilterMenu={false} filterElement={globalRowFilterTemplate} />
                    <Column field="status" header="Status" body={statusBodyTemplate} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="hasLotInfo" header="Has LOT" body={hasLotBodyTemplate} filter showFilterMenu={false} filterElement={globalRowFilterTemplate2} />


                </DataTable>
            </div>
        </>

    );
}
