
import React, { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Dialog } from 'primereact/dialog';
import { Controller, useForm } from 'react-hook-form';
import { ShipperCaseUpcService } from '../../../../service/products/ShipperCaseUpcService';
import { InputText } from 'primereact/inputtext';
import { classNames } from 'primereact/utils';
import { Button } from 'primereact/button';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Toast } from 'primereact/toast';
import { Dropdown } from 'primereact/dropdown';
import { ProductService } from '../../../../service/products/ProductService';
import { PendingReceiptService } from '../../../../service/inbound/PendingReceiptService';



export default function PendingReceiptsList() {
    const [loading, setLoading] = useState(false);
    const [dropdownList, setdropdownList] = useState(null);
    let networkTimeout = null;
    const params = useParams();
    const toast = useRef(null);


    let defaultValues1 = { 
        pending_receipt: '',
    };

  

    const form1 = useForm({ defaultValues1 });
    const errors1 = form1.formState.errors;

    const items = [{ label: 'Other' }, { label: 'Pending Receipts'}];
    const home = { icon: 'pi pi-home', url: '/' }

    let list = [];

    useEffect(() => {
        loadLazyData();
    }, []);

    const loadLazyData = () => {
        PendingReceiptService.getPendingReceiptList().then((data) => {
            if((data.Data).length > 0){
                list = data.Data.map((a) => ({ label: a.rct_Code, value: a.rct_ID }));
                setdropdownList(list)
            } 
        });
    };


    const onSubmit = (data) => {
        setLoading(true);

        data = {
            pending_receipt: form1.getValues('pending_receipt')
        }
        

        PendingReceiptService.generatePlan( (data) ).then((data) => {
            setLoading(false);
            if(data.error == 0){
                toast.current.show({ severity: 'success', summary: 'Search Success', detail: data.message});
            } else{
                toast.current.show({ severity: 'error', summary: 'Search Error', detail: data.message});
            }
        });
    };

 
    const getFormErrorMessage1 = (name) => {
        return errors1[name] ? <small className="p-error">{errors1[name].message}</small> : null;
    };

 

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             
            </div>
            <h1></h1>
            <Toast ref={toast} />
       <BreadCrumb model={items} home={home} />
            <form onSubmit={form1.handleSubmit(onSubmit)} className="mt-4">
                <div className="card">
                       <h3>Pending Receipts</h3>
                    <h1></h1>
                    <div className="p-fluid formgrid grid">
                       <div className="field col-12 md:col-4">
                            <Controller
                                name="pending_receipt"
                                control={form1.control}
                                rules={{ 
                                    required: 'Pending Receipt is required.'
                                }}
                                render={({ field, fieldState }) => (
                                    <>
                                        <label>Select Pending Receipt</label>
                                        <Dropdown id={field.name} value={field.value} key={field.name} style={{marginRight:5, marginLeft:10}} optionValue="value" optionLabel="label" onChange={(e) => field.onChange(e.target.value)} options={dropdownList} placeholder="Select" className={classNames({ 'p-invalid': fieldState.error })} />

                                        {getFormErrorMessage1(field.name)}
                                    </>
                                )}
                            />
                        </div>

                    </div>
                    <Button label="Generate Receipt Plan" loading={loading} type='submit' className="w-3 mt-3" ></Button>

                </div>
            </form>

          
        </>

    );
}
