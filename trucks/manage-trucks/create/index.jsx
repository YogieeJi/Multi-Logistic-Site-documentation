import React, { useEffect, useRef, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Controller, useForm } from 'react-hook-form';
import { classNames } from 'primereact/utils';
import { Toast } from 'primereact/toast';
import { useDispatch } from 'react-redux';
import { addData } from '../../../../store/formMessage.slice';
import { matchPath, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ManageTrucksService } from '../../../../service/setups/ManageTrucksService';

export default function AddItemConversion(){
    const [loading, setLoading] = useState(false);
    const toast = useRef(null);
    const dispatch = useDispatch()
    const navigate = useNavigate();
    const params = useParams();
    const routePath = useLocation();
    const matchedPath = matchPath({path:'/setup/truck/edit',end:false},routePath.pathname);

    const [heading, setHeading] = useState('Add Truck');
    const [dropdownUOMList, setDropdownUOMList] = useState(null);
    let defaultValues = { 
        code: '',
        plate_number: ''
    };
    
    useEffect(() => {
        if(matchedPath !== null){
            getDetails();
            setHeading('Edit Truck');
        }
        
        const paramdata = {
            sku: params.id,
        }   
    }, []);
    
    
    const getDetails = () => {
        ItemConversionService.getItemDetail(params.id).then((data) => {
            form.setValue('sku_mantis',data.data.sku_mantis??'');
            form.setValue('uom_mantis',data.data.uom_mantis??'');
            form.setValue('sku_x3',data.data.sku_x3??'');
            form.setValue('uom_x3',data.data.uom_x3??'');
            form.setValue('receiving',(data.data.receiving == 1) ? true : false ??'');
            form.setValue('shipping',(data.data.shipping == 1) ? true : false ??'');
            form.setValue('is_kit_item',(data.data.is_kit_item == 1) ? true : false ??'');
            form.setValue('is_ship_item',(data.data.is_ship_item == 1) ? true : false ??'');
        });
    };

   
    const form = useForm({ defaultValues });
    const errors = form.formState.errors;

    let networkTimeout = null;

    const onSubmit = (data) => {

        data = {
            code: form.getValues('code'),
            plate_number: form.getValues('plate_number'),
        }
        
        setLoading(true);
        if(matchedPath === null){
            ManageTrucksService.addTruck( (data) ).then((data) => {
                setLoading(false);
                if(data.error == 0){
                    form.reset();
                    dispatch(addData({severity: 'success', detail: data.message, summary: 'Truck Created'}));
                    navigate("/trucks/manage-trucks")
                } 
                else{
                    toast.current.show({ severity: 'error', summary: 'Error in Truck creation', detail: data.message});
                }
            });
        } else{
            ManageTrucksService.updateTruck(params.id, data).then((data) => {
                setLoading(false);
                if(data.error == 0){
                    form.reset();
                    dispatch(addData({severity: 'success', detail: data.message, summary: 'Item Conversion Updated'}));
                    navigate("/setup/item-conversion")
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error in Item Conversion', detail: data.message});
                }
            });
        }
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
            <div className="grid">
                <div className="col-12">
                    <div className="card">
                        <div className="p-fluid formgrid grid">
                            <div className="field col-12 md:col-6">
                                <Controller
                                    name="code"
                                    control={form.control}
                                    rules={{ 
                                        required: 'code is required.'
                                    }}
                                    render={({ field, fieldState }) => (
                                        <>
                                        
                                            <label>Code *</label>
                                            <InputText id={field.name} 
                                                value={field.value} 
                                                type="text" 
                                                placeholder='Enter Code'
                                                className={classNames({ 'p-invalid': fieldState.error })} 
                                                maxLength={10}
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
                                    name="plate_number"
                                    control={form.control}
                                    rules={{ 
                                        required: 'Plate Number is required.'
                                    }}
                                    render={({ field, fieldState }) => (
                                        <>
                                        
                                            <label>Plate Number *</label>
                                            <InputText id={field.name} 
                                                value={field.value} 
                                                type="text" 
                                                placeholder='Enter Plate Number'
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
                    </div>
                    <Button label="Cancel" onClick={() => navigate("/trucks/manage-trucks")} type='button' severity="secondary" className="w-2 p-2 mt-2 mr-2 " outlined ></Button>
                    <Button label="Submit" loading={loading} type='submit' className="w-2 p-2 mt-2" ></Button>
                </div>
            </div>
            </form>

        </>
       
    );
};

