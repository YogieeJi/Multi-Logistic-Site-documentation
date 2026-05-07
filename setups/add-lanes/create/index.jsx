import React, { useEffect, useRef, useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Controller, useForm } from 'react-hook-form';
import { classNames } from 'primereact/utils';
import { Toast } from 'primereact/toast';
import { useDispatch } from 'react-redux';
import { addData } from '../../../../store/formMessage.slice';
import { matchPath, useLocation, useNavigate, useParams } from 'react-router-dom';
import { InputSwitch } from 'primereact/inputswitch';
import { InputNumber } from 'primereact/inputnumber';
import { LanesSetupService } from '../../../../service/setups/LanesSetupService';

export default function AddLanesSetup(){
    const [loading, setLoading] = useState(false);
    const toast = useRef(null);
    const dispatch = useDispatch()
    const navigate = useNavigate();
    const params = useParams();
    const routePath = useLocation();
    const matchedPath = matchPath({path:'/setup/lanes/edit',end:false},routePath.pathname);

    const [heading, setHeading] = useState('Add Lanes');

    let defaultValues = { 
        lane: '',
        slots_count: 0,
        is_active: true,
    };

    useEffect(() => {
        if(matchedPath !== null){
            getDetails();
            setHeading('Edit Lanes');
        }
    }, []);

    const getDetails = () => {
        LanesSetupService.getDetail(params.id).then((data) => {
            form.setValue('lane',data.data.lane??'');
            form.setValue('slots_count',data.data.slots_count??'');
            form.setValue('is_active',(data.data.is_active == 1) ? true : false ??'');
        });
    };

   
    const form = useForm({ defaultValues });
    const errors = form.formState.errors;

    let networkTimeout = null;

    const onSubmit = (data) => {

        data = {
            lane: form.getValues('lane'),
            slots_count: form.getValues('slots_count'),
            is_active: form.getValues('is_active'),
        }
        
        setLoading(true);
        if(matchedPath === null){
            LanesSetupService.add( (data) ).then((data) => {
                setLoading(false);
                if(data.error == 0){
                    form.reset();
                    dispatch(addData({severity: 'success', detail: data.message, summary: 'Lane Created'}));
                    navigate("/setup/lanes")
                } 
                else{
                    toast.current.show({ severity: 'error', summary: 'Error in Lane', detail: data.message});
                }
            });
        } else{
            LanesSetupService.update(params.id, data).then((data) => {
                setLoading(false);
                if(data.error == 0){
                    form.reset();
                    dispatch(addData({severity: 'success', detail: data.message, summary: 'Lane Updated'}));
                    navigate("/setup/lanes")
                } else{
                    toast.current.show({ severity: 'error', summary: 'Error in Lane', detail: data.message});
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
                                    name="lane"
                                    control={form.control}
                                    rules={{ 
                                        required: 'lane name is required.'
                                    }}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <label>Lane Name*</label>
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
                               
                            </div>

                            <div className="field col-12 md:col-6">
                                <Controller
                                    name="slots_count"
                                    control={form.control}
                                    rules={{ 
                                        required: 'slots count is required.'
                                    }}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <label>Slots Count*</label>
                                            <InputNumber id={field.name} 
                                                value={field.value} 
                                                className={classNames({ 'p-invalid': fieldState.error })} 
                                                onChange={(e) => {
                                                    field.onChange(e.value)
                                                }} 
                                            />
                                            {getFormErrorMessage(field.name)}

                                        </>
                                    )}
                                />
                            </div>

                          

                            <div className="field col-12 md:col-6">
                              
                            </div>

                            <div className="field col-12 md:col-1">
                                <Controller
                                    name="is_active"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <p>Is Active</p>
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

