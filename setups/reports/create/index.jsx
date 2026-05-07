import React, { useEffect, useRef, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Controller, useForm } from 'react-hook-form';
import { classNames } from 'primereact/utils';

import { InputSwitch } from 'primereact/inputswitch';
import { RadioButton } from "primereact/radiobutton";
        
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { useDispatch } from 'react-redux';
import { addData } from '../../../../store/formMessage.slice';
import { matchPath, useLocation, useNavigate, useParams } from 'react-router-dom';
import { SetupReportsService } from '../../../../service/setups/SetupReports';

export default function AddSetupReport(){
    const [loading, setLoading] = useState(false);
    const toast = useRef(null);
    const dispatch = useDispatch()
    const navigate = useNavigate();
    const params = useParams();
    const routePath = useLocation();
    const [productDetail, setProductDetail] = useState(null);
    const matchedPath = matchPath({path:'/setup/reports/edit',end:false},routePath.pathname);

    const [dropDownRoles, setDropDownRoles] = useState([]);
    const [switchValue, setSwitchValue] = useState(true);

    const [heading, setHeading] = useState('Add Report');
    const [filterType, setFilterType] = useState('input_field');
    const [addFilter, setAddFilter] = useState(false);
    const [filterDisable, setFilterDisable] = useState(true);
    const [filterQueryRule, setFilterQueryRule] = useState({});
    const [filterQueryDisable, setFilterQueryDisable] = useState(true);
    

    let defaultValues = { 
        report_name: '',
        module: '',
        query: '',
        filter_query: '',
        is_active: '',
    };


    useEffect(() => {
        if(matchedPath !== null){
            getDetails();
            setHeading('Edit Report');
        } 

    }, []);

    

    const getDetails = () => {
        SetupReportsService.getReportDetail(params.id).then((data) => {
            setProductDetail(data.data);
            form.setValue('report_name',data.data.report_name??'');
            form.setValue('module',data.data.module??'');
            form.setValue('query',data.data.query??'');
            setAddFilter(data.data.add_filter);
            setFilterType(data.data.filter_type??'input_field');
            form.setValue('filter_query',data.data.filter_query??'');
            form.setValue('is_active',data.data.is_active??'');
            setSwitchValue(data.data.is_active);
            if(data.data.add_filter == true){
                setFilterDisable(false)
            } 
            if(data.data.filter_type == 'drop_down'){
                setFilterQueryDisable(false)
            }
            
        });
    };

   
    const form = useForm({ defaultValues });
    const errors = form.formState.errors;

    let networkTimeout = null;

    const onSubmit = (data) => {

        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }
        if(addFilter === true && filterType === 'drop_down' && form.getValues('filter_query') == ''){
            toast.current.show({ severity: 'error', summary: 'Error', detail: 'Please add filter query'});
            return 0;
        }
        data = {
            report_name: form.getValues('report_name'),
            module: form.getValues('module'),
            query: form.getValues('query'),
            add_filter: addFilter,
            filter_type: filterType,
            filter_query: form.getValues('filter_query'),
            is_active: switchValue,
        }

       
        setLoading(true);
        if(matchedPath === null){
            SetupReportsService.addReport( (data) ).then((data) => {
                setLoading(false);
                if(data.error == 0){
                    form.reset();
                    dispatch(addData({severity: 'success', detail: data.message, summary: 'Report Created'}));
                    // toast.current.show({ severity: 'success', summary: 'Product Created', detail: data.message});
                    navigate("/setup/reports")
                } 
                else if(data.errors){
                    toast.current.show({ severity: 'error', summary: 'Error in User', detail: data.message});
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error in User', detail: data.message});
                }
            });
        } else{
            SetupReportsService.updateReport(params.id, data).then((data) => {
                setLoading(false);
                if(data.error == 0){
                    form.reset();
                    dispatch(addData({severity: 'success', detail: data.message, summary: 'User Updated'}));
                    // toast.current.show({ severity: 'success', summary: 'Product Created', detail: data.message});
                    navigate("/setup/reports")
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error in User', detail: data.message});
                }
            });
        }
        
    };

    const getFormErrorMessage = (name) => {
        return errors[name] ? <small className="p-error">{errors[name].message}</small> : null;
    };

    const dropdownValuesModules = [
        { code: 'Shipments', name: 'Shipments' },
        { code: 'Containers', name: 'Containers' },
        { code: 'Transfers', name: 'Transfers' },
        { code: 'Receipts', name: 'Receipts' },
        { code: 'PickList', name: 'PickList' },
        { code: 'Delivery', name: 'Delivery' },
        { code: 'Items', name: 'Items' },
        { code: 'Trucks', name: 'Trucks' },
        { code: 'Stock' ,name: 'Stock' },
        { code: 'Locations', name: 'Locations' },
        { code: 'Orders' ,name: 'Orders' },
        { code: 'Receipts', name: 'Receipts' },
        { code: 'Issues', name: 'Issues' },
    ];

  

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>{heading}</h3>
            </div>
            <h1></h1>
            <Toast ref={toast} />

            <form onSubmit={form.handleSubmit(onSubmit)} className="">
            <div className="grid">
                <div className="col-12">
                    
                    <div className="card">
                        <h4>Report Info</h4>
                        <br/>
                        <div className="p-fluid formgrid grid">
                            <div className="field col-12 md:col-6">
                                <Controller
                                    name="report_name"
                                    control={form.control}
                                    rules={{ 
                                        required: 'Report Name is required.'
                                    }}
                                    render={({ field, fieldState }) => (
                                        <>
                                        
                                            <label>Report Name*</label>
                                            <InputText id={field.name} 
                                                value={field.value} 
                                                type="text" 
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
                           
                          
                          
                            <div className="field col-12 md:col-6">
                                <Controller
                                    name="module"
                                    control={form.control}
                                    rules={{ 
                                        required: 'Module is required.'
                                    }}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <label>Module*</label>
                                            <Dropdown id={field.name} value={field.value} key={field.name} style={{marginRight:5, marginLeft:10}} optionValue="code" optionLabel="name" onChange={(e) => field.onChange(e.target.value)} options={dropdownValuesModules} placeholder="Select" className={classNames({ 'p-invalid': fieldState.error })} />
                                            {getFormErrorMessage(field.name)}
                                        </>
                                    )}
                                />
                            </div>

                            <div className="field col-12 md:col-12">
                                <Controller
                                    name="query"
                                    control={form.control}
                                    rules={{ 
                                        required: 'Query is required.'
                                    }}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <label>Query*</label>
                                            <InputTextarea value={field.value}  placeholder="Enter Query" rows="5" cols="30" onChange={(e) => {
                                                    field.onChange(e.target.value)
                                                }}  />
                                            {getFormErrorMessage(field.name)}
                                        </>
                                    )}
                                />
                            </div>

                            <div className="field col-12 md:col-12">
                                <p>Add Filter</p>
                                <InputSwitch  
                                    checked={addFilter} 
                                    onChange={(e) => {
                                        setAddFilter(e.value)
                                        if(e.value == true){
                                            setFilterDisable(false)
                                            if(filterType === 'drop_down'){
                                                setFilterQueryDisable(false)
                                            }
                                        } else{
                                            setFilterDisable(true)
                                            setFilterQueryDisable(true)
                                            form.setValue('filter_query','')
                                        }
                                        
                                    }} 
                                />
                            </div>

                            <div className="field col-12 md:col-12" hidden={filterDisable}>
                            <p>Select Filter Type</p>
                                <div className="flex flex-wrap gap-3">
                                    <div className="flex align-items-center">
                                        <RadioButton 
                                            inputId="input_field" 
                                            value="input_field" 
                                            onChange={(e) => {
                                                setFilterType(e.value)
                                                setFilterQueryDisable(true)
                                                form.setValue('filter_query','')
                                            }} 
                                            checked={filterType === 'input_field'}
                                        />
                                        <label htmlFor="input_field" className="ml-2">Input Field</label>
                                    </div>
                                    <div className="flex align-items-center">
                                        <RadioButton 
                                            inputId="dropdown" 
                                            value="drop_down" 
                                            onChange={(e) => {
                                                setFilterType(e.value)
                                                setFilterQueryRule({
                                                    required: 'Filter Query is required'
                                                })
                                                setFilterQueryDisable(false)
                                            }} 
                                            checked={filterType === 'drop_down'}   
                                        />
                                        <label htmlFor="dropdown" className="ml-2">DropDown</label>
                                    </div>
                                    <div className="flex align-items-center">
                                        <RadioButton 
                                            inputId="date_picker" 
                                            value="date_picker" 
                                            onChange={(e) => {
                                                setFilterType(e.value)
                                                setFilterQueryDisable(true)
                                                form.setValue('filter_query','')
                                            }} 
                                            checked={filterType === 'date_picker'}   
                                        />
                                        <label htmlFor="date_picker" className="ml-2">Date Picker</label>
                                    </div>
                                </div>
                            </div>

                            <div className="field col-12 md:col-12" hidden={filterQueryDisable}>
                                <Controller
                                    name="filter_query"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <label>Filter Query*</label>
                                            <InputTextarea value={field.value}  placeholder="Enter Filter Query" rows="5" cols="30" onChange={(e) => {
                                                field.onChange(e.target.value)
                                            }}  />
                                            {getFormErrorMessage(field.name)}
                                        </>
                                    )}
                                />
                            </div>

                            
                            <div className="field col-12 md:col-6 mt-5">
                                <Controller
                                    name="is_active"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <p>Enable/Disable</p>
                                            <InputSwitch  checked={switchValue} onChange={(e) => setSwitchValue(e.value)} />
                                            {getFormErrorMessage(field.name)}
                                        </>
                                    )}
                                />
                            </div>

                          

                        </div>
                    </div>
                    <Button label="Submit" loading={loading} type='submit' className="w-3 p-3 mt-3" ></Button>
                </div>
            </div>
            </form>

        </>
       
    );
};

