import React, { useEffect, useRef, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Controller, useForm } from 'react-hook-form';
import { classNames } from 'primereact/utils';
import { Toast } from 'primereact/toast';
import { useDispatch } from 'react-redux';
import { addData } from '../../../../store/formMessage.slice';
import { matchPath, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ItemConversionService } from '../../../../service/setups/ItemConversionService';
import { InputSwitch } from 'primereact/inputswitch';
import { Dropdown } from 'primereact/dropdown';
export default function AddItemConversion(){
    const [loading, setLoading] = useState(false);
    const toast = useRef(null);
    const dispatch = useDispatch()
    const navigate = useNavigate();
    const params = useParams();
    const routePath = useLocation();
    const matchedPath = matchPath({path:'/setup/item-conversion/edit',end:false},routePath.pathname);

    const [heading, setHeading] = useState('Add Item Conversion');
    const [dropdownUOMList, setDropdownUOMList] = useState(null);
    let defaultValues = { 
        sku_mantis: '',
        uom_mantis: '',
        sku_x3: '',
        uom_x3: '',
        uom_mantis: '',
        receiving: true,
        shipping: true,
        is_kit_item: false,
        is_ship_item: false,
    };
    
    useEffect(() => {
        if(matchedPath !== null){
            getDetails();
            setHeading('Edit Item Conversion');
        }
        
        const paramdata = {
            sku: params.id,
        }   
        getUOMListFun(paramdata);
    }, []);
    const getUOMListFun = (paramdata) =>{
        
        ItemConversionService.getUOMList(paramdata)
        .then((data) => {
            
            if((data?.data).length > 0){
                
                setDropdownUOMList(data?.data)
                console.log(setDropdownUOMList(data?.data));
                
            } 
        });
    
    };
    const handleBlur = (e) => {
        const inputValue = e.target.value;
        const paramdata = {
            sku: inputValue,
        }   
        getUOMListFun(paramdata);
        
    };
    const getDetails = () => {
        ItemConversionService.getItemDetail(params.id).then((data) => {
            form.setValue('sku_mantis',data.data[0].sku_mantis??'');
            form.setValue('uom_mantis',data.data[0].uom_mantis??'');
            form.setValue('sku_x3',data.data[0].sku_x3??'');
            form.setValue('uom_x3',data.data[0].uom_x3??'');
            form.setValue('receiving',(data.data[0].receiving == 1) ? true : false ??'');
            form.setValue('shipping',(data.data[0].shipping == 1) ? true : false ??'');
            form.setValue('is_kit_item',(data.data[0].is_kit_item == 1) ? true : false ??'');
            form.setValue('is_ship_item',(data.data[0].is_ship_item == 1) ? true : false ??'');
        });
    };

   
    const form = useForm({ defaultValues });
    const errors = form.formState.errors;

    let networkTimeout = null;

    const onSubmit = (data) => {

        data = {
            sku_mantis: form.getValues('sku_mantis'),
            uom_mantis: form.getValues('uom_mantis'),
            sku_x3: form.getValues('sku_x3'),
            uom_x3: form.getValues('uom_x3'),
            receiving: form.getValues('receiving'),
            shipping: form.getValues('shipping'),
            is_kit_item: form.getValues('is_kit_item'),
            is_ship_item: form.getValues('is_ship_item'),
        }
        
        setLoading(true);
        if(matchedPath === null){
            ItemConversionService.addItem( (data) ).then((data) => {
                setLoading(false);
                if(data.error == 0){
                    form.reset();
                    dispatch(addData({severity: 'success', detail: data.message, summary: 'Item Conversion Created'}));
                    navigate("/setup/item-conversion")
                } 
                else{
                    toast.current.show({ severity: 'error', summary: 'Error in Item Conversion', detail: data.message});
                }
            });
        } else{
            ItemConversionService.updateItem(params.id, data).then((data) => {
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

    const dropdowntruefalse = [
        { code: '0', name: 'UnVerified' },
        { code: '1', name: 'Verified' }
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
                        <div className="p-fluid formgrid grid">
                            <div className="field col-12 md:col-6">
                                <Controller
                                    name="sku_x3"
                                    control={form.control}
                                    rules={{ 
                                        required: 'sku_x3 is required.'
                                    }}
                                    render={({ field, fieldState }) => (
                                        <>
                                        
                                            <label>Sku X3*</label>
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
                                    name="sku_mantis"
                                    control={form.control}
                                    rules={{ 
                                        required: 'Sku Mantis is required.'
                                    }}
                                    render={({ field, fieldState }) => (
                                        <>
                                        
                                            <label>Sku Mantis*</label>
                                            <InputText id={field.name} 
                                                value={field.value} 
                                                type="text" 
                                                className={classNames({ 'p-invalid': fieldState.error })} 
                                                onBlur={handleBlur}
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
                                    name="uom_x3"
                                    control={form.control}
                                 
                                    render={({ field, fieldState }) => (
                                        <>
                                        
                                            <label>Uom X3</label>
                                            <Dropdown id={field.name} 
                                                value={field.value} 
                                                key={field.name} 
                                                optionValue="unt_Code" 
                                                optionLabel="unt_Code" 
                                                onChange={(e) => field.onChange(e.target.value)} 
                                                options={dropdownUOMList} 
                                                placeholder="Select" 
                                                className={classNames({ 'p-invalid': fieldState.error })} 
                                            />
                                            {getFormErrorMessage(field.name)}

                                        </>
                                    )}
                                />
                            </div>

                          

                            <div className="field col-12 md:col-6">
                                <Controller
                                    name="uom_mantis"
                                    control={form.control}
                                    rules={{ 
                                        required: 'Uom Mantis is required.'
                                    }}
                                    render={({ field, fieldState }) => (
                                        <>
                                        
                                            <label>Uom Mantis*</label>
                                            <Dropdown id={field.name} 
                                                value={field.value} 
                                                key={field.name} 
                                                optionValue="unt_Code" 
                                                optionLabel="unt_Code" 
                                                onChange={(e) => field.onChange(e.target.value)} 
                                                options={dropdownUOMList} 
                                                placeholder="Select" 
                                                className={classNames({ 'p-invalid': fieldState.error })} 
                                            />
                                            {getFormErrorMessage(field.name)}

                                        </>
                                    )}
                                />
                            </div>

                            <div className="field col-12 md:col-1">
                                <Controller
                                    name="receiving"
                                    control={form.control}
                                  
                                    render={({ field, fieldState }) => (
                                        <>
                                        
                                            <p>Receiving</p>
                                            <InputSwitch inputId={field.name} checked={field.value} inputRef={field.ref} className={classNames({ 'p-invalid': fieldState.error })} onChange={(e) => field.onChange(e.value)} />
                                            {getFormErrorMessage(field.name)}

                                        </>
                                    )}
                                />
                            </div>

                            {/* <div className="field col-12 md:col-4">
                                <Controller
                                    name="receiving"
                                    control={form.control}
                                    rules={{ 
                                        required: 'Receiving is required.'
                                    }}
                                    render={({ field, fieldState }) => (
                                        <>
                                        
                                            <label>Receiving*</label>
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
                            </div> */}

                            <div className="field col-12 md:col-1">
                                <Controller
                                    name="shipping"
                                    control={form.control}
                                   
                                    render={({ field, fieldState }) => (
                                        <>
                                        
                                        <p>Shipping</p>
                                        <InputSwitch inputId={field.name} checked={field.value} inputRef={field.ref} className={classNames({ 'p-invalid': fieldState.error })} onChange={(e) => field.onChange(e.value)} />
                                        {getFormErrorMessage(field.name)}

                                        </>
                                    )}
                                />
                            </div>

                            <div className="field col-12 md:col-1">
                                <Controller
                                    name="is_kit_item"
                                    control={form.control}
                             
                                    render={({ field, fieldState }) => (
                                        <>
                                        
                                        <p>Is Kit</p>
                                        <InputSwitch inputId={field.name} checked={field.value} inputRef={field.ref} className={classNames({ 'p-invalid': fieldState.error })} onChange={(e) => field.onChange(e.value)} />
                                        {getFormErrorMessage(field.name)}

                                        </>
                                    )}
                                />
                            </div>

                            <div className="field col-12 md:col-1">
                                <Controller
                                    name="is_ship_item"
                                    control={form.control}
                             
                                    render={({ field, fieldState }) => (
                                        <>
                                        
                                        <p>Is Ship</p>
                                        <InputSwitch inputId={field.name} checked={field.value} inputRef={field.ref} className={classNames({ 'p-invalid': fieldState.error })} onChange={(e) => field.onChange(e.value)} />
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

