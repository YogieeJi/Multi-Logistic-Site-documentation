
import React, { useState, useRef, useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';
import { Toast } from 'primereact/toast';
import { LocationsService } from '../../../../service/misc/LocationsService';
import { useDispatch } from 'react-redux';
import { matchPath, useLocation, useNavigate, useParams } from 'react-router-dom';
import { addData } from '../../../../store/formMessage.slice';
import { PTLControllerService } from '../../../../service/operations/PTLControllerService';
import { Dropdown } from 'primereact/dropdown';
export default function AddPTLController() {
    const [loading, setLoading] = useState(true);
    const [storageType, setStorageType] = useState(null);
    
    const [locationType, setLocationType] = useState(null);
    const [showCustomerCodeField, setShowCustomerCodeField] = useState(false);
    const toast = useRef(null);
    const [laneDetail, setLaneDetail] = useState(null);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const params = useParams();
    const routePath = useLocation();
    const matchedPath = matchPath({path:'/operations/manage-shipment-location/edit',end:false},routePath.pathname);
    const [heading, setHeading] = useState('Add Ship Location');
    const [inputValue, setInputValue] = useState("");
    const [options, setOptions] = useState([]);
    const [page, setPage] = useState(1);
    const [locError, setLocError] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    

    let defaultValues = { 
        loc_Code: '',
        size:'',
        shipment_type: '',
        customer_code: '',
        limited_capacity: 1,
        is_consolidated: 1,

    };

    const form = useForm({ defaultValues });
    const errors = form.formState.errors;
    
    useEffect(() => {
        LocationsService.getLookups().then((data) => {
            setLocationType(data.data);
        });

        if(matchedPath !== null){
            getDetails();
            setHeading('Edit Shipment Location');
        } 
    }, []);

    const getDetails = () => {
        LocationsService.getDetail(params.id).then((data) => {
          
            setSelectedOption(data.data[0].code)
            form.setValue('loc_Code',data.data[0].code??'');
            form.setValue('size',data.data[0].size??'');
            form.setValue('shipment_type',data.data[0].shipment_type??'');
            form.setValue('customer_code',data.data[0].customer_code??'');
            form.setValue('limited_capacity',parseInt(data.data[0].limited_capacity)??0);
            form.setValue('is_consolidated',parseInt(data.data[0].is_consolidated)??0);

           
        });
    };
// Function to fetch options from the Laravel backend API
const fetchOptions = async (searchQuery, pageNumber) => {
    setLoading(true);
    try {
      
        const param = {
            'query': searchQuery,
            'page': pageNumber,
        }
        LocationsService.getMantisLocations(param).then((data) => {
        
        
        if(data.error == 0){
                  
            const fetchedOptions = data.data.data; // Access paginated data
            const lastPage = data.data.last_page; // Total number of pages
              setOptions([]);
            // Append new options to the existing list
            if (fetchedOptions.length > 0) {
              setOptions((prevOptions) => [...prevOptions, ...fetchedOptions]);
            }
            
            // Check if there are more pages to load, and stop call if last page is almost half, in such way user will search from input filed
            if ( lastPage < 70) {
              setHasMore(false);
            }
            }else{
                toast.current.show({ severity: 'error', summary: 'Error in Data creation', detail: data.message});
                }
            });

      
    } catch (error) {
      console.error("Error fetching options:", error);
    }
    let networkTimeout = setTimeout(() => {
            
        setLoading(false);
    }, Math.random() * 100 + 3000);
    
  };
  
  // Handle search input change
  const handleSearchChange = (event) => {
    setLoading(true);
    const value = event.filter;
    setInputValue(value);
    fetchOptions(value,10)
    
  };
  
 
    useEffect(() => {
        fetchOptions(inputValue, 200);
      }, []);
    const onSubmit = (data) => {
        setLoading(true);
        if(!selectedOption){
            setLocError(true);
            return false;
        }
        data = {
            code: selectedOption,
            size: form.getValues('size'),
            shipment_type: form.getValues('shipment_type'),
            customer_code: form.getValues('customer_code'),
            limited_capacity: form.getValues('limited_capacity'),
            is_consolidated: form.getValues('is_consolidated')

            
        }
        
        
        LocationsService.createUpdateLocation(data).then((data) => {
            setLoading(false);
            if(data.error == 0){
                form.reset();
                dispatch(addData({severity: 'success', detail: data.message, summary: matchedPath === null ? 'Data Created': 'Data Updated'}));
                navigate("/operations/manage-shipment-location")
            } else{
                toast.current.show({ severity: 'error', summary: 'Error in Data creation', detail: data.message});
            }
        });
        setLocError(false);
       
    };

    const getFormErrorMessage = (name) => {
        return errors[name] ? <small className="p-error">{errors[name].message}</small> : null;
    };   

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>{heading}</h3>
            </div>
            <h1></h1>
            <Toast ref={toast} />
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="">
                <div className="card">
                    <h1></h1>
                    <div className="p-fluid" style={{ padding: '0 20%' }}>
                        <div className="field">
                            <label>Code *</label>
                            <Controller
                                name="loc_Code"
                                control={form.control}
                                
                                render={({ field, fieldState }) => (
                                    <>
                                    
                                        <Dropdown
                                            value={selectedOption}
                                            editable
                                            options={options}
                                            onChange={(e) => setSelectedOption(e.target.value)}
                                            onFilter={handleSearchChange} // Handles the search filter
                                            filter // Enable filter
                                            filterBy="loc_Code" // Filter by 'name' field
                                            showClear // Option to clear selection
                                            placeholder="Search and Select"
                                            emptyMessage={loading ? <><i className="pi pi-spin pi-spinner p-mr-2"></i> <span>Loading Locations... </span> </>: 'No results found'}
                                            scrollHeight="300px" // Limit height to enable scrolling
                                            loading={loading}
                                            className={classNames({ 'p-invalid': fieldState.error })}     
                                            optionLabel="loc_Code" // Display name as the option label
                                            optionValue="loc_Code" // Display name as the option label
                                             // Show loading spinner when fetching data
                                        />
                                         
                                         {locError ? (<small className="p-error">Location is required</small>):''}
                                    </>
                                )}
                            />
                        </div>

                        <div className="field">
                            <label>Size *</label>
                            <Controller
                                name="size"
                                control={form.control}
                                rules={{ 
                                    required: 'Size is required.'
                                }}
                                render={({ field, fieldState }) => (
                                    <>
                                        <Dropdown id={field.name} 
                                            editable
                                            value={field.value} 
                                            key={field.name} 
                                            optionValue="value" 
                                            optionLabel="label" 
                                            onChange={(e) => field.onChange(e.target.value)} 
                                            options={[{'label':'Single','value':'Single'},{'label':'Double','value':'Double'}]} 
                                            placeholder="Select" 
                                            className={classNames({ 'p-invalid': fieldState.error })} 
                                        />
                                        {getFormErrorMessage(field.name)}
                                    </>
                                )}
                            />
                        </div> 
                        <div className="field">
                            <label>Shipment Type *</label>
                            <Controller
                                name="shipment_type"
                                control={form.control}
                                rules={{ 
                                    required: 'Shipment Type is required.'
                                }}
                                render={({ field, fieldState }) => (
                                    <>
                                        <Dropdown id={field.name} 
                                            value={field.value} key={field.name} 
                                            optionValue="code" 
                                            optionLabel="order_type" 
                                            onChange={(e) => field.onChange(e.target.value)} 
                                            options={locationType} 
                                            placeholder="Select" 
                                            className={classNames({ 'p-invalid': fieldState.error })} 
                                        />
                                        {getFormErrorMessage(field.name)}
                                    </>
                                )}
                            />
                        </div> 
                        {(showCustomerCodeField) ?  (
                        <div className="field">
                            <label>Customer Code *</label>
                            <Controller
                                name="customer_code"
                                control={form.control}
                                rules={{ 
                                    required: showCustomerCodeField ? 'Customer Code is required.' : false
                                }}
                                render={({ field, fieldState }) => (
                                    <>
                                        <InputText id={field.name} 
                                            value={field.value} 
                                            type="text" 
                                            className={classNames({ 'p-invalid': fieldState.error })} 
                                            onChange={(e) => {
                                                field.onChange(e.target.value)
                                            }} 
                                            style={{ width: '100%' }}  // Make input full-width
                                        />
                                        {getFormErrorMessage(field.name)}
                                    </>
                                )}
                            />
                        </div>
                        ) : ''}
                        <div className="field">
                            <label>Limited Capacity *</label>
                            <Controller
                                name="limited_capacity"
                                defaultValue={1} 
                                control={form.control}
                                rules={{ 
                                    required: 'Limited Capacity is required.'
                                }}
                                render={({ field, fieldState }) => (
                                    <>
                                        <Dropdown id={field.name} 
                                            value={field.value} key={field.name} 
                                            optionValue="value" 
                                            optionLabel="label" 
                                            onChange={(e) => field.onChange(e.target.value)} 
                                            options={[{'label':'Yes','value':1},{'label':'No','value':0}]} placeholder="Select" 
                                            className={classNames({ 'p-invalid': fieldState.error })} 
                                        />
                                        
                                        {getFormErrorMessage(field.name)}
                                    </>
                                )}
                            />
                        </div>
                        <div className="field">
                            <label>Is Consolidated? *</label>
                            <Controller
                                name="is_consolidated"
                                defaultValue={1} 
                                control={form.control}
                                rules={{ 
                                    required: 'Is Consolidated Capacity is required.'
                                }}
                                render={({ field, fieldState }) => (
                                    <>
                                        <Dropdown id={field.name} 
                                            value={field.value} key={field.name} 
                                            optionValue="value" 
                                            optionLabel="label" 
                                            onChange={(e) => field.onChange(e.target.value)} 
                                            options={[{'label':'Yes','value':1},{'label':'No','value':0}]} placeholder="Select" 
                                            className={classNames({ 'p-invalid': fieldState.error })} 
                                        />
                                        
                                        {getFormErrorMessage(field.name)}
                                    </>
                                )}
                            />
                        </div>
                    </div>
        
                <div className="field" style={{ textAlign: 'center', marginTop: '20px' }}>
                    <Button type="submit" loading={loading} className="p-button p-component" style={{ marginRight: '10px' }}>
                        Submit
                    </Button>
                    <button type="button" className="p-button p-component p-button-secondary" onClick={() => navigate("/operations/manage-shipment-location")}>
                        Cancel
                    </button>
                </div>
                    
                </div>
            </form>
        </>
    );
}
