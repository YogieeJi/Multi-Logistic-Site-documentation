import React, { useEffect, useRef, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Controller, useForm } from 'react-hook-form';
import { classNames } from 'primereact/utils';

import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { ProductService } from '../../../../service/products/ProductService';
import { Toast } from 'primereact/toast';
import { useDispatch } from 'react-redux';
import { addData } from '../../../../store/formMessage.slice';
import { matchPath, useLocation, useNavigate, useParams } from 'react-router-dom';
import { BoxAdditionService } from '../../../../service/products/BoxAdditionService';

export default function AddBoxAddition(){
    const [loading, setLoading] = useState(false);
    const toast = useRef(null);
    const dispatch = useDispatch()
    const navigate = useNavigate();
    const params = useParams();
    const routePath = useLocation();
    const [productDetail, setProductDetail] = useState(null);
    const matchedPath = matchPath({path:'/products/box-addition/edit',end:false},routePath.pathname);

    const [heading, setHeading] = useState('Add Box Addition');

    const [boxSKURule, setBoxSKURule] = useState({});
    const [boxUPCRule, setBoxUPCRule] = useState({});
    const [boxUnitsRule, setBoxUnitsRule] = useState({});

    const [eaSKURule, setEaSKURule] = useState({});
    const [eaUPCRule, setEaUPCRule] = useState({});
    const [eaUnitsRule, setEaUnitsRule] = useState({});

    const [levelDisabled, setlevelDisabled] = useState(true);

    // let networkTimeout = null;

    
    let defaultValues = { 
        item_code: '',
        box_sku: '',
        box_uom: '',
        box_upc: '',
        box_units: '',
      
    };

    useEffect(() => {
        if(matchedPath !== null){
            getDetails();
            setHeading('Edit Box Addition');
        }
    }, []);

    const getDetails = () => {
        BoxAdditionService.getBoxAdditionDetail(params.id).then((data) => {
            setProductDetail(data.data);
            form.setValue('item_code',data.data.item_code??'');
            form.setValue('box_sku',data.data.box_sku??'');
            form.setValue('box_uom',data.data.box_uom??'');
            form.setValue('box_upc',data.data.box_upc??'');
            form.setValue('box_units',data.data.box_units??'');

            if(data.data.uom_2){
                setlevelDisabled(false);
            }
        });
    };

   
    const form = useForm({ defaultValues });
    const errors = form.formState.errors;

    let networkTimeout = null;


    const onSubmit = (data) => {
    
        setLoading(true);

        if (networkTimeout) {
            clearTimeout(networkTimeout);
        }
        data = {
            item_code: form.getValues('item_code'),
            box_sku: form.getValues('box_sku'),
            box_uom: form.getValues('box_uom'),
            box_upc: form.getValues('box_upc'),
            box_units: form.getValues('box_units'),
          
        }

        if(matchedPath === null){
            BoxAdditionService.addBoxAddition( (data) ).then((data) => {
                setLoading(false);
                if(data.error == 0){
                    form.reset();
                    dispatch(addData({severity: 'success', detail: data.message, summary: 'Box Addition Added'}));
                    // toast.current.show({ severity: 'success', summary: 'Product Created', detail: data.message});
                    navigate("/products/box-Addition")
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error in Box Addition', detail: data.message});
                }
            });
        } else{
            BoxAdditionService.updateBoxAddition(params.id, data).then((data) => {
                setLoading(false);
                if(data.error == 0){
                    form.reset();
                    dispatch(addData({severity: 'success', detail: data.message, summary: 'Box Addition Updated'}));
                    // toast.current.show({ severity: 'success', summary: 'Product Created', detail: data.message});
                    navigate("/products/box-Addition")
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error in Box Addition', detail: data.message});
                }
            });
        }
    };



    const getFormErrorMessage = (name) => {
        return errors[name] ? <small className="p-error">{errors[name].message}</small> : null;
    };

    const dropdownValuesUom = [
        { code: 'EA', name: 'EA' },
        { code: 'BX', name: 'BX' },
        { code: 'BG', name: 'BG' },
       
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
                        <h4>Box Addition Info</h4>
                        <br/>
                        <div className="p-fluid formgrid grid">
                            <div className="field col-12 md:col-4">
                                <Controller
                                    name="item_code"
                                    control={form.control}
                                    rules={{ 
                                        required: 'Item Code is required.'
                                    }}
                                    render={({ field, fieldState }) => (
                                        <>
                                        
                                            <label>Item Code*</label>
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
                            <div className="field col-12 md:col-4">
                                <Controller
                                    name="box_sku"
                                    control={form.control}
                                    rules={boxSKURule}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <label>Box SKU</label>
                                            <InputText id={field.name} 
                                                value={field.value} 
                                                type="text" 
                                                className={classNames({ 'p-invalid': fieldState.error })} 
                                                onChange={(e) => {
                                                    field.onChange(e.target.value)
                                                    if(e.target.value == ''){
                                                        setBoxUPCRule({})
                                                        setBoxUnitsRule({})
                                                    } else{
                                                        setBoxUPCRule({
                                                            required: 'Box UPC is required.'
                                                        })
                                                        setBoxUnitsRule({
                                                            required: 'Box Units is required.'
                                                        })
                                                    }
                                                }} 
                                            />
                                            {getFormErrorMessage(field.name)}
                                        </>
                                    )}
                                />
                            </div>
                            <div className="field col-12 md:col-4">
                                <Controller
                                    name="box_uom"
                                    control={form.control}
                                    rules={boxUPCRule}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <label>Box UOM</label>
                                            <Dropdown id={field.name} value={field.value} key={field.name} style={{marginRight:5, marginLeft:10}} optionValue="code" optionLabel="name" onChange={(e) => field.onChange(e.target.value)} options={dropdownValuesUom} placeholder="Select" className={classNames({ 'p-invalid': fieldState.error })} />
                                            {getFormErrorMessage(field.name)}
                                        </>
                                    )}
                                />
                            </div>

                            <div className="field col-12 md:col-4">
                                <Controller
                                    name="box_upc"
                                    control={form.control}
                                    rules={boxUPCRule}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <label>Box UPC</label>
                                            <InputText id={field.name} 
                                                value={field.value} 
                                                type="text" 
                                                className={classNames({ 'p-invalid': fieldState.error })} 
                                                onChange={(e) => {
                                                    field.onChange(e.target.value)
                                                    setBoxSKURule({
                                                        required: 'Box SKU is required.'
                                                    })
                                                    setBoxUnitsRule({
                                                        required: 'Box Units is required.'
                                                    })
                                                }} 
                                            />
                                            {getFormErrorMessage(field.name)}
                                        </>
                                    )}
                                />
                            </div>

                            

                           

                            <div className="field col-12 md:col-4">
                                <Controller
                                    name="box_units"
                                    control={form.control}
                                    rules={boxUnitsRule}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <label>Box Units</label>
                                            <InputText id={field.name} value={field.value} type="text" className={classNames({ 'p-invalid': fieldState.error })} onChange={(e) => field.onChange(e.target.value)} />
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

