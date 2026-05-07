
import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Dropdown } from 'primereact/dropdown';
import { Controller, useForm } from 'react-hook-form';
import { Button } from 'primereact/button';
import { classNames } from 'primereact/utils';
import { Toast } from 'primereact/toast';
import { BreadCrumb } from 'primereact/breadcrumb';
import { ContainerUnloadService } from '../../../service/operations/container-unload';

export default function ContainerUnload() {

    const [loading, setLoading] = useState(false);
    let id = null;


    const toast = useRef(null);
    const defaultValues = { id: null};
    const form = useForm({ defaultValues });
    const errors = form.formState.errors;

    const [selectedReceipt, setSelectedReceipt] = useState([]);
   

    const params = useParams();

 const items = [{ label: 'Other' }, { label: 'Container Unload'}];
    const home = { icon: 'pi pi-home', url: '/' }
    useEffect(() => {
        loadLazyData();
    }, []);

    
   

    const loadLazyData = () => {
        let arr = [];
        ContainerUnloadService.getReceiptCodes().then((data) => {
 
            setSelectedReceipt(data.data);
        });
      

    };

    const onSubmit = (data) => {
        //  show();
        // form.reset();
        // navigate('/');
        id = form.getValues('code').id;
        console.log(id)
        toast.current.show({ severity: 'success', summary: 'Receipt Sent Success', detail: 'Receipt Sent Successfully'});
        // dispatch(authActions.login({ id, password }))
        // .unwrap()
        // .then((originalPromiseResult) => {
        //     toast.current.show({ severity: 'success', summary: 'Login Success', detail: originalPromiseResult.message});
        // }).catch((rejectedValueOrSerializedError) => {
        //     toast.current.show({ severity: 'error', summary: 'Login Error', detail: 'Invalid Username or Password'});
        // });

    };

    const getFormErrorMessage = (name) => {
        return errors[name] ? <small className="p-error">{errors[name].message}</small> : null;
    };

    
    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                
            </div>
             <BreadCrumb model={items} home={home} />
            <div className="card mt-4">
            <Toast ref={toast} />
           <h3>Container Unloading</h3>
                    <div className="p-fluid formgrid grid">
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-column gap-2">
                        <div className="field col-12 md:col-12">
                            <h5 id="created_at">Receipt Code</h5>
                            <Controller
                                name="code"
                                control={form.control}
                                rules={{ required: 'Receipt Code is required.' }}
                                render={({ field, fieldState }) => (
                                    <Dropdown 
                                        value={field.value} 
                                        onChange={(e) => field.onChange(e.value)}
                                        options={selectedReceipt} 
                                        optionLabel="UserSelectionCode" 
                                        placeholder="Select Receipt Code" 
                                        filter 
                                        id={field.name}
                                        className={classNames({ 'p-invalid': fieldState.error })}
                                    />
                                )}
                            />
                            {getFormErrorMessage('code')}

                            
                        </div>
                            <Button label="Submit" type='submit' className="" ></Button>
                    </form>
                       
                    </div>
            </div>
        </>
       
    );
}
        