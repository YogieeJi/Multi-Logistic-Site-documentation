import React, { useEffect, useRef, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Controller, set, useForm } from 'react-hook-form';
import { classNames } from 'primereact/utils';
import { Toast } from 'primereact/toast';
import { useDispatch } from 'react-redux';
import { addData } from '../../../../store/formMessage.slice';
import { matchPath, useLocation, useNavigate, useParams } from 'react-router-dom';
import { outboundShipmentService } from '../../../../service/outbound/outboundShipmentService';
import { Dropdown } from 'primereact/dropdown';
import { Badge } from 'primereact/badge';
import { Calendar } from 'primereact/calendar'; // Import PrimeReact Calendar
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog'; // Import PrimeReact Dialog (modal)
import { Link } from 'react-router-dom';
import { useAuth } from '../../../../store/useAuth';


export default function AddItemConversion() {
    const { hasActionAccess } = useAuth();
        const PAGE_KEY = "Create Shipment Details";
    const [loading, setLoading] = useState(false);
    const [loading1, setLoading1] = useState(false);
    const [editTruckID, setEditTruckID] = useState(0);
    const [editCode, setEditCode] = useState(0);
    const [totalRecords, setTotalRecords] = useState(0);
    const [totalRecords1, setTotalRecords1] = useState(0);
    const [selectMantisOrderAll, setSelectMantisOrderAll] = useState(false);
    const [selectAll, setSelectAll] = useState(false);
    const [orders, setOrders] = useState(null);
    const dispatch = useDispatch()
    const params = useParams();
    const routePath = useLocation();
    const toast = useRef(null);
    const navigate = useNavigate();
    const [truckOptions, setTruckOptions] = useState([]);
    const [locationOptions, setLocationOptions] = useState([]);
    const [heading, setHeading] = useState('Create Shipment');
    const matchedPath = matchPath({ path: '/outbound/shipment/edit/' + params.id, end: false }, routePath.pathname);
    const [dates, setDates] = useState(null);
    const [selectedOrderShipment, setSelectedOrderShipment] = useState(null);
    const [selectedMantisOrders, setSelectedMantisOrders] = useState(null);
    const [shipmentOrders, setShipmentOrders] = useState(null);
    const dateRef = useRef(null);    
    let defaultValues = {
        code: '',
        truck: '',
        location_id: '',
        ship_date: ''
    };
    const [visible, setVisible] = useState(false); // State to control modal visibility
    const openModal = () => {
        setVisible(true);

    };

    const closeModal = () => {
        setVisible(false); // Close modal
    };
    const AddOrdersToGrid = () => {
        // selectedMantisOrders
        setShipmentOrders(selectedMantisOrders);
        setSelectedOrderShipment(selectedMantisOrders);
        setSelectAll(true);
        setVisible(false);
    }



    const ord_CodeBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.ost_Code}
            </>
        );
    };
    const customer_codeBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.customer_Code}
            </>
        );
    };
    const ost_ExecuteDateBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.ost_ExecuteDate}
            </>
        );
    };
    const ost_ShipDateBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.ost_ShipDate}
            </>
        );
    };


    const ost_WeightBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.ost_Weight}
            </>
        );
    };

    const ost_DeliveryDateBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.ost_DeliveryDate}
            </>
        );
    };

    const ost_WeightUnitIDBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.weight}
            </>
        );
    };
    const ost_VolumeDBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.ost_Volume}
            </>
        );
    };
    const ost_VolumeUnitIDBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.ost_VolumeUnitID}
            </>
        );
    };

    const ost_LoadingPriorityDBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.ost_LoadingPriority}
            </>
        );
    };

    const AgencyBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.Agency}
            </>
        );
    };

    const ship_toBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.ship_To}
            </>
        );
    };

    const OrderShipmentStatusBodyTemplate = (rowData) => {
        let statusSeverity = 'secondary';

        const status = rowData.orderShipmentStatus?.toLowerCase() || '';

        if (status.includes('pending')) {
            statusSeverity = 'warning';
        } else if (status.includes('picked')) {
            statusSeverity = 'info';
        } else if (status.includes('packed')) {
            statusSeverity = 'success';
        }



        return (
            <Badge
                value={rowData?.orderShipmentStatus}
                severity={statusSeverity}
                rounded
                className="custom-badge"
            />
        );
    };
    useEffect(() => {
        if (matchedPath !== null) {
            getDetails();
            setHeading('Edit Shipment');
        }
    }, [params.id]);
    // const location = useLocation();
    // const shp_Code = location.state?.shp_ID; 
    const form = useForm({ defaultValues });
    const errors = form.formState.errors;
    const getDetails = () => {
        setLoading1(true);
        // outboundShipmentService.getShipmentEdit(params.id).then((data) => {
        //     //console.log(data.data[0]?.TruckCodePlate); return false
        //     form.setValue('code', data.data[0]?.shp_Code ?? '');
        //     form.setValue('truck', data.data[0]?.truckCodePlate ?? '');
        //     setEditTruckID(data.data[0]?.shp_TruckID)
        //     setEditCode(data.data[0]?.shp_Code)
        //     form.setValue('location_id', data.data[0]?.loc_Code ?? '');
        //     form.setValue('ship_date', data.data[0]?.shp_ShipDate ?? '');
        //     setTotalRecords1(data.data[0]?.shipment_Detail ?? '');
        //     setShipmentOrders(data.data[0]?.shipment_Detail ?? '');
        //     setLoading1(false);
        //     if (Object.keys(data?.data[0]?.shipment_Detail ?? {}).length > 0) {
        //         setSelectAll(true);
        //         setSelectedOrderShipment(data.data[0]?.shipment_Detail ?? '');
        //         setSelectedMantisOrders(data.data[0]?.shipment_Detail ?? '');
        //     }
        // });

        outboundShipmentService.getShipmentEditTruck(params.id)
            .then((data) => {
                if (data.error === 0 && data.data.length > 0) {
                    // Example: setting first shipment values
                    form.setValue('code', data.data[0]?.ost_Code ?? '');
                    form.setValue('ship_date', data.data[0]?.ost_ShipDate ?? '');
                    form.setValue('truck',data.data[0]?.truckCodePlate??'');
                    form.setValue('location_id',data.data[0]?.loc_Code??'');
                    // loc_code

                    setEditCode(data.data[0]?.shp_Code);
                    setEditTruckID(data.data[0]?.shp_TruckID)
             
                    // Since there is no shipment_detail, use the whole array
                    setShipmentOrders(data.data);
                    setTotalRecords1(data.data.length);
    
                    if (data.data.length > 0) {
                        setSelectAll(true);
                        setSelectedOrderShipment(data.data);
                        setSelectedMantisOrders(data.data);
                    }
                } else {
                    toast.current.show({ severity: 'warn', summary: 'Warning', detail: 'No shipment data found' });
                }
            })
                
            .catch((err) => {
                //console.error("Error in getDetails:", err);
                toast.current.show({ severity: 'error', summary: 'Error', detail: 'Failed to fetch details' });
            })
            .finally(() => setLoading1(false)); // ensures spinner stops
    };

    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 25,
        page: 0,
        sortField: "",
        sortOrder: "asc",
        filters: {
            ord_InputDate: { value: null },
            ost_Code: { value: null },
            ost_ExecuteDate: { value: null },
            ost_ShipDate: { value: null },
            ost_DeliveryDate: { value: null },
            ost_LoadingPriority: { value: null },
            orderShipmentStatus: { value: null },
            ship_To: { value: null },
            customer_Code: { value: null }

        }
    });
    const [lazyState1, setlazyState1] = useState({
        first: 0,
        rows: 25,
        page: 1,
        sortField: "",
        sortOrder: "",
        filters: {

        }
    });
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
        loadOrderData();
    }, [lazyState]);

    const loadOrderData = () => {
        setLoading(true);

        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }

        //imitate delay of a backend call
        networkTimeout = setTimeout(() => {
            outboundShipmentService.getOrdersGrid((lazyState)).then((data) => {

                setTotalRecords(data.totalRecords);
                setOrders(data.data);
                setLoading(false);
            });
        }, Math.random() * 100 + 250);
    };

    const onPage = (event) => {
        setlazyState(event);
    };

    const onSort1 = (event) => {
        setlazyState1(event);
    };

    const onPage1 = (event) => {
        setlazyState1(event);
    };

    const onSort = (event) => {
        if (!event.sortField) {
            return; // Prevent crashing when event is empty
        }
        setlazyState((prevState) => {

            let newSortOrder;
            const currentSortOrder = prevState.sortOrder?.toString() || "0";
            if (prevState.sortField === event.sortField) {
                if (currentSortOrder === "1") {
                    newSortOrder = "-1";  // Descending
                } else if (currentSortOrder === "-1") {
                    newSortOrder = "0";  // No Sort
                } else {
                    newSortOrder = "1";  // Ascending
                }
            } else {
                newSortOrder = "1";
            }

            // If sorting is reset (0), clear the sort field
            const newSortField = newSortOrder === "0" ? "" : event.sortField;
            return {
                ...prevState,
                sortField: newSortField,  // Clear the field when sorting is reset
                sortOrder: newSortOrder,
            };

        });
    };

    const onFilter = (event) => {
        event['first'] = 0;
        setlazyState(event);
    };

    const onMantisOrderSelectionChange = (event) => {
        const value = event.value;

        setSelectedMantisOrders(value);
        setSelectMantisOrderAll(value.length == totalRecords);
    };
    const onMantisOrderSelectAllChange = (event) => {
        const selectAll = event.checked;

        if (selectAll) {

            setSelectMantisOrderAll(true);
            setSelectedMantisOrders(orders);

        } else {
            setSelectMantisOrderAll(false);
            setSelectedMantisOrders([]);
        }
    }
    const onSelectionChange = (event) => {
        const value = event.value;

        setSelectedOrderShipment(value);
        setSelectAll(value.length == selectedMantisOrders.length);
    };



    const onSelectAllChange = (event) => {
        const selectAll = event.checked;

        if (selectAll) {

            setSelectAll(true);
            setSelectedOrderShipment(selectedMantisOrders);

        } else {
            setSelectAll(false);
            setSelectedOrderShipment([]);
        }
    };

    const deliveryIdBodyTemplate = (rowData) => {
        return (
            <>
                <Link to={`${rowData.id}`}>{rowData.delivery_number}</Link>
            </>
        );
    };

    const createdAtBodyTemplate = (rowData) => {
        return (
            <>
                {rowData.created_at}
            </>
        );
    };

    let networkTimeout = null;

    const onSubmit = (data) => {
        if (!selectedOrderShipment || selectedOrderShipment.length === 0) {

            toast.current.show({
                severity: 'warn',
                summary: 'Selection Required',
                detail: 'Please select at least one order from the order shipment.'
            });
            return;
        }
        setLoading1(true);
        let ostCodesArray = selectedOrderShipment.map(item => item.ost_Code);
        data = {
            ...data,
            ship_date: data.ship_date ? new Date(new Date(data.ship_date).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString() : null,
            truck: data.truck ? Number(data.truck) : null,
            selectedOrderShipment: ostCodesArray
        }

        if (matchedPath === null) {

            outboundShipmentService.addShipment((data)).then((data) => {
                setLoading1(false);
                if (data.error == 0) {
                    form.reset();
                    dispatch(addData({ severity: 'success', detail: data.message, summary: 'Shipment Created' }));
                    navigate("/outbound/multiple-shipment");
                }
                else {
                    toast.current.show({ severity: 'error', summary: 'Error in Shipment creation', detail: data.message });
                }
            });
        }
        else {
            data.truck = data.truck ? String(data.truck) : String(editTruckID);
            data.shp_Code = editCode;
            // console.log( data.shp_Code)
            outboundShipmentService.updateShipment(params.id, data).then((data) => {
                setLoading1(false);
                if (data.error == 0) {
                    form.reset();
                    dispatch(addData({ severity: 'success', detail: data.message, summary: 'Shipment Updated' }));
                    navigate("/outbound/multiple-shipment");
                }
                else {
                    toast.current.show({ severity: 'error', summary: 'Error in Shipment updation', detail: data.message });
                }
            });
        }



    };

    const getFormErrorMessage = (name) => {
        return errors[name] ? <small className="p-error">{errors[name].message}</small> : null;
    };

    // const InputDateFilterTemplate = (options) => {
    //         return (
    //             <Calendar value={dates} onChange={(e) => setDates(e.value)}  />
    //         );
    //     };

    const InputDateFilterTemplate = (options) => {
        const handleDateChange = (e) => {
            const selectedDate = e.value; // Get the selected date from the calendar
            setlazyState((prevState) => ({
                ...prevState,
                filters: {
                    ...prevState.filters,
                    ord_InputDate: { value: selectedDate } // Update the ord_InputDate filter
                }
            }));
        };

        return (
            <Calendar
                value={lazyState.filters.ord_InputDate.value} // Bind the calendar value to the filter
                onChange={handleDateChange} // Update the lazyState filter on date change
            />
        );
    }

    return (
        <>
            {/* <h2>Shipment Date: {shp_Code ? shp_Code : 'N/A'}</h2> */}
            <Button
                label="Back"
                icon="pi pi-arrow-left"
                className="p-button-primary"
                onClick={() => navigate("/outbound/multiple-shipment")}
                style={{ margin: '10px 0' }}
            />            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>{heading}</h3>
            </div>
            <h1></h1>
            <Toast ref={toast} />
            <form onSubmit={form.handleSubmit(onSubmit)} className="">
                <div className="grid">
                    <div className="col-12">
                        <div className="card">
                            <div className="p-fluid formgrid grid">
                                {/* {<div className="field col-12 md:col-3">
                                    <Controller
                                        name="code"
                                        control={form.control}
                                        rules={{
                                            required: 'Shipment Code is required.'
                                        }}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <label>Shipment Code *</label>
                                                <InputText id={field.name}
                                                    value={field.value}
                                                    type="text"
                                                    placeholder='Enter shipment code...'
                                                    className={classNames({ 'p-invalid': fieldState.error })}
                                                    onChange={(e) => {
                                                        field.onChange(e.target.value)
                                                    }}
                                                />
                                                {getFormErrorMessage(field.name)}

                                            </>
                                        )}
                                    />
                                </div>} */}

                                <div className="field col-12 md:col-3">
                                    <Controller
                                        name="truck"
                                        control={form.control}
                                        rules={{ required: 'Truck is required.' }}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <label>Truck</label>
                                                <Dropdown
                                                    id={field.name}
                                                    value={field.value}
                                                    key={field.name}
                                                    editable
                                                    optionValue="trk_Id"
                                                    optionLabel="trk_Code"
                                                    onChange={(e) => field.onChange(e.value)}
                                                    options={truckOptions}
                                                    placeholder="Select a Truck"
                                                    className={classNames({ 'p-invalid': fieldState.error })}
                                                />
                                                {getFormErrorMessage(field.name)}
                                            </>
                                        )}
                                    />
                                </div>

                                <div className="field col-12 md:col-3">
                                    <Controller
                                        name="location_id"
                                        control={form.control}
                                        // rules={{ required: 'Location is required.' }}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <label>Location</label>
                                                <Dropdown
                                                    id={field.name}
                                                    key={field.name}
                                                    value={field.value}
                                                    editable
                                                    optionValue="loc_code"
                                                    optionLabel="loc_code"
                                                    options={locationOptions}
                                                    onChange={(e) => field.onChange(e.value)}
                                                    placeholder="Select a Location"
                                                    className={classNames({ 'p-invalid': fieldState.error })}
                                                />
                                                {getFormErrorMessage(field.name)}
                                            </>
                                        )}
                                    />
                                </div>
                                <div className="field col-12 md:col-3">
                                    <Controller
                                        name="ship_date" // Name for the date picker
                                        control={form.control}
                                        // rules={{ required: 'Date is required.' }}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <label>Ship Date </label>
                                                <Calendar
                                                    ref={dateRef}
                                                    id={field.name}
                                                    value={field.value ? new Date(field.value) : null}
                                                    onChange={(e) => field.onChange(e.value)}
                                                    dateFormat="yy/mm/dd"
                                                    placeholder="Select a Date"
                                                    className={classNames({ 'p-invalid': fieldState.error })}
                                                    showIcon 
                                                    showOnFocus={false} 
                                                    inputRef={(el) => {
                                                        if (el) {
                                                            el.onmousedown = (e) => {
                                                                e.preventDefault();           
                                                                dateRef.current.show(); 
                                                            };
                                                        }
                                                    }}
                                                />
                                                {getFormErrorMessage(field.name)}
                                            </>
                                        )}


                                    />
                                </div>


                            </div>

                            <div className="card">
                                <div className="flex justify-content-between">

                                    <h3 className="shipment-heading">Order Shipment</h3>
                                    {hasActionAccess(PAGE_KEY, "add_order_shipment")&&(<Button
                                        label="Add Order Shipment"
                                        loading={loading}
                                        type="button"
                                        className="w-2 p-2 mb-3"
                                        onClick={openModal} // Open modal on button click
                                    />)}
                                    <Dialog
                                        header="Add Order"
                                        visible={visible}
                                        style={{ width: '85vw' }}
                                        modal
                                        onHide={closeModal}
                                    >
                                        <DataTable
                                            value={orders}
                                            lazy
                                            filterDisplay="row"
                                            dataKey="ost_Code"
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
                                            selection={selectedMantisOrders}
                                            onSelectionChange={onMantisOrderSelectionChange}
                                            selectAll={selectMantisOrderAll}
                                            onSelectAllChange={onMantisOrderSelectAllChange}

                                            scrollable
                                            scrollHeight="600px"
                                        >
                                            <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />

                                            <Column field="ost_Code" header="Code " body={ord_CodeBodyTemplate} filterMenuStyle={{ width: '14rem' }} sortable showFilterMenu={false} filter filterPlaceholder="Search" />
                                            <Column field="ord_InputDate" header="Input Date " body={(rowData) => rowData.ord_InputDate} filterMenuStyle={{ width: '14rem' }} sortable showFilterMenu={false} filter filterElement={InputDateFilterTemplate} />
                                            <Column field="customer_Code" header="Customer Code " body={customer_codeBodyTemplate} filterMenuStyle={{ width: '14rem' }} sortable showFilterMenu={false} filter filterPlaceholder="Search" />
                                            <Column field="ship_To" header="Ship code" body={ship_toBodyTemplate} filterMenuStyle={{ width: '14rem' }} sortable showFilterMenu={false} filter filterPlaceholder="Search" />
                                            <Column field="ost_ExecuteDate" header="Execution Date" body={ost_ExecuteDateBodyTemplate} showFilterMenu={false} sortable filter filterPlaceholder="Search" />
                                            <Column field="ost_ShipDate" header="Ship Date" body={ost_ShipDateBodyTemplate} filterMenuStyle={{ width: '14rem' }} sortable showFilterMenu={false} filter filterPlaceholder="Search" />
                                            <Column field="ost_DeliveryDate" e header="Delivery Date" body={ost_DeliveryDateBodyTemplate} showFilterMenu={false} sortable filter filterPlaceholder="Search" />

                                            <Column field="ost_LoadingPriority" header="Loading Priority" body={ost_LoadingPriorityDBodyTemplate} showFilterMenu={false} sortable filter filterPlaceholder="Search" />

                                            <Column field="orderShipmentStatus" header="Status" body={OrderShipmentStatusBodyTemplate} showFilterMenu={false} sortable filter filterPlaceholder="Search" />

                                        </DataTable>
                                        <div class="flex justify-content-end flex-wrap">
                                            <Button label="Cancel" onClick={closeModal} severity="secondary" className="w-2 p-2 mt-2 mr-2 " outlined />
                                            <Button label="Add" onClick={AddOrdersToGrid} className="w-2 p-2 mt-2" />
                                        </div>
                                    </Dialog>
                                    {/* //                     <Button
                                        label="Submit"
                                        loading={loading}
                                        type="submit"
                                        className="w-2 p-2 mb-3"
                                    /> */}

                                </div>
                                <DataTable
                                    value={shipmentOrders}
                                    lazy
                                    filterDisplay="row"
                                    dataKey="ost_Code"

                                    showGridlines
                                    first={lazyState1.first}
                                    rows={lazyState1.rows}
                                    totalRecords={totalRecords1}
                                    onPage={onPage1}
                                    onSort={onSort1}
                                    size={'small'}
                                    sortField={lazyState1.sortField}
                                    className="datatable-responsive"
                                    sortOrder={lazyState1.sortOrder}
                                    onFilter={onFilter}
                                    filters={lazyState1.filters}
                                    rowsPerPageOptions={[25, 50, 100, 500, 1000]}
                                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                                    currentPageReportTemplate="Showing {first} to {last} of {totalRecords1} records"
                                    loading={loading1}
                                    tableStyle={{ minWidth: '75rem' }}
                                    emptyMessage="No record found."
                                    selection={selectedOrderShipment}
                                    onSelectionChange={onSelectionChange}
                                    selectAll={selectAll}
                                    onSelectAllChange={onSelectAllChange}

                                    scrollable
                                    scrollHeight="600px"
                                    removableSort
                                >
                                    <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />


                                    <Column field="ost_Code" header="Order Code " body={ord_CodeBodyTemplate} filterMenuStyle={{ width: '14rem' }} />
                                    <Column field="customer_Code" header="Customer Code" body={customer_codeBodyTemplate} filterMenuStyle={{ width: '14rem' }} />
                                    {/* <Column field="ship_To" header="Ship Code" body={ship_toBodyTemplate} filterMenuStyle={{ width: '14rem' }} /> */}
                                    <Column field="ost_ExecuteDate" header="Execution Date" body={ost_ExecuteDateBodyTemplate} />
                                    <Column field="ost_ShipDate" header="Ship Date" body={ost_ShipDateBodyTemplate} filterMenuStyle={{ width: '14rem' }} />
                                    <Column field="ost_DeliveryDate" header="Delivery Date" body={ost_DeliveryDateBodyTemplate} />
                                    <Column field="ost_LoadingPriority" header="Loading Priority" body={ost_LoadingPriorityDBodyTemplate} />
                                    <Column field="OrderShipmentStatus" header="Status" body={OrderShipmentStatusBodyTemplate} />
                                </DataTable>
                            </div>
                        </div >
                        <div class="flex justify-content-end flex-wrap">
                            <Button label="Cancel" onClick={() => navigate("/outbound/multiple-shipment")} type='button' severity="secondary" className="w-2 p-2 mt-2 mr-2 " outlined ></Button>
                            {hasActionAccess(PAGE_KEY, "submit")&&(<Button label="Submit" loading={loading1} type='submit' className="w-2 p-2 mt-2" ></Button>)}
                        </div>
                    </div>
                </div>
            </form>

        </>

    );
};

