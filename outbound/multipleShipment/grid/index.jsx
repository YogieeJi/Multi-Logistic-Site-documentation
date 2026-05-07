
import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { outboundShipmentService } from '../../../../service/outbound/outboundShipmentService';
import { Controller, useForm } from 'react-hook-form';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { BreadCrumb } from 'primereact/breadcrumb';
import { useDispatch, useSelector } from 'react-redux';
import { removeData } from "../../../../store/formMessage.slice"
import { Badge } from 'primereact/badge';
import { Helmet } from 'react-helmet';
import titles from '../../../titles';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { PicklistService } from '../../../../service/outbound/PicklistService';
import { DeliveryService } from '../../../../service/outbound/DeliveryService';
import { Link, useNavigate } from 'react-router-dom';
import { LocationsService } from '../../../../service/misc/LocationsService';
import { OrdersImportService } from '../../../../service/outbound/OrdersImportService';
import { Menu } from 'primereact/menu';
import { MultiSelect } from 'primereact/multiselect';
import { OverlayPanel } from 'primereact/overlaypanel';
import { useLazySort } from "../../../../components/useLazySort";
import { useAuth } from '../../../../store/useAuth';


export default function Shipment() {
    const { hasActionAccess } = useAuth();
    const PAGE_KEY = "outbound_multipleShipment";
    const { hasPageAccess } = useAuth();
    const Detail_PAGE_KEY = "Create Shipment Details";
    const [loading, setLoading] = useState(false);
    const [totalRecords, setTotalRecords] = useState(0);
    const navigate = useNavigate();
    const [delivery, setDelivery] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(null);

    const [selectedLanes, setSelectedLanes] = useState(null);
    const [removeItemData, setRemoveItemData] = useState({
        id: '',
    });
    let defaultValues = {
        truck: '',
        location_id: '',
    };
    const dispatch = useDispatch()
    const form = useForm({ defaultValues });
    const globalFlags = [
        { code: '1', name: 'pending' },
        { code: '2', name: 'ready to ship' },
        { code: '3', name: 'preparing' },
    ];
    const flagTemplate = (option) => {
        return <Badge value={option.name} severity={getSeverity(option.name)} />;
    };

    const hasShipmentTemplate = (rowData) => {
        // const isCompleted = rowData.shp_statusID == 8 || rowData.shp_statusID  == 6; 
        // console.log(isCompleted);
        const hasShipments = rowData.orderCount > 0;//&& !isCompleted;
        //console.log(hasShipments);

        return (
            <Badge
                value={hasShipments ? "Yes" : "No"}
                severity={hasShipments ? "success" : "danger"}
            />
        );
    };

    const [btnDisabled, setbtnDisabled] = useState(false);
    const menuLeft = useRef(null);
    const [selectAll, setSelectAll] = useState(false);
    const [selectedDelivery, setSelectedDelivery] = useState([]);
    const [dates, setDates] = useState(null);
    const [displayConfirmation, setDisplayConfirmation] = useState(false);
    const [displayConfirmation1, setDisplayConfirmation1] = useState(false);
    const [displayConfirmation6, setDisplayConfirmation6] = useState(false);
    const [displayConfirmation7, setDisplayConfirmation7] = useState(false);
    const [markshipmentdisplayConfirmation, setMarkShipmentDisplayConfirmation] = useState(false);
    const [assignloc, setAssignLoc] = useState(false);
    const [truckOptions, setTruckOptions] = useState([]);
    const [locationOptions, setLocationOptions] = useState([]);
    const toast = useRef();
    const [laneslist, setLanesList] = useState(null);
    const [selectedLocations, setSelectedLocations] = useState(null);
    const op = useRef(null);
    const optionsList = (selectedDelivery || []).map(delivery => ({
        label: `${delivery.trk_Code}`,
        value: delivery.trk_ID
    }));

    const multiselectFooterTemplate = () => {
        const length = selectedLocations ? selectedLocations.length : 0;

        return (
            <div className="py-2 px-3">
                <b>{length}</b> item{length > 1 ? 's' : ''} selected.
            </div>
        );
    };
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 25,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {
            trk_Code: { value: null, matchMode: 'contains' },
            truckCodePlate: { value: null, matchMode: 'contains' },
            dispatchMethodCodeName: { value: null, matchMode: 'contains' },
            loc_Code: { value: null, matchMode: 'contains' },
            shp_ShipDate: { value: null, matchMode: 'contains' }
        }
    });
    const { onSort } = useLazySort(setlazyState);
    const items = [{ label: 'Outbound' }, { label: 'Create Shipment' }];
    const home = { icon: 'pi pi-home', url: '/' }
    const confirmationDialogFooter6 = (
        <div>
            <Button label="Submit" disabled={btnDisabled} icon="pi pi-check" onClick={() => onSubmitLanes()} />
        </div>
    );
    const assignFooter = (
        <div>
            <Button label="Submit" disabled={btnDisabled} icon="pi pi-check" onClick={() => onTruckAndDock()} />
        </div>
    );
    let networkTimeout = null;
    const onSubmitLanes = () => {

        setbtnDisabled(true);
        const data = {
            order: selectedDelivery,
            lanes: selectedLanes,
        }
        outboundShipmentService.assignShipmentOrder((data)).then((data) => {
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


    const getSeverity1 = (flag) => {
        switch (flag) {
            case 'pending':
                return 'info';

            case 'ready to ship':
                return 'success';
            case 'preparing':
                return 'warning';
            default:
                return 'secondary';
        }
    };

    const getSeverity = (status) => {
        // const infoStatuses = ['1'];      
        // const successStatuses = ['2'];   
        const status1 = status?.toLowerCase() || '';
        if (status1.includes('pending')) {
            return 'info';
        } else if (status1.includes('ready to ship')) {
            return 'success';
        } else if (status1.includes('preparing')) {
            return 'warning';
        }
        else if (status1.includes('complete')) {
            return 'success';
        }
        else {
            return 'secondary';
        }
    };
    const getStatusLabel = (status) => {
        if (status == 1) {
            return 'Pending';
        } else if (status == 2) {
            return 'Ready to Ship';
        } else {
            return 'Unknown';
        }
    };



    const globalRowFilterTemplate = (options) => {
        return (
            <Dropdown style={{ minWidth: '3em', width: '3em' }} value={options.value}
                optionValue="code" optionLabel="name" options={globalFlags}
                onChange={(e) => {
                    options.filterApplyCallback(e.value); // Apply the filter
                }}

                itemTemplate={flagTemplate} placeholder="Select" className="p-column-filter" showClear />
        );
    };
    useEffect(() => {
        const fetchTrucks = async () => {

            try {
                const response = await outboundShipmentService.getTrucksGrid(); // Fetch trucks

                setTruckOptions(response);
                setLoading(false);
            } catch (error) {
                //console.error('Error fetching truck options', error);
                setLoading(false);
            }

            try {
                const response = await outboundShipmentService.getTruckslocation(); // Fetch 
                setLocationOptions(response.data);
                setLoading(false);
            } catch (error) {
                //console.error('Error fetching location options', error);
                setLoading(false);
            }

        };

        fetchTrucks();
    }, []);

    useEffect(() => {
        if (!delivery || delivery.length === 0) {
            setSelectAll(false);
            return;
        }

        setSelectedDelivery(prevSelected => {
            const stillExisting = prevSelected.filter(sel =>
                delivery.some(d => d.shp_ID === sel.shp_ID) ||

                true
            );
            return stillExisting;
        });

        const currentPageIds = delivery.map(d => d.shp_ID);
        const isAllCurrentPageSelected = currentPageIds.every(id =>
            selectedDelivery.some(sel => sel.shp_ID === id)
        );
        setSelectAll(isAllCurrentPageSelected);

    }, [delivery]);

    const formMessageDetail = useSelector((state) => state.formMessage.detail)
    const formMessageSeverity = useSelector((state) => state.formMessage.severity)
    const formMessageSummary = useSelector((state) => state.formMessage.summary)


    useEffect(() => {
        if (formMessageDetail != '') {
            toast.current.show({ severity: formMessageSeverity, summary: formMessageSummary, detail: formMessageDetail });
            dispatch(removeData());
        }
        loadLazyData();
    }, [lazyState]);

    const loadLazyData = () => {
        setLoading(true);

        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }

        //imitate delay of a backend call
        networkTimeout = setTimeout(() => {
            outboundShipmentService.getshipment((lazyState)).then((data) => {
                setTotalRecords(data.totalRecords);
                setDelivery(data.data);
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

    const onSelectionChange = (event) => {
        const selectedRows = event.value;
        setSelectedDelivery(selectedRows);

        // IDs on current page
        const currentPageIds = delivery.map(d => d.shp_ID);

        // Selected IDs on current page
        const selectedCurrentPageIds = selectedRows
            .filter(sel => currentPageIds.includes(sel.shp_ID))
            .map(sel => sel.shp_ID);

        // Select-all should be true ONLY if all rows on current page are selected
        const allSelected = currentPageIds.length > 0 && currentPageIds.length === selectedCurrentPageIds.length;

        setSelectAll(allSelected);
    };

    const onSelectAllChange = (event) => { 
        const selectAllChecked = event.checked;
        setSelectAll(selectAllChecked);

        if (selectAllChecked) {
            const newSelection = [...selectedDelivery];
            delivery.forEach(d => {
                if (!newSelection.some(sel => sel.shp_ID === d.shp_ID)) {
                    newSelection.push(d);
                }
            });
            setSelectedDelivery(delivery);
        } else {
            const filtered = selectedDelivery.filter(
                item => !delivery.some(d => d.shp_ID === item.shp_ID)
            );
            setSelectedDelivery(filtered);
        }
    };

    // const codeBodyTemplate = (rowData) => {
    //     //console.log("RowData columns:", Object.keys(rowData), rowData); 
    //     // const hasShipment = rowData.ShipmentCount !== '0';
    //     // const isCompleted = rowData.shp_statusID == 8 || rowData.shp_statusID  == 6; 
    //     // console.log(isCompleted);
    //     const hasShipment = rowData.orderCount > 0 //&& !isCompleted;

    //     return (
    //         <>
    //             {hasShipment ? (
    //                 // If shp_Code exists → go to edit page
    //                 <Link
    //                     to={{
    //                         // pathname: `/outbound/multiple-shipment/edit/${rowData.trk_Code}`,
    //                         pathname: `/outbound/shipment/${rowData.trk_ID}`,

    //                     }}
    //                     state={{ selectedRow: rowData }}
    //                 >
    //                     {rowData.trk_Code}
    //                 </Link>
    //             ) : (
    //                 // If shp_Code is null/empty/NO SHIPMENT → go to create page
    //                 <Link
    //                     to={{
    //                         pathname: `/outbound/multiple-shipment-add/${rowData.trk_ID}`,
    //                     }}
    //                     state={{ selectedRow: rowData }}
    //                 >
    //                     {rowData.trk_Code}
    //                 </Link>
    //             )}
    //         </>
    //     );
    // };
    const codeBodyTemplate = (rowData) => {
    const hasShipment = rowData.orderCount > 0;

    // Check access for detail page
    const hasDetailAccess = hasPageAccess(Detail_PAGE_KEY);

    const redirectPath = hasShipment
        ? `/outbound/shipment/${rowData.trk_ID}`
        : `/outbound/multiple-shipment-add/${rowData.trk_ID}`;

    return (
        <>
            {hasDetailAccess ? (
                <Link
                    to={redirectPath}
                    state={{ selectedRow: rowData }}
                >
                    {rowData.trk_Code}
                </Link>
            ) : (
                // Not clickable, just plain text
                <span>{rowData.trk_Code}</span>
            )}
        </>
    );
};

    const dltBodyTemplate = (rowData) => {
        return (<Button type="button" onClick={() => removeItemsPopup(rowData.shp_ID)} icon="pi pi-trash" rounded></Button>);

    };

    const removeItemsPopup = (id) => {
        setRemoveItemData({
            id
        })
        setDisplayConfirmation1(true)
    }
    const releaseLocation = () => {
        setbtnDisabled(true);
        setLoading(true);
        const data = {
            shp_ID: selectedDelivery.map(item => item.shp_ID)
        }

        outboundShipmentService.releaseLocation(data).then((data) => {
            setLoading(false);
            if (data.error == 0) {
                toast.current.show({ severity: 'success', summary: 'Success Message', detail: data.message, life: 3000 });
            } else {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
            // loadGrid({});
            setSelectedDelivery([]);
            setDisplayConfirmation7(false)
            setbtnDisabled(false);
            loadLazyData();
        });
    }
    const removeItem = () => {
        setbtnDisabled(true);
        setLoading(true);
        outboundShipmentService.deleteShipment(removeItemData).then((data) => {
            setLoading(false);
            if (data.error == 0) {
                toast.current.show({ severity: 'success', summary: 'Success Message', detail: data.message, life: 3000 });
                setSelectedDelivery(prev =>
                    prev.filter(item => item.shp_ID !== removeItemData.id)
                );

            } else {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
            // loadGrid({});
            setDisplayConfirmation1(false)
            setbtnDisabled(false);
            loadLazyData();
        });

    }

    const markshipmentcomplete = () => {
        setbtnDisabled(true);
        setLoading(true);
        const data = {
            shp_ID: selectedDelivery
            .filter(item => item?.shp_ID) 
            .flatMap(item => 
                String(item.shp_ID)
                    .split(',')
                    .map(id => Number(id.trim()))
                    .filter(num => !isNaN(num)) 
            )
        }
        
        outboundShipmentService.markShipmentComplete(data).then((data) => {
            setLoading(false);
            if (data.error == 0) {
                toast.current.show({ severity: 'success', summary: 'Success Message', detail: data.message, life: 3000 });
            } else {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
            // loadGrid({});
            setSelectedDelivery([]);
            setMarkShipmentDisplayConfirmation(false)
            setbtnDisabled(false);
            loadLazyData();
        });
    }

    const createdAtBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.created_at}
            </>
        );
    };
    const created_atBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.shp_ShipDate ? rowData.shp_ShipDate.replace("T", " ") : ""}
            </>
        );
    };
    const statusBodyTemplate = (rowData) => {

        return (
            <>
                <Badge value={rowData.messageName} severity={getSeverity(rowData.messageName)} />
            </>
        );
    };

    const trk_IDBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.truckCodePlate}
            </>
        );
    };
    const dispatch_methodBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.dispatchMethodCodeName}
            </>
        );
    };

    const location_idBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.loc_Code}
            </>
        );
    };

    const syncDetails = () => {
        setDisplayConfirmation(false)
        setLoading(true);
        DeliveryService.syncData().then((data) => {
            setLoading(false);
            if (data.error == 0) {
                loadLazyData();
                toast.current.show({ severity: 'success', summary: 'Success Message', detail: data.message, life: 3000 });
            } else {
                toast.current.show({ severity: 'error', summary: 'Error Message', detail: data.message, life: 3000 });
            }
        });
    };

    const confirmationDialogFooter = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => syncDetails()} className="p-button-text" autoFocus />
        </>
    );
    const confirmationDialogFooter7 = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation7(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => releaseLocation()} className="p-button-text" autoFocus />
        </>
    );
    const markshipmentconfirmationDialogFooter = (
        <>
            <Button type="button" label="No" icon="pi pi-times" onClick={() => setMarkShipmentDisplayConfirmation(false)} className="p-button-text" />
            <Button type="button" label="Yes" icon="pi pi-check" onClick={() => markshipmentcomplete()} className="p-button-text" autoFocus />
        </>
    );
    const confirmationDialogFooter1 = (
        <>
            <Button type="button" disabled={btnDisabled} label="No" icon="pi pi-times" onClick={() => setDisplayConfirmation1(false)} className="p-button-text" />
            <Button type="button" disabled={btnDisabled} label="Yes" icon="pi pi-check" onClick={() => removeItem()} className="p-button-text" autoFocus />
        </>
    );

    const actionItems = [
        hasActionAccess(PAGE_KEY, "mark_shipment_complete")&&{
            label: 'Mark Shipment Complete',
            icon: 'pi pi-check',
            command: () => {
                if (selectedDelivery != null && selectedDelivery.length > 0) {

                    setbtnDisabled(true)
                    setMarkShipmentDisplayConfirmation(true);
                } else {
                    toast.current.show({ severity: 'error', summary: 'Error', detail: 'Atleast select 1 order' });
                }
            }
        },
    ].filter(Boolean);

    const getLanes = () => {
        LocationsService.getLanes().then((data) => {
            if (data.error == 0) {
                setLanesList(data.data);
                setSelectedLanes(data.selectedLanes)
            }
        });
    }

    const header = (
        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center">

            <span className="flex mt-2 md:mt-0 p-input-icon-left">
                {actionItems.length > 0 && (<><i className="pi pi-search" />
                <Menu model={actionItems} popup ref={menuLeft} id="popup_menu_left" />
                <Button label="Actions" icon="pi pi-align-left" className="mr-2" onClick={(event) => menuLeft.current.toggle(event)} aria-controls="popup_menu_left" aria-haspopup /> </>)}

                <div className="block mt-2 md:mt-0 flex align-items-center bg-bd-cl">
                    <Button
                        onClick={() => RefreshEntireList()}
                        icon="pi pi-times"
                        className="p-button-text p-button-gray mr-3"
                        tooltip="Close"
                        tooltipOptions={{ position: 'top' }}
                    />
                    <label htmlFor="PickList ID">Truck Name : </label>
                    <span className="selected-count ml-2">
                        {selectedDelivery.length > 0
                            ? `${selectedDelivery.length} Record${selectedDelivery.length > 1 ? 's' : ''} Selected`
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
                                            onClick={() => removeDelivery(option.value)}
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                    </OverlayPanel>


                </div>

            </span>
            
            {/* <span className="block mt-2 md:mt-0 p-input-icon-left">
                <Button label="Multiple Shipment" icon="pi pi-plus" severity="sucess" onClick={() =>navigate("/outbound/multiple-shipment-add")} />
            </span> */}
        </div>
    );



    const RefreshEntireList = () => {
        setSelectedDelivery([]);
        setSelectAll(false);
    };

    const removeDelivery = (idToRemove) => {
        const updated = selectedDelivery.filter(item => item.trk_ID !== idToRemove);

        setSelectedDelivery(updated);
        // Recalculate select-all for current page
        const currentPageIds = delivery.map(d => d.trk_ID);
        const selectedCurrentPageCount = updated.filter(sel => currentPageIds.includes(sel.trk_ID)).length;
        const allSelected = currentPageIds.length > 0 && selectedCurrentPageCount === currentPageIds.length;
        setSelectAll(allSelected);
    };

    const representativeRowFilterTemplate = (options) => {
        return (
            <Calendar value={dates} onChange={(e) => setDates(e.value)} selectionMode="range" readOnlyInput />

        );
    };
    
    const errors = form.formState.errors;
    const getFormErrorMessage = (name) => {
        return errors[name] ? <small className="p-error">{errors[name].message}</small> : null;
    };

    const onTruckAndDock = () => {
        setLoading(true);
        setbtnDisabled(true);
        const data = {
            truck: form.getValues('truck'),
            dock: form.getValues('location_id'),
            order: selectedDelivery,

            // lanes: selectedLanes,
        }
        outboundShipmentService.addTruckAndDock((data)).then((data) => {
            setLoading(false);
            if (data.error == 0) {
                toast.current.show({ severity: 'success', summary: 'Success', detail: data.message });
                setSelectAll(false);
                setSelectedDelivery([]);
                loadLazyData();
                setAssignLoc(false);
                form.setValue("truck", null);
                form.setValue("location_id", null);

            }

            else {
                setAssignLoc(false);
                form.setValue("truck", null);
                form.setValue("location_id", null);
                toast.current.show({ severity: 'error', summary: 'Error', detail: data.message });
            }
            form.setValue("truck", null);
            form.setValue("location_id", null);
            setAssignLoc(false);
            setbtnDisabled(false);
            setDisplayConfirmation6(false)
        });

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
            <Dialog header="Confirmation" visible={displayConfirmation7} onHide={() => setDisplayConfirmation7(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter7}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to proceed?</span>
                </div>
            </Dialog>
            <Dialog header="Confirmation" visible={markshipmentdisplayConfirmation} onHide={() => setMarkShipmentDisplayConfirmation(false)} style={{ width: '350px' }} modal footer={markshipmentconfirmationDialogFooter}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to proceed?</span>
                </div>
            </Dialog>
            <Dialog header="Assign Lanes" visible={displayConfirmation6} style={{ width: '50vw' }} onHide={() => setDisplayConfirmation6(false)} footer={confirmationDialogFooter6}>
                <div className="p-fluid formgrid grid">
                    <div className="field col-12 md:col-9">
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

                        />
                    </div>
                </div>
            </Dialog>
            <Dialog header="Assign Truck And Dock Location" visible={assignloc} style={{ width: '50vw' }} onHide={() => { setAssignLoc(false); form.setValue("truck", null); form.setValue("location_id", null); }} footer={assignFooter}>
                <div className="p-fluid formgrid grid">
                    <div className="field col-12 md:col-9">
                        <label>Truck*</label>
                        <Controller
                            name="truck"
                            control={form.control}
                            // rules={{ required: 'Plate Number is required.' }}
                            render={({ field, fieldState }) => (
                                <>
                                    <Dropdown
                                        id={field.name}
                                        value={field.value}
                                        key={field.name}
                                        editable
                                        optionValue="trk_ID"
                                        optionLabel="trk_Code"
                                        onChange={(e) => field.onChange(e.target.value)}
                                        options={truckOptions}
                                        placeholder="Select a Truck"
                                    />
                                    {getFormErrorMessage(field.name)}
                                </>
                            )}
                        />
                    </div>
                    <div className="field col-12 md:col-9">
                        <label>Dock Door*</label>
                        <Controller
                            name="location_id"
                            control={form.control}
                            // rules={{ required: 'Location is required.' }}
                            render={({ field, fieldState }) => (
                                <>
                                    <Dropdown
                                        id={field.name}
                                        key={field.name}
                                        value={field.value}
                                        editable
                                        optionValue="loc_code"
                                        optionLabel="loc_code"
                                        options={locationOptions}
                                        onChange={(e) => {
                                            field.onChange(e.target.value);
                                            setbtnDisabled(false);
                                        }}
                                        placeholder="Select a Location"
                                    />
                                    {getFormErrorMessage(field.name)}
                                </>
                            )}
                        />
                    </div>
                </div>
            </Dialog>
            <Dialog closable={false} header="Confirmation" visible={displayConfirmation1} onHide={() => setDisplayConfirmation1(false)} style={{ width: '350px' }} modal footer={confirmationDialogFooter1}>
                <div className="flex align-items-center justify-content-center">
                    <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
                    <span>Are you sure you want to remove this shipment?</span>
                </div>
            </Dialog>
            <h1></h1>
            <div className="card">
                <h3>Trucks</h3>
                <DataTable
                    value={delivery}
                    lazy
                    filterDisplay="row"
                    dataKey="trk_ID"
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
                    <Column field="trk_Code" header="Truck Name " body={codeBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="has_shipments" header="Has Shipments" body={hasShipmentTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} />
                    <Column field="truckPalletCount" sortable header="Pallet Count" body={(rowData) => rowData.truckPalletCount} /*filterMenuStyle={{ width: '14rem' }} showFilterMenu={false}  filter filterPlaceholder="Search" */ />
                    <Column field="loc_Code" sortable header="Location" body={(rowData) => rowData.loc_Code} showFilterMenu={false} filter filterPlaceholder="Search" />
                    <Column field="shp_ShipDate" header="Ship Date" body={created_atBodyTemplate} filterMenuStyle={{ width: '14rem' }} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                    <Column field="orderCount" header="Order Count" body={(rowData) => rowData.orderCount} />
                </DataTable>
            </div>
        </>

    );
}
