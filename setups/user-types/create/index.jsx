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
import { MantisUsersService } from '../../../../service/operations/MantisUsersService';


export default function AddItemConversion(){
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
    const [heading, setHeading] = useState('Add User Type');
    const matchedPath = matchPath({path:'/setup/user-types/edit/'+params.id,end:false},routePath.pathname);
    
    const [selectedOrderShipment, setSelectedOrderShipment] = useState(null);
    const [selectedMantisOrders, setSelectedMantisOrders] = useState(null);
    const [shipmentOrders, setShipmentOrders] = useState(null);
    let defaultValues = { 
        // code: '',
        path: '',
        type: '',
    };
    const [visible, setVisible] = useState(false); // State to control modal visibility
    const openModal = () => {
        setVisible(true);
        
      };
    
      const closeModal = () => {
        setVisible(false); // Close modal
      };
      const AddOrdersToGrid  = () => {
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
                    {rowData.customer_code}
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

       
        const  ost_WeightBodyTemplate = (rowData) => {
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
                    {rowData.ship_to}
                </>
            );
        };

        const OrderShipmentStatusBodyTemplate = (rowData) => {
            let statusSeverity = 'secondary'; 

            const status = rowData.OrderShipmentStatus.toLowerCase();
        
            if (status.includes('pending')) {
                statusSeverity = 'warning'; 
            } else if (status.includes('picked')) {
                statusSeverity = 'info'; 
            } else if (status.includes('packed')) {
                statusSeverity = 'success'; 
            }
      

                 
            return (
                <Badge
                    value={rowData.OrderShipmentStatus}
                    severity={statusSeverity}
                    rounded
                    className="custom-badge"
                />
            );
        };
        useEffect(() => {
            if(matchedPath !== null){
                getDetails();
                setHeading('Edit User Type');
            }
        }, [params.id]);
        // const location = useLocation();
        // const shp_Code = location.state?.shp_ID; 
        const form = useForm({ defaultValues });
        const errors = form.formState.errors;
        const getDetails = () => {
            setLoading1(true);
            MantisUsersService.editUserTypes(params.id).then((data) => {
                // form.setValue('code',data.data[0]?.shp_Code??'');
                // setTruckOptions(data.data[0].TruckCodePlate);
  
                form.setValue('type',data.data?.type ??'');
                
                form.setValue('path',data.data?.path ??'');
                setLoading1(false);
            });
        };
        
    const [lazyState, setlazyState] = useState({
        first: 0,
        rows: 10,
        page: 0,
        sortField: "",
        sortOrder: "asc",
        filters: {
            ord_Code: { value: null },
            ost_ExecuteDate: { value: null },
            ost_ShipDate: { value: null },
            ost_DeliveryDate: { value: null },
            ost_LoadingPriority: { value: null },
            OrderShipmentStatus: { value: null },
            ship_to: { value: null },
            customer_code: { value: null }
        
   }   });
    const [lazyState1, setlazyState1] = useState({
        first: 0,
        rows: 10,
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
                console.error('Error fetching truck options', error);
                setLoading(false);
            }

            try {
                const response = await outboundShipmentService.getTruckslocation(); // Fetch 
                setLocationOptions(response.data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching location options', error);
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
            outboundShipmentService.getOrdersGrid( (lazyState) ).then((data) => {
                   
                setTotalRecords(data.TotalRecords);
                setOrders(data.Data);
                
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
        setlazyState(event);
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
       setLoading1(true);
        data = {
            ...data,  
           
        }
        if(matchedPath === null){
              MantisUsersService.createUserTypes( (data) ).then((data) => {
                setLoading1(false);
                if(data.error == 0){
                    form.reset();
                    dispatch(addData({severity: 'success', detail: data.message, summary: 'User Type Created'}));
                    navigate("/setup/user-types");
                } 
                else{
                    toast.current.show({ severity: 'error', summary: 'Error in User Type creation', detail: data.message});
                }
            });}
            else{

                MantisUsersService.updateUserTypes (params.id, data ).then((data) => {
                    setLoading1(false);
                    if(data.error == 0){
                        form.reset();
                        dispatch(addData({severity: 'success', detail: data.message, summary: 'Shipment Updated'}));
                        navigate("/setup/user-types");
                    } 
                    else{
                        toast.current.show({ severity: 'error', summary: 'Error in Shipment updation', detail: data.message});
                    }
                });

            }

           
        
    };

    const getFormErrorMessage = (name) => {
        return errors[name] ? <small className="p-error">{errors[name].message}</small> : null;
    };

    

    return (
        <>
        {/* <h2>Shipment Date: {shp_Code ? shp_Code : 'N/A'}</h2> */}
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
                        <div className="field col-12 md:col-3">
                                <Controller
                                    name="type"
                                    control={form.control}
                                    rules={{ 
                                        required: 'Type is required.'
                                    }}
                                    render={({ field, fieldState }) => (
                                        <>

                                        
                                            <label>User Type *</label>
                                            <InputText id={field.name} 
                                                value={field.value} 
                                                type="text" 
                                                placeholder='Enter User Type'
                                                className={classNames({ 'p-invalid': fieldState.error })} 
                                                onChange={(e) => {
                                                    field.onChange(e.target.value)
                                                }} 
                                            />
                                            {getFormErrorMessage(field.name)}

                                        </>
                                    )}
                                />
                            </div>
                            <div className="field col-12 md:col-3">
                                <Controller
                                    name="path"
                                    control={form.control}
                                    rules={{ 
                                        required: 'path is required.'
                                    }}
                                    render={({ field, fieldState }) => (
                                        <>

                                        
                                            <label>Path *</label>
                                            <InputText id={field.name} 
                                                value={field.value} 
                                                type="text" 
                                                placeholder='Enter Path'
                                                className={classNames({ 'p-invalid': fieldState.error })} 
                                                onChange={(e) => {
                                                    field.onChange(e.target.value)
                                                }} 
                                            />
                                            {getFormErrorMessage(field.name)}

                                        </>
                                    )}
                                />
                            </div>

                            
                        </div>

                    </div >
                    <div class="flex justify-content-end flex-wrap">
                    <Button label="Cancel" onClick={() => navigate("/setup/user-types")} type='button' severity="secondary" className="w-2 p-2 mt-2 mr-2 " outlined ></Button>
                    <Button label="Submit" loading={loading1} type='submit' className="w-2 p-2 mt-2" ></Button>
                    </div>
                </div>
            </div>
            </form>

        </>
       
    );
};

